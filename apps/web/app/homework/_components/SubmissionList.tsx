import type {
  HomeworkSubmissionRow,
  HomeworkReviewStatus,
} from "@/lib/db/types";
import { ReviewPanel } from "./ReviewPanel";

/** Signed URLs keyed by storage_path, generated server-side for this page load. */
type SignedUrls = Record<string, string>;

const STATUS_STYLE: Record<HomeworkReviewStatus, string> = {
  submitted: "bg-surface-2 text-warning",
  reviewed: "bg-surface-2 text-accent",
  needs_correction: "bg-surface-2 text-danger",
  mastered: "bg-success text-bg",
};

const STATUS_LABEL: Record<HomeworkReviewStatus, string> = {
  submitted: "submitted",
  reviewed: "reviewed",
  needs_correction: "needs correction",
  mastered: "mastered",
};

function dateLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00.000Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function SubmissionList({
  submissions,
  signedUrls,
}: {
  submissions: HomeworkSubmissionRow[];
  signedUrls: SignedUrls;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {submissions.map((sub) => {
        const color = sub.track?.color ?? sub.subject?.color ?? "#6366f1";
        const label = sub.track?.name ?? sub.subject?.name;
        const title = sub.assignment_title ?? sub.topic ?? "Homework";
        return (
          <li key={sub.id} className="rounded-xl border border-border bg-surface p-4">
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
                    {dateLabel(sub.submission_date)}
                    {sub.topic && sub.assignment_title
                      ? ` · ${sub.topic}`
                      : ""}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[sub.review_status]}`}
              >
                {STATUS_LABEL[sub.review_status]}
              </span>
            </div>

            {sub.raw_text ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-text">
                {sub.raw_text}
              </p>
            ) : null}

            {sub.student_notes ? (
              <p className="mt-2 text-xs text-muted">
                <span className="font-medium">Student notes:</span>{" "}
                {sub.student_notes}
              </p>
            ) : null}

            {sub.attachments.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {sub.attachments.map((a) => {
                  const url = a.storage_path
                    ? signedUrls[a.storage_path]
                    : (a.url ?? undefined);
                  const isImage = a.mime_type.startsWith("image/");
                  if (isImage && url) {
                    return (
                      <a key={a.id} href={url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- signed URLs are short-lived; next/image optimization is unnecessary and would proxy private files */}
                        <img
                          src={url}
                          alt={a.original_name}
                          className="h-28 w-28 rounded-md border border-border object-cover"
                        />
                      </a>
                    );
                  }
                  return (
                    <a
                      key={a.id}
                      href={url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-md border border-border bg-surface-2 px-2 text-center text-xs text-muted hover:text-text"
                    >
                      <span className="text-lg">📄</span>
                      <span className="line-clamp-2 break-all">
                        {a.original_name}
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : null}

            {sub.parent_notes ? (
              <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">
                <span className="font-medium text-text">Parent notes:</span>{" "}
                {sub.parent_notes}
              </p>
            ) : null}

            <ReviewPanel
              id={sub.id}
              currentStatus={sub.review_status}
              parentNotes={sub.parent_notes}
            />
          </li>
        );
      })}
    </ul>
  );
}
