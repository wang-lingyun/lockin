/**
 * Row shapes for the Stage 1 tables (mirror of `db/migrations/0001_init.sql`).
 * Hand-maintained for now; can be replaced by `supabase gen types` later.
 */

export type Student = {
  id: string;
  name: string;
  grade: string | null;
  avatar: string | null;
  current_xp: number;
  current_level: number;
  current_streak: number;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  owner_parent_id: string | null;
};

export type PriorityType = "primary" | "bonus" | "inactive";

export type SubjectTrack = {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  owner_parent_id: string | null;
};

export type StudentSubject = {
  id: string;
  student_id: string;
  subject_id: string;
  priority_type: PriorityType;
};

export type StudentSubjectTrack = {
  id: string;
  student_id: string;
  subject_track_id: string;
  priority_type: PriorityType;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  subject_track_id: string | null;
  xp_value: number;
  estimated_minutes: number | null;
  created_by: string | null;
  created_at: string;
};

export type ScheduleBlockStatus = "planned" | "cancelled";

export type ScheduleBlock = {
  id: string;
  student_id: string;
  subject_id: string | null;
  subject_track_id: string | null;
  task_id: string | null;
  title: string;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  recurrence_rule: string | null;
  location: string | null;
  notes: string | null;
  status: ScheduleBlockStatus;
};

export type WeeklyGoalStatus = "active" | "completed" | "archived";

export type WeeklyGoal = {
  id: string;
  student_id: string;
  subject_id: string | null;
  subject_track_id: string | null;
  week_start_date: string;
  title: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  due_date: string | null;
  status: WeeklyGoalStatus;
  created_at: string;
  updated_at: string;
};

/** A weekly goal joined with its subject + track, as shown on the Quest Board. */
export type WeeklyGoalRow = WeeklyGoal & {
  subject: Pick<Subject, "id" | "name" | "color"> | null;
  track: Pick<SubjectTrack, "id" | "name" | "color"> | null;
};

export type HomeworkReviewStatus =
  | "submitted"
  | "reviewed"
  | "needs_correction"
  | "mastered";

export type HomeworkSourceType = "text" | "photo" | "pdf" | "code" | "link";

export type AiAnalysisStatus =
  | "not_started"
  | "queued"
  | "completed"
  | "failed";

export type HomeworkSubmission = {
  id: string;
  student_id: string;
  subject_id: string | null;
  subject_track_id: string | null;
  topic: string | null;
  assignment_title: string | null;
  submission_date: string;
  raw_text: string | null;
  source_type: HomeworkSourceType;
  student_notes: string | null;
  parent_notes: string | null;
  review_status: HomeworkReviewStatus;
  // AI-ready fields — present but unpopulated in the MVP.
  ai_analysis_status: AiAnalysisStatus;
  ai_summary: string | null;
  detected_skills: unknown | null;
  detected_mistakes: unknown | null;
  recommended_next_steps: unknown | null;
  created_at: string;
  updated_at: string;
};

export type HomeworkAttachment = {
  id: string;
  submission_id: string;
  storage_path: string | null;
  url: string | null;
  mime_type: string;
  size_bytes: number;
  original_name: string;
  created_at: string;
};

/** A submission joined with its subject/track and attachments, for the inbox. */
export type HomeworkSubmissionRow = HomeworkSubmission & {
  subject: Pick<Subject, "id" | "name" | "color"> | null;
  track: Pick<SubjectTrack, "id" | "name" | "color"> | null;
  attachments: HomeworkAttachment[];
};

export type MissionStatus = "not_started" | "in_progress" | "completed";

export type DailyMission = {
  id: string;
  student_id: string;
  task_id: string | null;
  subject_id: string | null;
  subject_track_id: string | null;
  schedule_block_id: string | null;
  date: string;
  status: MissionStatus;
  xp_awarded: number;
  completed_at: string | null;
};

/** A mission joined with its task + subject, as shown on the dashboard. */
export type MissionWithTask = DailyMission & {
  task: Pick<Task, "id" | "title" | "xp_value"> | null;
  subject: Pick<Subject, "id" | "name" | "color"> | null;
};
