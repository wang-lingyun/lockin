"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Settings server actions for per-student subject/track priority. Both route
 * through the command layer's `dispatch()` (same path the agent gateway uses).
 * They take a plain FormData (the PriorityControl buttons submit it) and
 * revalidate the settings page so the new state shows immediately.
 */

export async function setSubjectPriorityAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.studentSetSubjectPriority,
    {
      studentId: String(formData.get("studentId") ?? ""),
      subjectId: String(formData.get("subjectId") ?? ""),
      priority: String(formData.get("priority") ?? ""),
    },
    uiCommandContext(parent),
  );
  revalidatePath("/settings");
}

export async function setTrackPriorityAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.studentSetTrackPriority,
    {
      studentId: String(formData.get("studentId") ?? ""),
      subjectTrackId: String(formData.get("subjectTrackId") ?? ""),
      priority: String(formData.get("priority") ?? ""),
    },
    uiCommandContext(parent),
  );
  revalidatePath("/settings");
}
