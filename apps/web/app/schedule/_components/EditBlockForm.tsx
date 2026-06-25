"use client";

import { useActionState, useState } from "react";
import { updateBlockAction } from "../actions";
import { parseRRule } from "@/lib/missions/recurrence";
import type { ScheduleBlock } from "@/lib/db/types";

type ActionState = { error: string } | null;
type SubjectOption = { id: string; name: string };
type TrackOption = { id: string; subject_id: string; name: string };
type TaskOption = { id: string; title: string };

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

/** HH:MM (UTC) from an ISO datetime, or "". */
function timeOf(iso: string | null): string {
  return iso ? iso.slice(11, 16) : "";
}

/**
 * Edit an existing schedule block. Mirrors AddBlockForm but prefilled from the
 * block, with the stored RRULE decoded back into the friendly repeat preset.
 * Times are read/written as literal HH:MM (the app's Pacific-as-Z convention).
 */
export function EditBlockForm({
  block,
  subjects,
  tracks,
  tasks,
}: {
  block: ScheduleBlock;
  subjects: SubjectOption[];
  tracks: TrackOption[];
  tasks: TaskOption[];
}) {
  const initialRule = parseRRule(block.recurrence_rule);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateBlockAction,
    null,
  );
  const [subjectId, setSubjectId] = useState(block.subject_id ?? "");
  const [allDay, setAllDay] = useState(block.all_day);
  const [repeat, setRepeat] = useState(initialRule.repeat);

  const subjTracks = tracks.filter((t) => t.subject_id === subjectId);

  return (
    <form action={action} className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
      <input type="hidden" name="id" value={block.id} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Title</span>
          <input name="title" required defaultValue={block.title} className={input} />
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
        {subjTracks.length > 0 ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Track</span>
            <select
              name="subjectTrackId"
              className={input}
              defaultValue={block.subject_track_id ?? ""}
            >
              <option value="">—</option>
              {subjTracks.map((t) => (
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
            defaultValue={block.start_at?.slice(0, 10) ?? ""}
            required
            className={input}
          />
        </label>
        {!allDay ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Start</span>
              <input
                type="time"
                name="startTime"
                defaultValue={timeOf(block.start_at)}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">End</span>
              <input
                type="time"
                name="endTime"
                defaultValue={timeOf(block.end_at)}
                className={input}
              />
            </label>
          </>
        ) : null}
        <label className="flex items-center gap-2 pb-2 text-sm text-muted">
          <input
            type="checkbox"
            name="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          All day
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-xs text-muted">Target (h)</span>
          <input
            name="targetHours"
            type="number"
            min={0.5}
            step={0.5}
            placeholder="—"
            defaultValue={
              block.estimated_minutes != null
                ? block.estimated_minutes / 60
                : ""
            }
            className={input}
          />
        </label>
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
                <input
                  type="checkbox"
                  name="byweekday"
                  value={d.code}
                  defaultChecked={initialRule.byweekday.includes(d.code)}
                />
                {d.label}
              </label>
            ))}
          </fieldset>
        ) : null}
        {tasks.length > 0 ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Link task (XP)</span>
            <select
              name="taskId"
              className={input}
              defaultValue={block.task_id ?? ""}
            >
              <option value="">—</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
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
