"use client";

import { useActionState } from "react";

type ActionState = { error: string } | null;
type RenameAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

const input =
  "rounded-md border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary";

/**
 * A compact rename control for a parent-owned subject or track. The server
 * action is passed in so the same form drives both (renameSubject / renameTrack).
 */
export function InlineRename({
  action,
  id,
  defaultName,
}: {
  action: RenameAction;
  id: string;
  defaultName: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="name"
        required
        maxLength={60}
        defaultValue={defaultName}
        className={input}
        aria-label="Name"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text disabled:opacity-50"
      >
        {pending ? "…" : "Rename"}
      </button>
      {state?.error ? (
        <span className="text-xs text-danger" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
