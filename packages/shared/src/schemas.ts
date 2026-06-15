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
  xpValue: z.number().int().min(0).max(1000).default(10),
  estimatedMinutes: z.number().int().min(0).max(600).optional(),
});
export type TaskCreateInput = z.infer<typeof TaskCreateInput>;

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
