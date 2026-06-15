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
} from "@lockin/shared";
import type {
  Student,
  Task,
  DailyMission,
  Subject,
  SubjectTrack,
  StudentSubject,
  StudentSubjectTrack,
  ScheduleBlock,
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
