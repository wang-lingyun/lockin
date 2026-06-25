"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";
import { todayISO } from "@/lib/date";

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

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const hoursRaw = String(formData.get("targetHours") ?? "").trim();
  const result = await dispatch(
    COMMANDS.taskCreate,
    {
      title: String(formData.get("title") ?? ""),
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      subjectTrackId: String(formData.get("subjectTrackId") ?? "") || undefined,
      estimatedMinutes:
        hoursRaw === "" ? undefined : Math.round(Number(hoursRaw) * 60),
    },
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
