"use client";

import { useActionState } from "react";
import { createStudentAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

export function CreateStudentForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createStudentAction,
    null,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Name</span>
        <input name="name" required className={input} placeholder="Child's name" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Grade (optional)</span>
        <input name="grade" className={input} placeholder="e.g. 6" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add student"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
