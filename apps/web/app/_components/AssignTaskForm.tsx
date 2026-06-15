"use client";

import { useActionState } from "react";
import { assignTaskAction } from "../actions";

type ActionState = { error: string } | null;
type TaskOption = { id: string; title: string; xp_value: number };

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Assigns one of the parent's tasks to the active student for a date. */
export function AssignTaskForm({
  studentId,
  tasks,
  today,
}: {
  studentId: string;
  tasks: TaskOption[];
  today: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    assignTaskAction,
    null,
  );

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted">
        Create a task above, then assign it here.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="studentId" value={studentId} />
      <label className="flex min-w-48 flex-1 flex-col gap-1">
        <span className="text-xs text-muted">Task</span>
        <select name="taskId" required className={input} defaultValue="">
          <option value="" disabled>
            Choose a task…
          </option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} (+{t.xp_value} XP)
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Date</span>
        <input type="date" name="date" defaultValue={today} className={input} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Assigning…" : "Assign"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
