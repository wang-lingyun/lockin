"use client";

import { useActionState, useRef, useState } from "react";
import { createTrackAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Add a sub-category (track) under a subject. Collapsed behind a button. */
export function AddTrackForm({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await createTrackAction(prev, formData);
      if (!result) {
        formRef.current?.reset();
        setOpen(false);
      }
      return result;
    },
    null,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-2 py-1 text-sm text-muted hover:text-text"
      >
        + Add sub-category
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="flex items-start gap-2">
      <input type="hidden" name="subjectId" value={subjectId} />
      <input
        name="name"
        required
        maxLength={60}
        autoFocus
        className={`${input} flex-1`}
        placeholder="Sub-category name…"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-border px-3 py-2 text-sm text-muted hover:text-text disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="shrink-0 rounded-md border border-border px-3 py-2 text-sm text-muted hover:text-text"
      >
        Cancel
      </button>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
