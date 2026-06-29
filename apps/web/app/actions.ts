"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";
import { buildRRule } from "@/lib/missions/recurrence";

/**
 * Dashboard server actions. Every one routes through the command layer's
 * `dispatch()` — the same path the agent gateway will use (ADR 0007) — so the
 * UI never gets a privileged shortcut. They return an error string (or null) so
 * forms can surface failures.
 */

type ActionState = { error: string } | null;

export async function createStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.studentCreate,
    {
      name: String(formData.get("name") ?? ""),
      grade: String(formData.get("grade") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/");
  return null;
}

/** Combine an ISO date + HH:MM time into a UTC ISO datetime (tz deferred). */
function toUtcISO(date: string, time: string): string | undefined {
  if (!date) return undefined;
  if (!time) return `${date}T00:00:00.000Z`;
  return `${date}T${time}:00.000Z`;
}

/** Minutes between two HH:MM times (positive only; null if invalid/≤0). */
function diffMinutes(start: string, end: string): number | null {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  const d = eh * 60 + em - (sh * 60 + sm);
  return d > 0 ? d : null;
}

/**
 * Create a scheduled item on a student's calendar in one submit: title, subject/
 * track, a target duration (hours or minutes), an optional time range, and an
 * optional repeat (daily / weekly-by-weekday). Routes through the single
 * `schedule.block.create` command (ADR 0007); the block shows on Today (derived
 * on read, ADR 0006) and on the weekly Schedule. When a time range is given the
 * target is derived from it so the two always agree.
 */
export async function createScheduledTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const repeat = String(formData.get("repeat") ?? "none") as
    | "none"
    | "daily"
    | "weekly";
  const byweekday = formData.getAll("byweekday").map(String);

  // Target ↔ time consistency: a time range is authoritative for the duration;
  // otherwise use the typed value + unit. Clamp to the schema's 0–600 minutes.
  let estimatedMinutes: number | undefined;
  if (startTime && endTime) {
    const mins = diffMinutes(startTime, endTime);
    if (mins === null) return { error: "End time must be after start time." };
    estimatedMinutes = Math.min(600, mins);
  } else {
    const valueRaw = String(formData.get("targetValue") ?? "").trim();
    const unit = String(formData.get("targetUnit") ?? "hour");
    if (valueRaw !== "") {
      const value = Number(valueRaw);
      const mins = unit === "hour" ? value * 60 : value;
      estimatedMinutes = Math.min(600, Math.max(0, Math.round(mins)));
    }
  }

  const result = await dispatch(
    COMMANDS.scheduleBlockCreate,
    {
      studentId: String(formData.get("studentId") ?? ""),
      title: String(formData.get("title") ?? ""),
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      subjectTrackId: String(formData.get("subjectTrackId") ?? "") || undefined,
      startAt: toUtcISO(date, startTime),
      endAt: startTime && endTime ? toUtcISO(date, endTime) : undefined,
      recurrenceRule: buildRRule(repeat, byweekday) ?? undefined,
      estimatedMinutes,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/");
  revalidatePath("/manage");
  revalidatePath("/schedule");
  return null;
}

/** Rename a parent-owned task (RLS gates ownership via `created_by`). */
export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.taskUpdate,
    {
      id: String(formData.get("id") ?? ""),
      title: String(formData.get("title") ?? ""),
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/");
  revalidatePath("/manage");
  return null;
}

/** Delete a parent-owned task. Missions keep their history (FK set null). */
export async function deleteTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.taskDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/");
  revalidatePath("/manage");
  return null;
}

export async function assignTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.taskAssign,
    {
      taskId: String(formData.get("taskId") ?? ""),
      studentId: String(formData.get("studentId") ?? ""),
      date: String(formData.get("date") ?? "") || todayISO(),
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/");
  return null;
}

export async function completeMissionAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.missionComplete,
    { missionId: String(formData.get("missionId") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/");
}

/** Undo an accidental completion: flips a persisted mission back to not-done. */
export async function uncompleteMissionAction(
  formData: FormData,
): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.missionUncomplete,
    { missionId: String(formData.get("missionId") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/");
}

/** Remove a persisted mission from today (unwanted assignment or orphan). */
export async function deleteMissionAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.missionDelete,
    { missionId: String(formData.get("missionId") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/");
}

/**
 * Complete a *virtual* mission derived from a schedule block: the handler
 * materializes the dated mission (idempotent) then marks it done. Used by the
 * dashboard for items that have a `scheduleBlockId` but no persisted mission.
 */
export async function completeScheduledAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.missionCompleteScheduled,
    {
      studentId: String(formData.get("studentId") ?? ""),
      scheduleBlockId: String(formData.get("scheduleBlockId") ?? ""),
      date: String(formData.get("date") ?? "") || todayISO(),
    },
    uiCommandContext(parent),
  );
  revalidatePath("/");
}

/**
 * Save a per-task reflection note. Targets a persisted mission by id, or a
 * virtual scheduled block via (studentId, scheduleBlockId, date) which the
 * handler materializes first.
 */
export async function setMissionReflectionAction(
  formData: FormData,
): Promise<void> {
  const parent = await requireParent();
  const missionId = String(formData.get("missionId") ?? "");
  const scheduleBlockId = String(formData.get("scheduleBlockId") ?? "");
  await dispatch(
    COMMANDS.missionSetReflection,
    {
      missionId: missionId || undefined,
      studentId: missionId
        ? undefined
        : String(formData.get("studentId") ?? "") || undefined,
      scheduleBlockId: missionId ? undefined : scheduleBlockId || undefined,
      date: missionId
        ? undefined
        : String(formData.get("date") ?? "") || todayISO(),
      reflection: String(formData.get("reflection") ?? "").trim() || null,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/");
}

/**
 * Set a mission's progress (the "Partially done" toggle). `status` is
 * `in_progress` or `not_started`. Targets a persisted mission by id, or a virtual
 * scheduled block via (studentId, scheduleBlockId, date).
 */
export async function setMissionProgressAction(
  formData: FormData,
): Promise<void> {
  const parent = await requireParent();
  const missionId = String(formData.get("missionId") ?? "");
  const status = String(formData.get("status") ?? "in_progress") as
    | "not_started"
    | "in_progress"
    | "skipped";
  await dispatch(
    COMMANDS.missionSetStatus,
    {
      missionId: missionId || undefined,
      studentId: missionId
        ? undefined
        : String(formData.get("studentId") ?? "") || undefined,
      scheduleBlockId: missionId
        ? undefined
        : String(formData.get("scheduleBlockId") ?? "") || undefined,
      date: missionId
        ? undefined
        : String(formData.get("date") ?? "") || todayISO(),
      status,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/");
}

/**
 * Move a mission to a further date with an optional note. Targets a persisted
 * mission by id, or a virtual scheduled block via (studentId, scheduleBlockId,
 * date = source date). Returns an inline error (e.g. a non-later date).
 */
export async function deferMissionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const missionId = String(formData.get("missionId") ?? "");
  const result = await dispatch(
    COMMANDS.missionDefer,
    {
      missionId: missionId || undefined,
      studentId: missionId
        ? undefined
        : String(formData.get("studentId") ?? "") || undefined,
      scheduleBlockId: missionId
        ? undefined
        : String(formData.get("scheduleBlockId") ?? "") || undefined,
      date: missionId
        ? undefined
        : String(formData.get("date") ?? "") || todayISO(),
      toDate: String(formData.get("toDate") ?? ""),
      note: String(formData.get("note") ?? "").trim() || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/");
  return null;
}
