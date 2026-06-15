import type { HomeworkReviewStatus } from "@/lib/db/types";
import { reviewHomeworkAction } from "../actions";

const STATUSES: { value: HomeworkReviewStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "needs_correction", label: "Needs correction" },
  { value: "mastered", label: "Mastered" },
];

const btn =
  "rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-text disabled:opacity-40";

/**
 * Parent review controls. One form: the parent notes plus a row of status
 * buttons — clicking a status submits the notes and that status together
 * (`homework.review`).
 */
export function ReviewPanel({
  id,
  currentStatus,
  parentNotes,
}: {
  id: string;
  currentStatus: HomeworkReviewStatus;
  parentNotes: string | null;
}) {
  return (
    <form
      action={reviewHomeworkAction}
      className="mt-3 flex flex-col gap-2 border-t border-border pt-3"
    >
      <input type="hidden" name="id" value={id} />
      <textarea
        name="parentNotes"
        defaultValue={parentNotes ?? ""}
        placeholder="Parent notes (optional)…"
        maxLength={2000}
        className="min-h-16 resize-y rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Mark as:</span>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            name="reviewStatus"
            value={s.value}
            disabled={s.value === currentStatus}
            className={btn}
          >
            {s.label}
          </button>
        ))}
      </div>
    </form>
  );
}
