import type {
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
  SubjectCreateInput,
  TrackCreateInput,
  SetSubjectPriorityInput,
  SetTrackPriorityInput,
  ScheduleBlockCreateInput,
  ScheduleBlockUpdateInput,
  ScheduleBlockDeleteInput,
  CompleteScheduledInput,
  WeeklyGoalCreateInput,
  WeeklyGoalUpdateInput,
  WeeklyGoalDeleteInput,
  WeeklyGoalIncrementInput,
  HomeworkSubmitInput,
  HomeworkReviewInput,
  MistakeCreateInput,
  MistakeUpdateInput,
  MistakeDeleteInput,
  ReflectionCreateInput,
  ReflectionUpdateInput,
} from "@lockin/shared";
import { homeworkSourceType } from "@lockin/shared";
import type {
  Student,
  Task,
  DailyMission,
  Subject,
  SubjectTrack,
  StudentSubject,
  StudentSubjectTrack,
  ScheduleBlock,
  WeeklyGoal,
  HomeworkSubmission,
  MistakeBankEntry,
  Reflection,
} from "@/lib/db/types";
import type { CommandContext } from "./types";

/**
 * Command handlers. Each assumes its input is already schema-validated by
 * `dispatch()`. Ownership is enforced by RLS + security-definer RPCs, so a
 * handler never has to trust the caller's claim about which student is theirs.
 */

export async function studentCreate(
  input: StudentCreateInput,
  ctx: CommandContext,
): Promise<Student> {
  const { data, error } = await ctx.supabase
    .rpc("create_student", { p_name: input.name, p_grade: input.grade ?? null })
    .single();
  if (error) throw new Error(error.message);
  return data as Student;
}

export async function taskCreate(
  input: TaskCreateInput,
  ctx: CommandContext,
): Promise<Task> {
  const { data, error } = await ctx.supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description ?? null,
      subject_id: input.subjectId ?? null,
      xp_value: input.xpValue,
      estimated_minutes: input.estimatedMinutes ?? null,
      created_by: ctx.parentUserId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Task;
}

export async function taskAssign(
  input: TaskAssignInput,
  ctx: CommandContext,
): Promise<DailyMission> {
  // Look up the task (RLS ensures it's the parent's own) to copy its subject.
  const { data: task, error: taskErr } = await ctx.supabase
    .from("tasks")
    .select("id, subject_id")
    .eq("id", input.taskId)
    .single();
  if (taskErr) throw new Error(taskErr.message);

  // Provenance: record the assignment, then materialize the dated mission.
  const { error: assignErr } = await ctx.supabase.from("task_assignments").insert({
    task_id: input.taskId,
    student_id: input.studentId,
    assigned_by: ctx.parentUserId,
    assigned_date: input.date,
  });
  if (assignErr) throw new Error(assignErr.message);

  const { data: mission, error: missionErr } = await ctx.supabase
    .from("daily_missions")
    .insert({
      student_id: input.studentId,
      task_id: input.taskId,
      subject_id: (task as { subject_id: string | null }).subject_id,
      date: input.date,
      status: "not_started",
    })
    .select()
    .single();
  if (missionErr) throw new Error(missionErr.message);
  return mission as DailyMission;
}

export async function missionComplete(
  input: MissionCompleteInput,
  ctx: CommandContext,
): Promise<Student> {
  const { data, error } = await ctx.supabase
    .rpc("complete_mission", { p_mission_id: input.missionId })
    .single();
  if (error) throw new Error(error.message);
  return data as Student;
}

export async function subjectCreate(
  input: SubjectCreateInput,
  ctx: CommandContext,
): Promise<Subject> {
  const { data, error } = await ctx.supabase
    .from("subjects")
    .insert({
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      is_default: false,
      owner_parent_id: ctx.parentUserId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Subject;
}

export async function trackCreate(
  input: TrackCreateInput,
  ctx: CommandContext,
): Promise<SubjectTrack> {
  const { data, error } = await ctx.supabase
    .from("subject_tracks")
    .insert({
      subject_id: input.subjectId,
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sort_order: input.sortOrder ?? 0,
      is_default: false,
      owner_parent_id: ctx.parentUserId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SubjectTrack;
}

export async function studentSetSubjectPriority(
  input: SetSubjectPriorityInput,
  ctx: CommandContext,
): Promise<StudentSubject> {
  const { data, error } = await ctx.supabase
    .from("student_subjects")
    .upsert(
      {
        student_id: input.studentId,
        subject_id: input.subjectId,
        priority_type: input.priority,
      },
      { onConflict: "student_id,subject_id" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudentSubject;
}

export async function studentSetTrackPriority(
  input: SetTrackPriorityInput,
  ctx: CommandContext,
): Promise<StudentSubjectTrack> {
  const { data, error } = await ctx.supabase
    .from("student_subject_tracks")
    .upsert(
      {
        student_id: input.studentId,
        subject_track_id: input.subjectTrackId,
        priority_type: input.priority,
      },
      { onConflict: "student_id,subject_track_id" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as StudentSubjectTrack;
}

export async function scheduleBlockCreate(
  input: ScheduleBlockCreateInput,
  ctx: CommandContext,
): Promise<ScheduleBlock> {
  const { data, error } = await ctx.supabase
    .from("schedule_blocks")
    .insert({
      student_id: input.studentId,
      title: input.title,
      subject_id: input.subjectId ?? null,
      subject_track_id: input.subjectTrackId ?? null,
      task_id: input.taskId ?? null,
      start_at: input.startAt ?? null,
      end_at: input.endAt ?? null,
      all_day: input.allDay ?? false,
      recurrence_rule: input.recurrenceRule ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ScheduleBlock;
}

export async function scheduleBlockUpdate(
  input: ScheduleBlockUpdateInput,
  ctx: CommandContext,
): Promise<ScheduleBlock> {
  const { id, ...rest } = input;
  // Map camelCase input keys to snake_case columns, including explicit nulls.
  const patch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    title: "title",
    subjectId: "subject_id",
    subjectTrackId: "subject_track_id",
    taskId: "task_id",
    startAt: "start_at",
    endAt: "end_at",
    allDay: "all_day",
    recurrenceRule: "recurrence_rule",
    location: "location",
    notes: "notes",
    status: "status",
  };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) patch[map[k]] = v;
  }

  const { data, error } = await ctx.supabase
    .from("schedule_blocks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ScheduleBlock;
}

export async function scheduleBlockDelete(
  input: ScheduleBlockDeleteInput,
  ctx: CommandContext,
): Promise<{ id: string }> {
  const { error } = await ctx.supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { id: input.id };
}

/**
 * Materialize a scheduled block into a dated mission (idempotent via the
 * (student, date, block) unique key), then complete it through the existing
 * `complete_mission` RPC so XP accounting stays in one place.
 */
export async function missionCompleteScheduled(
  input: CompleteScheduledInput,
  ctx: CommandContext,
): Promise<Student> {
  const { data: block, error: blockErr } = await ctx.supabase
    .from("schedule_blocks")
    .select("id, student_id, task_id, subject_id, subject_track_id")
    .eq("id", input.scheduleBlockId)
    .single();
  if (blockErr) throw new Error(blockErr.message);
  const b = block as Pick<
    ScheduleBlock,
    "id" | "student_id" | "task_id" | "subject_id" | "subject_track_id"
  >;

  await ctx.supabase.from("daily_missions").upsert(
    {
      student_id: b.student_id,
      task_id: b.task_id,
      subject_id: b.subject_id,
      subject_track_id: b.subject_track_id,
      schedule_block_id: b.id,
      date: input.date,
      status: "not_started",
    },
    { onConflict: "student_id,date,schedule_block_id", ignoreDuplicates: true },
  );

  const { data: mission, error: missionErr } = await ctx.supabase
    .from("daily_missions")
    .select("id")
    .eq("student_id", b.student_id)
    .eq("date", input.date)
    .eq("schedule_block_id", b.id)
    .single();
  if (missionErr) throw new Error(missionErr.message);

  const { data, error } = await ctx.supabase
    .rpc("complete_mission", { p_mission_id: (mission as { id: string }).id })
    .single();
  if (error) throw new Error(error.message);
  return data as Student;
}

export async function weeklyGoalCreate(
  input: WeeklyGoalCreateInput,
  ctx: CommandContext,
): Promise<WeeklyGoal> {
  const { data, error } = await ctx.supabase
    .from("weekly_goals")
    .insert({
      student_id: input.studentId,
      title: input.title,
      week_start_date: input.weekStartDate,
      subject_id: input.subjectId ?? null,
      subject_track_id: input.subjectTrackId ?? null,
      target_value: input.targetValue ?? null,
      unit: input.unit ?? null,
      due_date: input.dueDate ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WeeklyGoal;
}

export async function weeklyGoalUpdate(
  input: WeeklyGoalUpdateInput,
  ctx: CommandContext,
): Promise<WeeklyGoal> {
  const { id, ...rest } = input;
  // Map camelCase input keys to snake_case columns, including explicit nulls.
  const patch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    title: "title",
    subjectId: "subject_id",
    subjectTrackId: "subject_track_id",
    weekStartDate: "week_start_date",
    targetValue: "target_value",
    currentValue: "current_value",
    unit: "unit",
    dueDate: "due_date",
    status: "status",
  };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) patch[map[k]] = v;
  }

  const { data, error } = await ctx.supabase
    .from("weekly_goals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WeeklyGoal;
}

export async function weeklyGoalDelete(
  input: WeeklyGoalDeleteInput,
  ctx: CommandContext,
): Promise<{ id: string }> {
  const { error } = await ctx.supabase
    .from("weekly_goals")
    .delete()
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { id: input.id };
}

/** Atomic progress bump via the `increment_weekly_goal` RPC (auto-completes). */
export async function weeklyGoalIncrement(
  input: WeeklyGoalIncrementInput,
  ctx: CommandContext,
): Promise<WeeklyGoal> {
  const { data, error } = await ctx.supabase
    .rpc("increment_weekly_goal", { p_goal_id: input.id, p_delta: input.delta })
    .single();
  if (error) throw new Error(error.message);
  return data as WeeklyGoal;
}

/**
 * Record a homework submission and its attachment metadata. The file bytes are
 * already in Storage (uploaded browser→Storage, ADR 0008); this only writes
 * Postgres rows. RLS (`with check owns_student`) enforces ownership on insert.
 * If the attachment insert fails, the submission row is rolled back so no
 * orphaned metadata is left behind.
 */
export async function homeworkSubmit(
  input: HomeworkSubmitInput,
  ctx: CommandContext,
): Promise<HomeworkSubmission> {
  const row: Record<string, unknown> = {
    student_id: input.studentId,
    subject_id: input.subjectId ?? null,
    subject_track_id: input.subjectTrackId ?? null,
    topic: input.topic ?? null,
    assignment_title: input.assignmentTitle ?? null,
    raw_text: input.rawText ?? null,
    student_notes: input.studentNotes ?? null,
    source_type: homeworkSourceType(input.attachments),
  };
  // Only set submission_date when provided; otherwise let the column default
  // (current_date) apply — inserting an explicit null would violate NOT NULL.
  if (input.submissionDate) row.submission_date = input.submissionDate;

  const { data, error } = await ctx.supabase
    .from("homework_submissions")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const submission = data as HomeworkSubmission;

  if (input.attachments && input.attachments.length > 0) {
    const { error: attErr } = await ctx.supabase
      .from("homework_attachments")
      .insert(
        input.attachments.map((a) => ({
          submission_id: submission.id,
          storage_path: a.storagePath,
          mime_type: a.mimeType,
          size_bytes: a.sizeBytes,
          original_name: a.originalName,
        })),
      );
    if (attErr) {
      // Roll back the submission so we never leave a row without its files.
      await ctx.supabase
        .from("homework_submissions")
        .delete()
        .eq("id", submission.id);
      throw new Error(attErr.message);
    }
  }

  return submission;
}

/** Parent review: set review status and optional notes. */
export async function homeworkReview(
  input: HomeworkReviewInput,
  ctx: CommandContext,
): Promise<HomeworkSubmission> {
  const patch: Record<string, unknown> = { review_status: input.reviewStatus };
  if (input.parentNotes !== undefined) patch.parent_notes = input.parentNotes;

  const { data, error } = await ctx.supabase
    .from("homework_submissions")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HomeworkSubmission;
}

/** Create a mistake-bank entry (AC 17). RLS enforces ownership on insert. */
export async function mistakeCreate(
  input: MistakeCreateInput,
  ctx: CommandContext,
): Promise<MistakeBankEntry> {
  const { data, error } = await ctx.supabase
    .from("mistake_bank_entries")
    .insert({
      student_id: input.studentId,
      subject_id: input.subjectId ?? null,
      subject_track_id: input.subjectTrackId ?? null,
      homework_submission_id: input.homeworkSubmissionId ?? null,
      title: input.title ?? null,
      topic: input.topic ?? null,
      mistake_description: input.mistakeDescription ?? null,
      correct_idea: input.correctIdea ?? null,
      mistake_type: input.mistakeType ?? null,
      retry_date: input.retryDate ?? null,
      status: input.status,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MistakeBankEntry;
}

export async function mistakeUpdate(
  input: MistakeUpdateInput,
  ctx: CommandContext,
): Promise<MistakeBankEntry> {
  const { id, ...rest } = input;
  // Map camelCase input keys to snake_case columns, including explicit nulls.
  const patch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    subjectId: "subject_id",
    subjectTrackId: "subject_track_id",
    homeworkSubmissionId: "homework_submission_id",
    title: "title",
    topic: "topic",
    mistakeDescription: "mistake_description",
    correctIdea: "correct_idea",
    mistakeType: "mistake_type",
    retryDate: "retry_date",
    status: "status",
  };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) patch[map[k]] = v;
  }

  const { data, error } = await ctx.supabase
    .from("mistake_bank_entries")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MistakeBankEntry;
}

export async function mistakeDelete(
  input: MistakeDeleteInput,
  ctx: CommandContext,
): Promise<{ id: string }> {
  const { error } = await ctx.supabase
    .from("mistake_bank_entries")
    .delete()
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { id: input.id };
}

/**
 * Create a daily reflection (AC 20). Only set `date` when provided so the column
 * default (today, Pacific) applies — inserting an explicit null would violate
 * NOT NULL (cf. the homework `submission_date` fix).
 */
export async function reflectionCreate(
  input: ReflectionCreateInput,
  ctx: CommandContext,
): Promise<Reflection> {
  const row: Record<string, unknown> = {
    student_id: input.studentId,
    what_finished: input.whatFinished ?? null,
    what_was_hard: input.whatWasHard ?? null,
    what_learned: input.whatLearned ?? null,
    what_to_do_next: input.whatToDoNext ?? null,
  };
  if (input.date) row.date = input.date;

  const { data, error } = await ctx.supabase
    .from("reflections")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Reflection;
}

export async function reflectionUpdate(
  input: ReflectionUpdateInput,
  ctx: CommandContext,
): Promise<Reflection> {
  const { id, ...rest } = input;
  // Map camelCase input keys to snake_case columns, including explicit nulls.
  const patch: Record<string, unknown> = {};
  const map: Record<string, string> = {
    whatFinished: "what_finished",
    whatWasHard: "what_was_hard",
    whatLearned: "what_learned",
    whatToDoNext: "what_to_do_next",
    parentComment: "parent_comment",
  };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) patch[map[k]] = v;
  }

  const { data, error } = await ctx.supabase
    .from("reflections")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Reflection;
}
