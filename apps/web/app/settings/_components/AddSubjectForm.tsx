"use client";

import { useActionState, useRef } from "react";
import { createSubjectAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Create a new parent-owned subject. */
export function AddSubjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await createSubjectAction(prev, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    null,
  );

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-xs text-muted">New subject</span>
        <input
          name="name"
          required
          maxLength={60}
          className={input}
          placeholder="e.g. Math"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Color</span>
        <input type="color" name="color" defaultValue="#6366f1" className="h-9 w-12 rounded-md border border-border bg-bg" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add subject"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
