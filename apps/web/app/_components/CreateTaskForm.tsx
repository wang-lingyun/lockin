"use client";

import { useActionState } from "react";
import { createTaskAction } from "../actions";

type ActionState = { error: string } | null;
type SubjectOption = { id: string; name: string };

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

export function CreateTaskForm({ subjects }: { subjects: SubjectOption[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createTaskAction,
    null,
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-48 flex-1 flex-col gap-1">
        <span className="text-xs text-muted">Task title</span>
        <input
          name="title"
          required
          className={input}
          placeholder="e.g. AoPS Ch.3 problems"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Subject</span>
        <select name="subjectId" className={input} defaultValue="">
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex w-28 flex-col gap-1">
        <span className="text-xs text-muted">Target (h)</span>
        <input
          name="targetHours"
          type="number"
          min={0.5}
          step={0.5}
          placeholder="—"
          className={input}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Create task"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
