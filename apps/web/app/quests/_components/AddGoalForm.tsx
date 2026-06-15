"use client";

import { useActionState, useState } from "react";
import { createGoalAction } from "../actions";

type ActionState = { error: string } | null;
type SubjectOption = { id: string; name: string };
type TrackOption = { id: string; subject_id: string; name: string };

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Create an outcome-based weekly goal for a student, scoped to the shown week. */
export function AddGoalForm({
  studentId,
  weekStartDate,
  subjects,
  tracks,
}: {
  studentId: string;
  weekStartDate: string;
  subjects: SubjectOption[];
  tracks: TrackOption[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createGoalAction,
    null,
  );
  const [subjectId, setSubjectId] = useState("");

  const subjTracks = tracks.filter((t) => t.subject_id === subjectId);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="weekStartDate" value={weekStartDate} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Goal</span>
          <input
            name="title"
            required
            className={input}
            placeholder="e.g. Solve 50 AoPS problems"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-muted">Target</span>
          <input
            name="targetValue"
            type="number"
            min={0}
            step="any"
            className={input}
            placeholder="50"
          />
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-xs text-muted">Unit</span>
          <input
            name="unit"
            className={input}
            placeholder="problems"
            maxLength={40}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Subject</span>
          <select
            name="subjectId"
            className={input}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {subjTracks.length > 0 ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Track</span>
            <select name="subjectTrackId" className={input} defaultValue="">
              <option value="">—</option>
              {subjTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Due (optional)</span>
          <input type="date" name="dueDate" className={input} />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add goal"}
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
