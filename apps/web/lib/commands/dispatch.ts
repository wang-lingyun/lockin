import type { CommandName } from "@lockin/shared";
import { REGISTRY } from "./registry";
import type { CommandContext, CommandResult } from "./types";

/**
 * The single entry point for every admin action. Validates input against the
 * command's shared schema, runs the handler, and writes an audit row to
 * `admin_command_log` regardless of outcome. UI server actions and the agent
 * gateway both call this — there is no other write path (ADR 0007).
 */
export async function dispatch(
  name: CommandName,
  rawInput: unknown,
  ctx: CommandContext,
): Promise<CommandResult> {
  const def = REGISTRY[name];
  if (!def) {
    return { ok: false, error: `unknown command: ${name}` };
  }

  const parsed = def.schema.safeParse(rawInput);
  if (!parsed.success) {
    const error = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    await logCommand(ctx, name, rawInput, "validation_error", error);
    return { ok: false, error };
  }

  try {
    const data = await def.handler(parsed.data, ctx);
    await logCommand(ctx, name, parsed.data, "ok", null);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logCommand(ctx, name, parsed.data, "error", message);
    return { ok: false, error: message };
  }
}

/** Best-effort audit write; never let logging failure mask the command result. */
async function logCommand(
  ctx: CommandContext,
  name: CommandName,
  input: unknown,
  status: string,
  summary: string | null,
): Promise<void> {
  try {
    await ctx.supabase.from("admin_command_log").insert({
      parent_user_id: ctx.parentUserId,
      actor_type: ctx.actorType,
      actor_id: ctx.actorId ?? null,
      channel: ctx.channel,
      command_name: name,
      input_payload: input ?? null,
      result_status: status,
      result_summary: summary,
    });
  } catch {
    // Swallow: the audit log is observability, not part of the transaction.
  }
}
