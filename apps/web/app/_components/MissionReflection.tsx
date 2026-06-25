"use client";

import { useState } from "react";
import { setMissionReflectionAction } from "../actions";

/**
 * A compact per-task reflection note on the Today page. Collapsed by default to
 * keep the daily view calm; opens to a textarea + Save. Carries either a
 * persisted `missionId` or the (studentId, scheduleBlockId, date) trio so the
 * server action can materialize a scheduled block before saving.
 */
export function MissionReflection({
  reflection,
  missionId,
  studentId,
  scheduleBlockId,
  date,
}: {
  reflection: string | null;
  missionId?: string;
  studentId?: string;
  scheduleBlockId?: string;
  date?: string;
}) {
  const [open, setOpen] = useState(false);
  const has = Boolean(reflection && reflection.trim());

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted hover:text-text"
        aria-expanded={open}
      >
        {has ? "✎ Reflection" : "+ Reflect"}
      </button>

      {open ? (
        <form action={setMissionReflectionAction} className="mt-2 flex flex-col gap-2">
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
          <textarea
            name="reflection"
            rows={3}
            defaultValue={reflection ?? ""}
            placeholder="What did you finish? What was hard?"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90">
              Save note
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : has ? (
        <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{reflection}</p>
      ) : null}
    </div>
  );
}
