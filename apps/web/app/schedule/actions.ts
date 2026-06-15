"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";
import { buildRRule } from "@/lib/missions/recurrence";

/**
 * Schedule server actions. All route through the command layer's `dispatch()`
 * (the same path the agent gateway uses). The create action assembles ISO
 * datetimes + an RRULE from the form's friendly preset fields.
 */

type ActionState = { error: string } | null;

/** Combine an ISO date + HH:MM time into a UTC ISO datetime (tz deferred). */
function toUtcISO(date: string, time: string): string | undefined {
  if (!date) return undefined;
  if (!time) return `${date}T00:00:00.000Z`;
  return `${date}T${time}:00.000Z`;
}

export async function createBlockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const date = String(formData.get("date") ?? "");
  const allDay = formData.get("allDay") === "on";
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const repeat = String(formData.get("repeat") ?? "none") as
    | "none"
    | "daily"
    | "weekly";
  const byweekday = formData.getAll("byweekday").map(String);

  const result = await dispatch(
    COMMANDS.scheduleBlockCreate,
    {
      studentId: String(formData.get("studentId") ?? ""),
      title: String(formData.get("title") ?? ""),
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      subjectTrackId: String(formData.get("subjectTrackId") ?? "") || undefined,
      taskId: String(formData.get("taskId") ?? "") || undefined,
      allDay,
      startAt: allDay
        ? toUtcISO(date, "")
        : toUtcISO(date, startTime),
      endAt: allDay ? undefined : toUtcISO(date, endTime),
      recurrenceRule: buildRRule(repeat, byweekday) ?? undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/schedule");
  return null;
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.scheduleBlockDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/schedule");
}
