"use client";

import { useActionState, useRef } from "react";
import { adjustXpAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Manual parent XP adjustment (positive or negative) with a reason. */
export function XpAdjustForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await adjustXpAction(prev, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <label className="flex w-28 flex-col gap-1">
        <span className="text-xs text-muted">XP (+/−)</span>
        <input
          type="number"
          name="amount"
          className={input}
          placeholder="e.g. 25"
          step={1}
          required
        />
      </label>
      <label className="flex min-w-48 flex-1 flex-col gap-1">
        <span className="text-xs text-muted">Reason (optional)</span>
        <input
          name="reason"
          className={input}
          placeholder="e.g. Helped a sibling"
          maxLength={200}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:text-text disabled:opacity-50"
      >
        {pending ? "Saving…" : "Apply"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
