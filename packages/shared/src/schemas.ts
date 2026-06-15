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
