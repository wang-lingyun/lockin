"use client";

import { useActionState } from "react";
import { createRewardAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Create a reward for a student, with an optional XP threshold. */
export function RewardForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createRewardAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Reward</span>
          <input
            name="title"
            className={input}
            placeholder="e.g. Movie night"
            maxLength={160}
            required
          />
        </label>
        <label className="flex w-40 flex-col gap-1">
          <span className="text-xs text-muted">Unlock at XP (optional)</span>
          <input
            type="number"
            name="requiredXp"
            className={input}
            placeholder="e.g. 500"
            min={0}
            max={1000000}
            step={1}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Description (optional)</span>
        <textarea
          name="description"
          className={`${input} min-h-16 resize-y`}
          placeholder="Details about the reward…"
          maxLength={2000}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add reward"}
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
