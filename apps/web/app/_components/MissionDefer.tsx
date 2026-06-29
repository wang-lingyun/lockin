"use client";

import { useActionState, useState } from "react";
import { deferMissionAction } from "../actions";

type ActionState = { error: string } | null;

/**
 * "Move…" control on the Today page: defer a mission to a later date with an
 * optional note that travels to that day. Collapsed by default to keep the daily
 * view calm. Carries either a persisted `missionId` or the (studentId,
 * scheduleBlockId, date) trio so the server action can materialize a scheduled
 * block before moving it. `minDate` is the earliest selectable day (the day after
 * the one being viewed) and doubles as the default.
 */
export function MissionDefer({
  missionId,
  studentId,
  scheduleBlockId,
  date,
  minDate,
}: {
  missionId?: string;
  studentId?: string;
  scheduleBlockId?: string;
  date?: string;
  minDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    deferMissionAction,
    null,
  );

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted hover:text-text"
        aria-expanded={open}
      >
        ⤳ Move…
      </button>

      {open ? (
        <form action={action} className="mt-2 flex flex-col gap-2">
          {missionId ? (
            <input type="hidden" name="missionId" value={missionId} />
          ) : (
            <>
              <input type="hidden" name="studentId" value={studentId ?? ""} />
              <input
                type="hidden"
                name="scheduleBlockId"
                value={scheduleBlockId ?? ""}
              />
              <input type="hidden" name="date" value={date ?? ""} />
            </>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Move to</span>
            <input
              type="date"
              name="toDate"
              defaultValue={minDate}
              min={minDate}
              required
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>
          <textarea
            name="note"
            rows={2}
            placeholder="Note (optional) — why, or what to do first…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <button
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Moving…" : "Move"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted hover:text-text"
            >
              Cancel
            </button>
            {state?.error ? (
              <span className="text-xs text-danger" role="alert">
                {state.error}
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
