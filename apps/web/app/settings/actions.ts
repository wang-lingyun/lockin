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

/* ----- Subject & track management (parent-owned; RLS gates ownership) ----- */

type ActionState = { error: string } | null;

/** Create a new parent-owned subject (e.g. a custom "Math"). */
export async function createSubjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.subjectCreate,
    {
      name: String(formData.get("name") ?? ""),
      color: String(formData.get("color") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/settings");
  return null;
}

/** Rename a parent-owned subject. */
export async function renameSubjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.subjectUpdate,
    {
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/settings");
  return null;
}

/** Add a sub-category (track) under a subject. */
export async function createTrackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.trackCreate,
    {
      subjectId: String(formData.get("subjectId") ?? ""),
      name: String(formData.get("name") ?? ""),
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/settings");
  return null;
}

/** Rename a parent-owned track. */
export async function renameTrackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.trackUpdate,
    {
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/settings");
  return null;
}

/** Toggle a parent-owned track's active flag (hide it without deleting). */
export async function setTrackActiveAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.trackUpdate,
    {
      id: String(formData.get("id") ?? ""),
      isActive: formData.get("isActive") === "true",
    },
    uiCommandContext(parent),
  );
  revalidatePath("/settings");
}
