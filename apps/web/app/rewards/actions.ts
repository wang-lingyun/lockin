"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Rewards + manual XP server actions. All route through the command layer's
 * `dispatch()`. `createRewardAction` and `adjustXpAction` carry the
 * useActionState shape; deletes are plain form posts.
 */

type ActionState = { error: string } | null;

export async function createRewardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const rawXp = String(formData.get("requiredXp") ?? "").trim();
  const result = await dispatch(
    COMMANDS.rewardCreate,
    {
      studentId: String(formData.get("studentId") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      requiredXp: rawXp === "" ? undefined : Number(rawXp),
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/rewards");
  return null;
}

export async function deleteRewardAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.rewardDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/rewards");
}

export async function adjustXpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const result = await dispatch(
    COMMANDS.xpAdjust,
    {
      studentId: String(formData.get("studentId") ?? ""),
      amount: rawAmount === "" ? NaN : Number(rawAmount),
      reason: String(formData.get("reason") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/rewards");
  revalidatePath("/");
  return null;
}
