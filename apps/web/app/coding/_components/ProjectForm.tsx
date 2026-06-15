"use client";

import { useActionState } from "react";
import { createProjectAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Create a coding project for a student. */
export function ProjectForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createProjectAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Project name</span>
        <input
          name="projectName"
          className={input}
          placeholder="e.g. Snake game in Python"
          maxLength={160}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Goal (optional)</span>
        <input
          name="goal"
          className={input}
          placeholder="What should it do when it's done?"
          maxLength={2000}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Description (optional)</span>
        <textarea
          name="description"
          className={`${input} min-h-16 resize-y`}
          placeholder="Notes about the project…"
          maxLength={2000}
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Demo link (optional)</span>
          <input
            name="demoLink"
            className={input}
            placeholder="https://…"
            maxLength={500}
          />
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">GitHub link (optional)</span>
          <input
            name="githubLink"
            className={input}
            placeholder="https://github.com/…"
            maxLength={500}
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create project"}
        </button>
        {state?.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
