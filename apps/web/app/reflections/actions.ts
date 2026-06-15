"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Reflection server actions. All route through the command layer's `dispatch()`
 * (the same path the agent gateway uses). `saveReflectionAction` carries the
 * useActionState shape: it creates today's reflection or, when a hidden `id` is
 * present, edits the existing one. The parent-comment form posts plainly.
 */

type ActionState = { error: string } | null;

export async function saveReflectionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const id = String(formData.get("id") ?? "");

  const fields = {
    whatFinished: String(formData.get("whatFinished") ?? "") || undefined,
    whatWasHard: String(formData.get("whatWasHard") ?? "") || undefined,
    whatLearned: String(formData.get("whatLearned") ?? "") || undefined,
    whatToDoNext: String(formData.get("whatToDoNext") ?? "") || undefined,
  };

  const result = id
    ? await dispatch(
        COMMANDS.reflectionUpdate,
        { id, ...fields },
        uiCommandContext(parent),
      )
    : await dispatch(
        COMMANDS.reflectionCreate,
        {
          studentId: String(formData.get("studentId") ?? ""),
          date: String(formData.get("date") ?? "") || undefined,
          ...fields,
        },
        uiCommandContext(parent),
      );
  if (!result.ok) return { error: result.error };
  revalidatePath("/reflections");
  return null;
}

export async function commentReflectionAction(
  formData: FormData,
): Promise<void> {
  const parent = await requireParent();
  const comment = String(formData.get("parentComment") ?? "").trim();
  await dispatch(
    COMMANDS.reflectionUpdate,
    {
      id: String(formData.get("id") ?? ""),
      parentComment: comment === "" ? null : comment,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/reflections");
}
