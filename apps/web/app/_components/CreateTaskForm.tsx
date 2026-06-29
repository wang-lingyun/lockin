"use client";

import { useActionState, useState } from "react";
import { createScheduledTaskAction } from "../actions";

type ActionState = { error: string } | null;
type SubjectOption = { id: string; name: string };
type TrackOption = { id: string; name: string; subject_id: string };

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

const WEEKDAYS: { code: string; label: string }[] = [
  { code: "MO", label: "Mon" },
  { code: "TU", label: "Tue" },
  { code: "WE", label: "Wed" },
  { code: "TH", label: "Thu" },
  { code: "FR", label: "Fri" },
  { code: "SA", label: "Sat" },
  { code: "SU", label: "Sun" },
];

/** Minutes between two HH:MM times (positive only; null if absent/invalid). */
function diffMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  const d = eh * 60 + em - (sh * 60 + sm);
  return d > 0 ? d : null;
}

/**
 * Create a scheduled item for the active student in one submit: title, subject/
 * track, a target (hours or minutes), an optional time range, optional notes
 * (links/instructions), and an optional repeat (daily / weekly-by-weekday). It
 * becomes a schedule block (shows on Today and the weekly Schedule); the note is
 * stored as the block's notes and surfaces as the mission's description on Today.
 * When a time range is set the target is derived from its duration and locked, so
 * the two always agree.
 */
export function CreateTaskForm({
  subjects,
  tracks = [],
  studentId,
  today,
}: {
  subjects: SubjectOption[];
  tracks?: TrackOption[];
  studentId: string;
  today: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createScheduledTaskAction,
    null,
  );

  // Track options depend on the chosen subject; clear the track when the
  // subject changes so we never submit a track from a different subject.
  const [subjectId, setSubjectId] = useState("");
  const subjectTracks = tracks.filter((t) => t.subject_id === subjectId);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState<"hour" | "min">("hour");

  // A valid time range owns the duration: target is derived and locked.
  const derivedMin = diffMinutes(startTime, endTime);
  const targetLocked = derivedMin !== null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      <div className="flex flex-wrap items-end gap-3">
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
        {subjectTracks.length > 0 ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Track</span>
            <select name="subjectTrackId" className={input} defaultValue="">
              <option value="">— (whole subject)</option>
              {subjectTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={today}
            required
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Start (optional)</span>
          <input
            type="time"
            name="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">End</span>
          <input
            type="time"
            name="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={input}
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-muted">Target</span>
          <input
            name="targetValue"
            type="number"
            min={0}
            step={targetUnit === "hour" ? 0.5 : 5}
            placeholder="—"
            value={targetLocked ? String(derivedMin) : targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            disabled={targetLocked}
            className={`${input} disabled:opacity-60`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Unit</span>
          <select
            name="targetUnit"
            value={targetLocked ? "min" : targetUnit}
            onChange={(e) => setTargetUnit(e.target.value as "hour" | "min")}
            disabled={targetLocked}
            className={`${input} disabled:opacity-60`}
          >
            <option value="hour">Hours</option>
            <option value="min">Minutes</option>
          </select>
        </label>
        {targetLocked ? (
          <span className="pb-2 text-xs text-muted">
            = {derivedMin} min (from time block)
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Repeat</span>
          <select
            name="repeat"
            className={input}
            value={repeat}
            onChange={(e) =>
              setRepeat(e.target.value as "none" | "daily" | "weekly")
            }
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        {repeat === "weekly" ? (
          <fieldset className="flex flex-wrap items-center gap-2 pb-1">
            {WEEKDAYS.map((d) => (
              <label
                key={d.code}
                className="flex items-center gap-1 text-xs text-muted"
              >
                <input type="checkbox" name="byweekday" value={d.code} />
                {d.label}
              </label>
            ))}
          </fieldset>
        ) : null}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Notes (optional)</span>
        <textarea
          name="notes"
          rows={2}
          className={`${input} resize-y`}
          placeholder="Links, instructions, page numbers…"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Create task"}
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
