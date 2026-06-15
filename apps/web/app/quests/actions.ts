"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS, type WeeklyGoalStatus } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Quest Board server actions. All route through the command layer's `dispatch()`
 * (the same path the agent gateway uses). `createGoalAction` carries the
 * useActionState shape; the rest are plain form posts.
 */

type ActionState = { error: string } | null;

export async function createGoalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const targetRaw = String(formData.get("targetValue") ?? "").trim();

  const result = await dispatch(
    COMMANDS.weeklyGoalCreate,
    {
      studentId: String(formData.get("studentId") ?? ""),
      title: String(formData.get("title") ?? ""),
      weekStartDate: String(formData.get("weekStartDate") ?? ""),
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      subjectTrackId: String(formData.get("subjectTrackId") ?? "") || undefined,
      targetValue: targetRaw === "" ? undefined : Number(targetRaw),
      unit: String(formData.get("unit") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/quests");
  return null;
}

export async function incrementGoalAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.weeklyGoalIncrement,
    {
      id: String(formData.get("id") ?? ""),
      delta: Number(String(formData.get("delta") ?? "0")),
    },
    uiCommandContext(parent),
  );
  revalidatePath("/quests");
}

export async function setGoalStatusAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.weeklyGoalUpdate,
    {
      id: String(formData.get("id") ?? ""),
      status: String(formData.get("status") ?? "") as WeeklyGoalStatus,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/quests");
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.weeklyGoalDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/quests");
}
