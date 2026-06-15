import type { MistakeBankEntryRow, MistakeStatus } from "@/lib/db/types";
import { setMistakeStatusAction, deleteMistakeAction } from "../actions";

const STATUS_STYLE: Record<MistakeStatus, string> = {
  needs_review: "bg-surface-2 text-warning",
  reviewed: "bg-surface-2 text-accent",
  mastered: "bg-success text-bg",
};

const STATUS_LABEL: Record<MistakeStatus, string> = {
  needs_review: "needs review",
  reviewed: "reviewed",
  mastered: "mastered",
};

const STATUSES: { value: MistakeStatus; label: string }[] = [
  { value: "needs_review", label: "Needs review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "mastered", label: "Mastered" },
];

const btn =
  "rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-text disabled:opacity-40";

function dateLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function MistakeList({ entries }: { entries: MistakeBankEntryRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((m) => {
        const color = m.track?.color ?? m.subject?.color ?? "#6366f1";
        const label = m.track?.name ?? m.subject?.name;
        const title = m.title ?? m.topic ?? "Mistake";
        const hwLabel =
          m.homework?.assignment_title ?? m.homework?.topic ?? "Homework";
        return (
          <li
            key={m.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="mt-1 inline-block h-8 w-1 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{title}</p>
                  <p className="text-xs text-muted">
                    {label ? `${label} · ` : ""}
                    {m.mistake_type ? `${m.mistake_type} · ` : ""}
                    added {dateLabel(m.created_at.slice(0, 10))}
                    {m.retry_date ? ` · retry ${dateLabel(m.retry_date)}` : ""}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[m.status]}`}
              >
                {STATUS_LABEL[m.status]}
              </span>
            </div>

            {m.mistake_description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-text">
                {m.mistake_description}
              </p>
            ) : null}

            {m.correct_idea ? (
              <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-sm text-text">
                <span className="font-medium text-success">Correct idea:</span>{" "}
                {m.correct_idea}
              </p>
            ) : null}

            {m.homework ? (
              <p className="mt-2 text-xs text-muted">
                <span className="font-medium">From homework:</span> {hwLabel} ·{" "}
                {dateLabel(m.homework.submission_date)}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted">Mark as:</span>
              {STATUSES.map((s) => (
                <form key={s.value} action={setMistakeStatusAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="status" value={s.value} />
                  <button disabled={s.value === m.status} className={btn}>
                    {s.label}
                  </button>
                </form>
              ))}
              <form action={deleteMistakeAction} className="ml-auto">
                <input type="hidden" name="id" value={m.id} />
                <button className={btn}>Delete</button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
