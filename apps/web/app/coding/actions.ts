"use server";

import { revalidatePath } from "next/cache";
import {
  COMMANDS,
  type CodingProjectStatus,
  type CodingFeatureStatus,
} from "@lockin/shared";
import { dispatch } from "@/lib/commands";
import { requireParent, uiCommandContext } from "@/lib/auth/session";

/**
 * Coding Project Tracker server actions. All route through the command layer's
 * `dispatch()` (the same path the agent gateway uses). `createProjectAction`
 * carries the useActionState shape; the rest are plain form posts.
 */

type ActionState = { error: string } | null;

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.codingProjectCreate,
    {
      studentId: String(formData.get("studentId") ?? ""),
      projectName: String(formData.get("projectName") ?? ""),
      goal: String(formData.get("goal") ?? "") || undefined,
      description: String(formData.get("description") ?? "") || undefined,
      demoLink: String(formData.get("demoLink") ?? "") || undefined,
      githubLink: String(formData.get("githubLink") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/coding");
  return null;
}

export async function setProjectStatusAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.codingProjectUpdate,
    {
      id: String(formData.get("id") ?? ""),
      status: String(formData.get("status") ?? "") as CodingProjectStatus,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/coding");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.codingProjectDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/coding");
}

export async function addFeatureAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parent = await requireParent();
  const result = await dispatch(
    COMMANDS.codingFeatureCreate,
    {
      projectId: String(formData.get("projectId") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
    },
    uiCommandContext(parent),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/coding");
  return null;
}

export async function setFeatureStatusAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.codingFeatureSetStatus,
    {
      id: String(formData.get("id") ?? ""),
      status: String(formData.get("status") ?? "") as CodingFeatureStatus,
    },
    uiCommandContext(parent),
  );
  revalidatePath("/coding");
}

export async function deleteFeatureAction(formData: FormData): Promise<void> {
  const parent = await requireParent();
  await dispatch(
    COMMANDS.codingFeatureDelete,
    { id: String(formData.get("id") ?? "") },
    uiCommandContext(parent),
  );
  revalidatePath("/coding");
}
