"use client";

import { useActionState, useState } from "react";
import { updateTaskAction, deleteTaskAction } from "../actions";

type ActionState = { error: string } | null;
export type TaskItem = { id: string; title: string; label: string | null };

const input =
  "rounded-md border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-primary";
const btn =
  "shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-text disabled:opacity-50";

/** A single task row: view → Edit (rename) → confirm-Delete. */
function TaskRow({ task }: { task: TaskItem }) {
  const [mode, setMode] = useState<"view" | "rename" | "confirm">("view");

  const [renameState, renameAction, renaming] = useActionState<
    ActionState,
    FormData
  >(async (prev, formData) => {
    const result = await updateTaskAction(prev, formData);
    if (!result) setMode("view");
    return result;
  }, null);

  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionState,
    FormData
  >(deleteTaskAction, null);

  if (mode === "rename") {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
        <form action={renameAction} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={task.id} />
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={task.title}
            autoFocus
            className={`${input} flex-1`}
            aria-label="Task title"
          />
          <button type="submit" disabled={renaming} className={btn}>
            {renaming ? "…" : "Save"}
          </button>
          <button type="button" onClick={() => setMode("view")} className={btn}>
            Cancel
          </button>
        </form>
        {renameState?.error ? (
          <span className="text-xs text-danger" role="alert">
            {renameState.error}
          </span>
        ) : null}
      </li>
    );
  }

  if (mode === "confirm") {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
        <form action={deleteFormAction} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={task.id} />
          <span className="flex-1 text-sm text-text">
            Delete &ldquo;{task.title}&rdquo;?
          </span>
          <button
            type="submit"
            disabled={deleting}
            className="shrink-0 rounded-md border border-danger px-2 py-1 text-xs font-medium text-danger hover:bg-danger hover:text-bg disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
          <button type="button" onClick={() => setMode("view")} className={btn}>
            Cancel
          </button>
        </form>
        {deleteState?.error ? (
          <span className="text-xs text-danger" role="alert">
            {deleteState.error}
          </span>
        ) : null}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-text">{task.title}</span>
        {task.label ? (
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
            {task.label}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("rename")}
          className={btn}
          aria-label="Rename task"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode("confirm")}
          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-danger hover:text-danger"
          aria-label="Delete task"
        >
          Delete
        </button>
      </span>
    </li>
  );
}

/** Lists the parent's tasks with inline rename + delete. */
export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted">No tasks yet — create one below.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </ul>
  );
}
