"use server";

import { revalidatePath } from "next/cache";
import {
  COMMANDS,
  type HomeworkReviewStatus,
  type HomeworkAttachmentInput,
} from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Homework Inbox server actions. All route through the command layer's
 * `dispatch()` (the same path the agent gateway uses). File bytes never pass
 * through here — the browser uploads them straight to Storage (ADR 0008) and
 * `submitHomeworkAction` only records the resulting metadata.
 */

type ActionState = { error: string } | null;

/** Plain object the client passes after uploading any files to Storage. */
export type SubmitHomeworkArgs = {
  studentId: string;
  subjectId?: string;
  subjectTrackId?: string;
  topic?: string;
  assignmentTitle?: string;
  rawText?: string;
  studentNotes?: string;
  attachments?: HomeworkAttachmentInput[];
};

export async function submitHomeworkAction(
  args: SubmitHomeworkArgs,
): Promise<ActionState> {
  const parent = await requireParent();

  const result = await dispatch(
    COMMANDS.homeworkSubmit,
    {
      studentId: args.studentId,
      subjectId: args.subjectId || undefined,
      subjectTrackId: args.subjectTrackId || undefined,
      topic: args.topic || undefined,
      assignmentTitle: args.assignmentTitle || undefined,
      rawText: args.rawText || undefined,
      studentNotes: args.studentNotes || undefined,
      attachments: args.attachments?.length ? args.attachments : undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/homework");
  return null;
}

export async function reviewHomeworkAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  const notes = String(formData.get("parentNotes") ?? "").trim();
  await dispatch(
    COMMANDS.homeworkReview,
    {
      id: String(formData.get("id") ?? ""),
      reviewStatus: String(
        formData.get("reviewStatus") ?? "",
      ) as HomeworkReviewStatus,
      parentNotes: notes === "" ? null : notes,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/homework");
}
