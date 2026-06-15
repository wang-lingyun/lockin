import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodTypeAny } from "zod";

/**
 * The command layer is the one typed surface for every state-changing admin
 * action. The parent UI and the future agent gateway both go through
 * `dispatch()` — never around it (ADR 0007, CLAUDE.md "one admin command
 * surface"). Each call is validated against a shared schema and audit-logged.
 */

export type Channel = "ui" | "slack" | "voice" | "api";
export type ActorType = "parent_ui" | "agent";

export type CommandContext = {
  /** RLS-scoped client carrying the parent's session. */
  supabase: SupabaseClient;
  /** auth.uid() of the parent on whose behalf the command runs. */
  parentUserId: string;
  channel: Channel;
  actorType: ActorType;
  /** Optional id of the calling agent/credential (null for direct UI). */
  actorId?: string | null;
};

/** A handler receives already-validated input and returns its result, or throws. */
export type CommandHandler<TInput, TData> = (
  input: TInput,
  ctx: CommandContext,
) => Promise<TData>;

export type CommandDefinition<TInput, TData> = {
  schema: ZodTypeAny;
  handler: CommandHandler<TInput, TData>;
};

export type CommandResult<TData = unknown> =
  | { ok: true; data: TData }
  | { ok: false; error: string };
