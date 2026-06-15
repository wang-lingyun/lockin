import type {
  StudentCreateInput,
  TaskCreateInput,
  TaskAssignInput,
  MissionCompleteInput,
  SubjectCreateInput,
  TrackCreateInput,
  SetSubjectPriorityInput,
  SetTrackPriorityInput,
} from "@lockin/shared";
import type {
  Student,
  Task,
  DailyMission,
  Subject,
  SubjectTrack,
  StudentSubject,
  StudentSubjectTrack,
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
