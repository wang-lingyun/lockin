/**
 * Command input schemas — the single validation surface for every admin action.
 *
 * Both the parent UI (server actions) and the future agent gateway (Slack /
 * voice / API, ADR 0007) validate against these exact schemas, so there is
 * never a separate, less-strict path into the system. Keep this pure (zod only).
 */
import { z } from "zod";

const uuid = z.string().uuid();
const trimmed = (max: number) => z.string().trim().min(1).max(max);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** Create a student under the current parent (RPC `create_student`). */
export const StudentCreateInput = z.object({
  name: trimmed(80),
  grade: z.string().trim().max(40).optional(),
});
export type StudentCreateInput = z.infer<typeof StudentCreateInput>;

/** Create a reusable task (template) owned by the current parent. */
export const TaskCreateInput = z.object({
  title: trimmed(160),
  description: z.string().trim().max(2000).optional(),
  subjectId: uuid.optional(),
  subjectTrackId: uuid.optional(),
  estimatedMinutes: z.number().int().min(0).max(600).optional(),
});
export type TaskCreateInput = z.infer<typeof TaskCreateInput>;

/** Edit a parent-owned task. All editable fields optional (partial update). */
export const TaskUpdateInput = z.object({
  id: uuid,
  title: trimmed(160).optional(),
  description: z.string().trim().max(2000).optional(),
  subjectId: uuid.optional(),
  subjectTrackId: uuid.optional(),
  estimatedMinutes: z.number().int().min(0).max(600).optional(),
});
export type TaskUpdateInput = z.infer<typeof TaskUpdateInput>;

/** Delete a parent-owned task (RLS gates ownership via `created_by`). */
export const TaskDeleteInput = z.object({ id: uuid });
export type TaskDeleteInput = z.infer<typeof TaskDeleteInput>;

/**
 * Assign a task to a student on a date. In Stage 1 this directly materializes a
 * daily mission (calendar / schedule blocks arrive in Stage 3).
 * `date` is an ISO calendar date (YYYY-MM-DD).
 */
export const TaskAssignInput = z.object({
  taskId: uuid,
  studentId: uuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
});
export type TaskAssignInput = z.infer<typeof TaskAssignInput>;

/** Mark a mission complete (RPC `complete_mission`; idempotent). */
export const MissionCompleteInput = z.object({
  missionId: uuid,
});
export type MissionCompleteInput = z.infer<typeof MissionCompleteInput>;

/**
 * Undo an accidental completion (RPC `uncomplete_mission`; idempotent). A
 * completed item on Today is always a persisted mission, so a missionId suffices.
 */
export const MissionUncompleteInput = z.object({
  missionId: uuid,
});
export type MissionUncompleteInput = z.infer<typeof MissionUncompleteInput>;

/**
 * A student's relationship to a subject/track (ADR 0005). `primary` = core,
 * `bonus` = optional/enrichment, `inactive` = explicitly off. Absence of a row
 * also means inactive.
 */
export const PriorityType = z.enum(["primary", "bonus", "inactive"]);
export type PriorityType = z.infer<typeof PriorityType>;

/** Create a custom subject owned by the current parent. */
export const SubjectCreateInput = z.object({
  name: trimmed(60),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(40).optional(),
  color: z.string().trim().max(20).optional(),
});
export type SubjectCreateInput = z.infer<typeof SubjectCreateInput>;

/** Rename / restyle a parent-owned subject (RLS blocks edits to defaults). */
export const SubjectUpdateInput = z.object({
  id: uuid,
  name: trimmed(60).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(20).nullable().optional(),
});
export type SubjectUpdateInput = z.infer<typeof SubjectUpdateInput>;

/** Delete a parent-owned subject (RLS blocks built-in/default subjects). */
export const SubjectDeleteInput = z.object({ id: uuid });
export type SubjectDeleteInput = z.infer<typeof SubjectDeleteInput>;

/** Create a track (sub-subject) under a subject. */
export const TrackCreateInput = z.object({
  subjectId: uuid,
  name: trimmed(60),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(40).optional(),
  color: z.string().trim().max(20).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});
export type TrackCreateInput = z.infer<typeof TrackCreateInput>;

/** Rename / restyle / (de)activate a parent-owned track. */
export const TrackUpdateInput = z.object({
  id: uuid,
  name: trimmed(60).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(20).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});
export type TrackUpdateInput = z.infer<typeof TrackUpdateInput>;

/** Delete a parent-owned track (RLS blocks built-in/default tracks). */
export const TrackDeleteInput = z.object({ id: uuid });
export type TrackDeleteInput = z.infer<typeof TrackDeleteInput>;

/** Set a student's priority for a subject (upsert). */
export const SetSubjectPriorityInput = z.object({
  studentId: uuid,
  subjectId: uuid,
  priority: PriorityType,
});
export type SetSubjectPriorityInput = z.infer<typeof SetSubjectPriorityInput>;

/** Set a student's priority for a track (upsert). */
export const SetTrackPriorityInput = z.object({
  studentId: uuid,
  subjectTrackId: uuid,
  priority: PriorityType,
});
export type SetTrackPriorityInput = z.infer<typeof SetTrackPriorityInput>;

/**
 * A planned study session on a student's calendar (ADR 0006). `startAt`/`endAt`
 * are ISO datetimes; `recurrenceRule` is an iCal RRULE expanded on read.
 */
export const ScheduleBlockCreateInput = z.object({
  studentId: uuid,
  title: trimmed(160),
  subjectId: uuid.optional(),
  subjectTrackId: uuid.optional(),
  taskId: uuid.optional(),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional(),
  allDay: z.boolean().optional(),
  recurrenceRule: z.string().trim().max(500).optional(),
  estimatedMinutes: z.number().int().min(0).max(600).optional(),
  location: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type ScheduleBlockCreateInput = z.infer<typeof ScheduleBlockCreateInput>;

/** Partial update of a schedule block (by id). */
export const ScheduleBlockUpdateInput = z.object({
  id: uuid,
  title: trimmed(160).optional(),
  subjectId: uuid.nullable().optional(),
  subjectTrackId: uuid.nullable().optional(),
  taskId: uuid.nullable().optional(),
  startAt: z.string().datetime({ offset: true }).nullable().optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  allDay: z.boolean().optional(),
  recurrenceRule: z.string().trim().max(500).nullable().optional(),
  estimatedMinutes: z.number().int().min(0).max(600).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["planned", "cancelled"]).optional(),
});
export type ScheduleBlockUpdateInput = z.infer<typeof ScheduleBlockUpdateInput>;

export const ScheduleBlockDeleteInput = z.object({ id: uuid });
export type ScheduleBlockDeleteInput = z.infer<typeof ScheduleBlockDeleteInput>;

/**
 * Complete a scheduled block for a date — materializes its mission (idempotent)
 * then completes it. `date` is an ISO calendar date (YYYY-MM-DD).
 */
export const CompleteScheduledInput = z.object({
  studentId: uuid,
  scheduleBlockId: uuid,
  date: isoDate,
});
export type CompleteScheduledInput = z.infer<typeof CompleteScheduledInput>;

/**
 * Set a student's reflection note on a single mission (per-task reflection).
 * Targets either a persisted `missionId`, or a *virtual* scheduled block via
 * (`studentId`, `scheduleBlockId`, `date`) — which the handler materializes
 * first. `reflection` is nullable so a note can be cleared.
 */
export const MissionSetReflectionInput = z
  .object({
    missionId: uuid.optional(),
    studentId: uuid.optional(),
    scheduleBlockId: uuid.optional(),
    date: isoDate.optional(),
    reflection: z.string().trim().max(2000).nullable(),
  })
  .refine(
    (d) =>
      Boolean(d.missionId) ||
      Boolean(d.studentId && d.scheduleBlockId && d.date),
    {
      message:
        "Provide missionId, or studentId + scheduleBlockId + date for a scheduled block.",
    },
  );
export type MissionSetReflectionInput = z.infer<
  typeof MissionSetReflectionInput
>;

/** A weekly goal's lifecycle (Quest Board, PRD §10.6). */
export const WeeklyGoalStatus = z.enum(["active", "completed", "archived"]);
export type WeeklyGoalStatus = z.infer<typeof WeeklyGoalStatus>;

/**
 * Create an outcome-based weekly goal for a student (Quest Board). Scoped to a
 * calendar week (`weekStartDate`, ISO YYYY-MM-DD); progress is tracked manually
 * in the MVP. `subjectId` / `subjectTrackId` are optional track attribution.
 */
export const WeeklyGoalCreateInput = z.object({
  studentId: uuid,
  title: trimmed(160),
  weekStartDate: isoDate,
  subjectId: uuid.optional(),
  subjectTrackId: uuid.optional(),
  targetValue: z.number().nonnegative().max(100000).optional(),
  unit: z.string().trim().max(40).optional(),
  dueDate: isoDate.optional(),
});
export type WeeklyGoalCreateInput = z.infer<typeof WeeklyGoalCreateInput>;

/** Partial update of a weekly goal (by id). */
export const WeeklyGoalUpdateInput = z.object({
  id: uuid,
  title: trimmed(160).optional(),
  subjectId: uuid.nullable().optional(),
  subjectTrackId: uuid.nullable().optional(),
  weekStartDate: isoDate.optional(),
  targetValue: z.number().nonnegative().max(100000).nullable().optional(),
  currentValue: z.number().nonnegative().max(100000).optional(),
  unit: z.string().trim().max(40).nullable().optional(),
  dueDate: isoDate.nullable().optional(),
  status: WeeklyGoalStatus.optional(),
});
export type WeeklyGoalUpdateInput = z.infer<typeof WeeklyGoalUpdateInput>;

export const WeeklyGoalDeleteInput = z.object({ id: uuid });
export type WeeklyGoalDeleteInput = z.infer<typeof WeeklyGoalDeleteInput>;

/** Atomically bump a goal's progress (RPC `increment_weekly_goal`). */
export const WeeklyGoalIncrementInput = z.object({
  id: uuid,
  delta: z.number().min(-100000).max(100000),
});
export type WeeklyGoalIncrementInput = z.infer<typeof WeeklyGoalIncrementInput>;

/**
 * Homework Inbox (PRD §10.8; ADR 0008). Allowed attachment types and per-file
 * size cap — one source of truth shared by the client (pre-upload validation),
 * the command schema, and the Storage bucket policy. Decided: images + PDF
 * only, 5 MB/file.
 */
export const HOMEWORK_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/heic",
  "application/pdf",
] as const;
export const HOMEWORK_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const HOMEWORK_MAX_ATTACHMENTS = 10;

/** A submission's review lifecycle (parent-driven). */
export const HomeworkReviewStatus = z.enum([
  "submitted",
  "reviewed",
  "needs_correction",
  "mastered",
]);
export type HomeworkReviewStatus = z.infer<typeof HomeworkReviewStatus>;

/**
 * Metadata for one uploaded file. The browser uploads the bytes directly to
 * Supabase Storage (never through a Vercel function, ADR 0008), then submits
 * this metadata; `storagePath` is the resulting object key.
 */
export const HomeworkAttachmentInput = z.object({
  storagePath: trimmed(500),
  mimeType: z.enum(HOMEWORK_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(HOMEWORK_MAX_FILE_BYTES),
  originalName: trimmed(255),
});
export type HomeworkAttachmentInput = z.infer<typeof HomeworkAttachmentInput>;

/**
 * Submit a homework artifact for a student. A submission must carry text and/or
 * at least one attachment. `subjectId` / `subjectTrackId` are optional track
 * attribution (ADR 0005); `submissionDate` defaults to today server-side.
 */
export const HomeworkSubmitInput = z
  .object({
    studentId: uuid,
    subjectId: uuid.optional(),
    subjectTrackId: uuid.optional(),
    topic: z.string().trim().max(120).optional(),
    assignmentTitle: z.string().trim().max(200).optional(),
    submissionDate: isoDate.optional(),
    rawText: z.string().trim().max(20000).optional(),
    studentNotes: z.string().trim().max(2000).optional(),
    attachments: HomeworkAttachmentInput.array()
      .max(HOMEWORK_MAX_ATTACHMENTS)
      .optional(),
  })
  .refine(
    (s) => (s.rawText?.length ?? 0) > 0 || (s.attachments?.length ?? 0) > 0,
    { message: "a submission needs text or at least one file" },
  );
export type HomeworkSubmitInput = z.infer<typeof HomeworkSubmitInput>;

/** Parent review of a submission: set status and (optionally) parent notes. */
export const HomeworkReviewInput = z.object({
  id: uuid,
  reviewStatus: HomeworkReviewStatus,
  parentNotes: z.string().trim().max(2000).nullable().optional(),
});
export type HomeworkReviewInput = z.infer<typeof HomeworkReviewInput>;

/**
 * Derive a submission's `source_type` from its attachments (pure; used by the
 * submit handler). PDF wins over image; no files ⇒ plain text.
 */
export function homeworkSourceType(
  attachments?: { mimeType: string }[] | null,
): "text" | "photo" | "pdf" {
  if (!attachments || attachments.length === 0) return "text";
  if (attachments.some((a) => a.mimeType === "application/pdf")) return "pdf";
  if (attachments.some((a) => a.mimeType.startsWith("image/"))) return "photo";
  return "text";
}

/**
 * Mistake/Revision Bank (PRD §10.9). An entry's lifecycle: `needs_review` →
 * `reviewed` → `mastered`. Absence of a row simply means no tracked mistake.
 */
export const MISTAKE_STATUSES = [
  "needs_review",
  "reviewed",
  "mastered",
] as const;
export const MistakeStatus = z.enum(MISTAKE_STATUSES);
export type MistakeStatus = z.infer<typeof MistakeStatus>;

/**
 * Create a mistake-bank entry for a student (AC 17). Optional subject/track
 * attribution (ADR 0005) and an optional link back to the homework submission it
 * came from (AC 18). An entry must carry at least a title or a description, so we
 * never store a blank row.
 */
export const MistakeCreateInput = z
  .object({
    studentId: uuid,
    subjectId: uuid.optional(),
    subjectTrackId: uuid.optional(),
    homeworkSubmissionId: uuid.optional(),
    title: z.string().trim().max(200).optional(),
    topic: z.string().trim().max(120).optional(),
    mistakeDescription: z.string().trim().max(5000).optional(),
    correctIdea: z.string().trim().max(5000).optional(),
    mistakeType: z.string().trim().max(80).optional(),
    retryDate: isoDate.optional(),
    status: MistakeStatus.default("needs_review"),
  })
  .refine(
    (m) => (m.title?.length ?? 0) > 0 || (m.mistakeDescription?.length ?? 0) > 0,
    { message: "a mistake needs a title or a description" },
  );
export type MistakeCreateInput = z.infer<typeof MistakeCreateInput>;

/** Partial update of a mistake-bank entry (by id), including status changes. */
export const MistakeUpdateInput = z.object({
  id: uuid,
  subjectId: uuid.nullable().optional(),
  subjectTrackId: uuid.nullable().optional(),
  homeworkSubmissionId: uuid.nullable().optional(),
  title: z.string().trim().max(200).nullable().optional(),
  topic: z.string().trim().max(120).nullable().optional(),
  mistakeDescription: z.string().trim().max(5000).nullable().optional(),
  correctIdea: z.string().trim().max(5000).nullable().optional(),
  mistakeType: z.string().trim().max(80).nullable().optional(),
  retryDate: isoDate.nullable().optional(),
  status: MistakeStatus.optional(),
});
export type MistakeUpdateInput = z.infer<typeof MistakeUpdateInput>;

export const MistakeDeleteInput = z.object({ id: uuid });
export type MistakeDeleteInput = z.infer<typeof MistakeDeleteInput>;

/**
 * Daily reflection (PRD §10.11, AC 20). The four prompts are: what did I finish,
 * what was hard, what did I learn, what should I do next. At least one must be
 * filled. `date` defaults to today (Pacific) server-side; one reflection per day
 * (DB unique on student_id+date) — re-saving the same day edits via update.
 */
export const ReflectionCreateInput = z
  .object({
    studentId: uuid,
    date: isoDate.optional(),
    whatFinished: z.string().trim().max(4000).optional(),
    whatWasHard: z.string().trim().max(4000).optional(),
    whatLearned: z.string().trim().max(4000).optional(),
    whatToDoNext: z.string().trim().max(4000).optional(),
  })
  .refine(
    (r) =>
      (r.whatFinished?.length ?? 0) > 0 ||
      (r.whatWasHard?.length ?? 0) > 0 ||
      (r.whatLearned?.length ?? 0) > 0 ||
      (r.whatToDoNext?.length ?? 0) > 0,
    { message: "write at least one part of the reflection" },
  );
export type ReflectionCreateInput = z.infer<typeof ReflectionCreateInput>;

/** Partial update of a reflection (by id): student prompts and/or parent comment. */
export const ReflectionUpdateInput = z.object({
  id: uuid,
  whatFinished: z.string().trim().max(4000).nullable().optional(),
  whatWasHard: z.string().trim().max(4000).nullable().optional(),
  whatLearned: z.string().trim().max(4000).nullable().optional(),
  whatToDoNext: z.string().trim().max(4000).nullable().optional(),
  parentComment: z.string().trim().max(4000).nullable().optional(),
});
export type ReflectionUpdateInput = z.infer<typeof ReflectionUpdateInput>;

/**
 * Coding Project Tracker (PRD §10.10, AC 19). A project's lifecycle is
 * active → completed → archived; features under it are not_started →
 * in_progress → completed.
 */
export const CODING_PROJECT_STATUSES = [
  "active",
  "completed",
  "archived",
] as const;
export const CodingProjectStatus = z.enum(CODING_PROJECT_STATUSES);
export type CodingProjectStatus = z.infer<typeof CodingProjectStatus>;

export const CODING_FEATURE_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
] as const;
export const CodingFeatureStatus = z.enum(CODING_FEATURE_STATUSES);
export type CodingFeatureStatus = z.infer<typeof CodingFeatureStatus>;

/** Create a coding project for a student. */
export const CodingProjectCreateInput = z.object({
  studentId: uuid,
  projectName: trimmed(160),
  goal: z.string().trim().max(2000).optional(),
  description: z.string().trim().max(2000).optional(),
  demoLink: z.string().trim().max(500).optional(),
  githubLink: z.string().trim().max(500).optional(),
});
export type CodingProjectCreateInput = z.infer<typeof CodingProjectCreateInput>;

/** Partial update of a coding project (by id), including status changes. */
export const CodingProjectUpdateInput = z.object({
  id: uuid,
  projectName: trimmed(160).optional(),
  goal: z.string().trim().max(2000).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  demoLink: z.string().trim().max(500).nullable().optional(),
  githubLink: z.string().trim().max(500).nullable().optional(),
  reflectionNotes: z.string().trim().max(4000).nullable().optional(),
  status: CodingProjectStatus.optional(),
});
export type CodingProjectUpdateInput = z.infer<typeof CodingProjectUpdateInput>;

export const CodingProjectDeleteInput = z.object({ id: uuid });
export type CodingProjectDeleteInput = z.infer<typeof CodingProjectDeleteInput>;

/** Add a feature (checklist item) to a coding project. */
export const CodingFeatureCreateInput = z.object({
  projectId: uuid,
  title: trimmed(200),
  description: z.string().trim().max(2000).optional(),
});
export type CodingFeatureCreateInput = z.infer<typeof CodingFeatureCreateInput>;

/** Partial update of a coding feature's text (by id). */
export const CodingFeatureUpdateInput = z.object({
  id: uuid,
  title: trimmed(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});
export type CodingFeatureUpdateInput = z.infer<typeof CodingFeatureUpdateInput>;

export const CodingFeatureDeleteInput = z.object({ id: uuid });
export type CodingFeatureDeleteInput = z.infer<typeof CodingFeatureDeleteInput>;

/** Set a coding feature's status (RPC `set_coding_feature_status`). */
export const CodingFeatureSetStatusInput = z.object({
  id: uuid,
  status: CodingFeatureStatus,
});
export type CodingFeatureSetStatusInput = z.infer<
  typeof CodingFeatureSetStatusInput
>;

// Rewards and manual XP adjustment were removed with the XP/Levels system
// (ADR 0010, PRD §10.12 amended). Motivation is the streak alone.
