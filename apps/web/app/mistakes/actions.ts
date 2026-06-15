"use server";

import { revalidatePath } from "next/cache";
import { COMMANDS, type MistakeStatus } from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Mistake/Revision Bank server actions. All route through the command layer's
 * `dispatch()` (the same path the agent gateway uses). `createMistakeAction`
 * carries the useActionState shape; the rest are plain form posts.
 */

type ActionState = { error: string } | null;

export async function createMistakeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();

  const result = await dispatch(
    COMMANDS.mistakeCreate,
    {
      studentId: String(formData.get("studentId") ?? ""),
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      subjectTrackId: String(formData.get("subjectTrackId") ?? "") || undefined,
      homeworkSubmissionId:
        String(formData.get("homeworkSubmissionId") ?? "") || undefined,
      title: String(formData.get("title") ?? "") || undefined,
      topic: String(formData.get("topic") ?? "") || undefined,
      mistakeDescription:
        String(formData.get("mistakeDescription") ?? "") || undefined,
      correctIdea: String(formData.get("correctIdea") ?? "") || undefined,
      mistakeType: String(formData.get("mistakeType") ?? "") || undefined,
      retryDate: String(formData.get("retryDate") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/mistakes");
  return null;
}

export async function setMistakeStatusAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.mistakeUpdate,
    {
      id: String(formData.get("id") ?? ""),
      status: String(formData.get("status") ?? "") as MistakeStatus,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/mistakes");
}

export async function deleteMistakeAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.mistakeDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/mistakes");
}
