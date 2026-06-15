import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CommandContext } from "@/lib/commands";

/**
 * Server-side helpers for the parent's session. The whole app is gated by
 * middleware, but server actions still re-check here so authorization never
 * relies on the route guard alone (ADR 0004).
 */

export type Parent = {
  parentUserId: string;
  email: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/** Returns the current parent, or null if not signed in. */
export async function getParent(): Promise<Parent | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { parentUserId: user.id, email: user.email ?? "", supabase };
}

/** Returns the current parent, or redirects to /login. Use in pages/actions. */
export async function requireParent(): Promise<Parent> {
  const parent = await getParent();
  if (!parent) redirect("/login");
  return parent;
}

/** Builds a UI-channel command context for `dispatch()`. */
export function uiCommandContext(parent: Parent): CommandContext {
  return {
    supabase: parent.supabase,
    parentUserId: parent.parentUserId,
    channel: "ui",
    actorType: "parent_ui",
  };
}
