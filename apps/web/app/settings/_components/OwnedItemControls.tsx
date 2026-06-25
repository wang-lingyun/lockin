"use client";

import { useActionState, useState } from "react";

type ActionState = { error: string } | null;
type FormAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

const input =
  "rounded-md border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary";
const btn =
  "shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text disabled:opacity-50";

/**
 * View / rename / confirm-delete control for a parent-owned subject or track.
 * The rename and delete server actions are passed in so the same component
 * drives both subjects and tracks. Built-in items don't use this — they render
 * plain text with a "Built-in" badge in the page.
 */
export function OwnedItemControls({
  id,
  name,
  kind,
  renameAction,
  deleteAction,
}: {
  id: string;
  name: string;
  kind: "subject" | "sub-category";
  renameAction: FormAction;
  deleteAction: FormAction;
}) {
  const [mode, setMode] = useState<"view" | "rename" | "confirm">("view");

  const [renameState, renameFormAction, renaming] = useActionState<
    ActionState,
    FormData
  >(async (prev, formData) => {
    const result = await renameAction(prev, formData);
    if (!result) setMode("view");
    return result;
  }, null);

  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionState,
    FormData
  >(deleteAction, null);

  if (mode === "rename") {
    return (
      <form action={renameFormAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="name"
          required
          maxLength={60}
          defaultValue={name}
          autoFocus
          className={input}
          aria-label="Name"
        />
        <button type="submit" disabled={renaming} className={btn}>
          {renaming ? "…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setMode("view")}
          className={btn}
        >
          Cancel
        </button>
        {renameState?.error ? (
          <span className="text-xs text-danger" role="alert">
            {renameState.error}
          </span>
        ) : null}
      </form>
    );
  }

  if (mode === "confirm") {
    return (
      <form action={deleteFormAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <span className="text-sm text-text">
          Delete &ldquo;{name}&rdquo;?
        </span>
        <button
          type="submit"
          disabled={deleting}
          className="shrink-0 rounded-md border border-danger px-2 py-1 text-xs font-medium text-danger hover:bg-danger hover:text-bg disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => setMode("view")}
          className={btn}
        >
          Cancel
        </button>
        {deleteState?.error ? (
          <span className="text-xs text-danger" role="alert">
            {deleteState.error}
          </span>
        ) : null}
      </form>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className={kind === "subject" ? "font-medium text-text" : "text-sm"}>
        {name}
      </span>
      <button
        type="button"
        onClick={() => setMode("rename")}
        className={btn}
        aria-label={`Rename ${kind}`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setMode("confirm")}
        className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-danger hover:text-danger"
        aria-label={`Delete ${kind}`}
      >
        Delete
      </button>
    </span>
  );
}
