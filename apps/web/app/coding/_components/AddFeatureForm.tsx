"use client";

import { useActionState, useRef } from "react";
import { addFeatureAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Add a feature (checklist item) to a project. */
export function AddFeatureForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await addFeatureAction(prev, formData);
      if (!result) formRef.current?.reset();
      return result;
    },
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex items-start gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="title"
        className={`${input} flex-1`}
        placeholder="Add a feature…"
        maxLength={200}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-border px-3 py-2 text-sm text-muted hover:text-text disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
