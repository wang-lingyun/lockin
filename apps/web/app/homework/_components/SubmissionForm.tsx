"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HOMEWORK_MIME_TYPES,
  HOMEWORK_MAX_FILE_BYTES,
  HOMEWORK_MAX_ATTACHMENTS,
  type HomeworkAttachmentInput,
} from "@lockin/shared";
import { createClient } from "@/lib/supabase/client";
import { submitHomeworkAction } from "../actions";

type SubjectOption = { id: string; name: string };
type TrackOption = { id: string; subject_id: string; name: string };

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary";

const ACCEPT = HOMEWORK_MIME_TYPES.join(",");
const MAX_MB = Math.round(HOMEWORK_MAX_FILE_BYTES / (1024 * 1024));

/** Filesystem-safe object-key segment derived from the original filename. */
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/**
 * Submit a homework artifact: optional note text plus image/PDF files. Files are
 * validated and uploaded **directly to Supabase Storage from the browser** (ADR
 * 0008); only the resulting metadata is sent to the command layer.
 */
export function SubmissionForm({
  studentId,
  subjects,
  tracks,
}: {
  studentId: string;
  subjects: SubjectOption[];
  tracks: TrackOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [subjectId, setSubjectId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjTracks = tracks.filter((t) => t.subject_id === subjectId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const rawText = String(fd.get("rawText") ?? "").trim();
    const files = (fd.getAll("files") as File[]).filter((f) => f && f.size > 0);

    if (!rawText && files.length === 0) {
      setError("Add some text or at least one file.");
      return;
    }
    if (files.length > HOMEWORK_MAX_ATTACHMENTS) {
      setError(`At most ${HOMEWORK_MAX_ATTACHMENTS} files per submission.`);
      return;
    }
    for (const f of files) {
      if (!(HOMEWORK_MIME_TYPES as readonly string[]).includes(f.type)) {
        setError(`"${f.name}" is not an allowed type (images or PDF only).`);
        return;
      }
      if (f.size > HOMEWORK_MAX_FILE_BYTES) {
        setError(`"${f.name}" is larger than ${MAX_MB} MB.`);
        return;
      }
    }

    setPending(true);
    try {
      const supabase = createClient();
      const attachments: HomeworkAttachmentInput[] = [];
      for (const f of files) {
        const path = `${studentId}/${crypto.randomUUID()}-${safeName(f.name)}`;
        const { error: upErr } = await supabase.storage
          .from("homework")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) {
          setError(`Upload failed for "${f.name}": ${upErr.message}`);
          setPending(false);
          return;
        }
        attachments.push({
          storagePath: path,
          mimeType: f.type as HomeworkAttachmentInput["mimeType"],
          sizeBytes: f.size,
          originalName: f.name,
        });
      }

      const result = await submitHomeworkAction({
        studentId,
        subjectId: String(fd.get("subjectId") ?? "") || undefined,
        subjectTrackId: String(fd.get("subjectTrackId") ?? "") || undefined,
        topic: String(fd.get("topic") ?? "") || undefined,
        assignmentTitle: String(fd.get("assignmentTitle") ?? "") || undefined,
        rawText: rawText || undefined,
        studentNotes: String(fd.get("studentNotes") ?? "") || undefined,
        attachments,
      });
      if (result?.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      form.reset();
      setSubjectId("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Assignment title (optional)</span>
          <input
            name="assignmentTitle"
            className={input}
            placeholder="e.g. AoPS Ch. 3 problem set"
            maxLength={200}
          />
        </label>
        <label className="flex w-40 flex-col gap-1">
          <span className="text-xs text-muted">Topic (optional)</span>
          <input
            name="topic"
            className={input}
            placeholder="e.g. fractions"
            maxLength={120}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Work / notes</span>
        <textarea
          name="rawText"
          className={`${input} min-h-24 resize-y`}
          placeholder="Type the homework, paste code, or describe the attached files…"
          maxLength={20000}
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
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">
          Files (optional) — images or PDF, up to {MAX_MB} MB each
        </span>
        <input
          name="files"
          type="file"
          multiple
          accept={ACCEPT}
          className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-text hover:file:opacity-90"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit homework"}
        </button>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
