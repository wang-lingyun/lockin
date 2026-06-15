"use client";

import { useActionState, useState } from "react";
import { createMistakeAction } from "../actions";

type ActionState = { error: string } | null;
type SubjectOption = { id: string; name: string };
type TrackOption = { id: string; subject_id: string; name: string };
type HomeworkOption = {
  id: string;
  assignment_title: string | null;
  topic: string | null;
  submission_date: string;
};

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

/** Create a mistake-bank entry for a student, with an optional homework link. */
export function MistakeForm({
  studentId,
  subjects,
  tracks,
  homework,
}: {
  studentId: string;
  subjects: SubjectOption[];
  tracks: TrackOption[];
  homework: HomeworkOption[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createMistakeAction,
    null,
  );
  const [subjectId, setSubjectId] = useState("");

  const subjTracks = tracks.filter((t) => t.subject_id === subjectId);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Title</span>
          <input
            name="title"
            className={input}
            placeholder="e.g. Sign error solving inequalities"
            maxLength={200}
          />
        </label>
        <label className="flex w-40 flex-col gap-1">
          <span className="text-xs text-muted">Topic (optional)</span>
          <input
            name="topic"
            className={input}
            placeholder="e.g. inequalities"
            maxLength={120}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">What went wrong</span>
        <textarea
          name="mistakeDescription"
          className={`${input} min-h-20 resize-y`}
          placeholder="Describe the mistake…"
          maxLength={5000}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Correct idea (optional)</span>
        <textarea
          name="correctIdea"
          className={`${input} min-h-20 resize-y`}
          placeholder="What's the right approach?"
          maxLength={5000}
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Subject (optional)</span>
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
        <label className="flex w-40 flex-col gap-1">
          <span className="text-xs text-muted">Mistake type (optional)</span>
          <input
            name="mistakeType"
            className={input}
            placeholder="e.g. careless"
            maxLength={80}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Retry on (optional)</span>
          <input type="date" name="retryDate" className={input} />
        </label>
      </div>

      {homework.length > 0 ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Link homework (optional)</span>
          <select name="homeworkSubmissionId" className={input} defaultValue="">
            <option value="">—</option>
            {homework.map((h) => (
              <option key={h.id} value={h.id}>
                {(h.assignment_title ?? h.topic ?? "Homework") +
                  ` · ${h.submission_date}`}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add mistake"}
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
