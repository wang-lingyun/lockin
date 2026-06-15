# ADR 0008 — Homework attachments via Supabase Storage

- **Status:** Accepted (2026-06-14)
- **Amends:** [ADR 0003](0003-homework-upload-text-first.md) (which deferred uploads)

## Context

Stage 5 is the Homework Inbox. ADR 0003 kept homework **text-first** and deferred
file uploads to avoid Vercel Hobby cost/performance guardrails. The parent now wants
homework to also accept **images and PDFs** (a student's work is often a photo of
handwritten math or a scanned worksheet), with files actually stored — not just typed
text.

`CLAUDE.md` already anticipates this: *"if implemented, files go to Supabase Storage
with only metadata in Postgres — never processed inside Vercel functions."* So this is
a scoped, allowed extension, but it crosses storage + RLS boundaries (CODEOWNERS,
human approval) and is a genuine architectural fork — hence this ADR.

Constraints that bound the decision:
- Vercel Hobby: no long-running functions, no heavy payloads through functions, no
  background workers, no AI processing.
- Children's data is private by default (RLS).
- Prefer simple, low-cost; avoid new external services/microservices.
- Preserve raw homework in a structured, **AI-ready** way (no AI in MVP).

## Decision

**1. Store files in a private Supabase Storage bucket (`homework`).**
- Private (not public). Object paths are student-scoped, e.g.
  `homework/{student_id}/{submission_id}/{uuid}-{filename}`.
- Access is enforced by **Storage RLS policies** keyed on the same `owns_student()`
  predicate used everywhere else, so a parent can only read/write objects under their
  own students. Downloads use short-lived **signed URLs**.

**2. Upload goes browser → Supabase Storage directly (never through Vercel).**
- The client uses the Supabase JS client (parent session) / a signed upload URL to
  PUT the file straight to Storage. Vercel functions never receive the bytes — this
  honors the "no files through Vercel functions" rule and dodges payload/time limits.
- The command layer (`homework.submit`) only ever writes **metadata rows**, after the
  upload has produced an object path.

**3. Postgres stores only metadata, in two tables.**
- `homework_submissions` — one per submission: `student_id`, optional
  `subject_id`/`subject_track_id`, `raw_text` (nullable now that files are allowed),
  `source_type`, `review_status` (`pending`/`reviewed`), `parent_notes`, timestamps,
  plus **AI-ready fields left unpopulated** (`ai_analysis_status` default
  `not_started`, `detected_*`, etc. — never written by any pipeline in the MVP).
- `homework_attachments` — zero-or-more per submission: `submission_id`,
  `storage_path` (Supabase object key), `mime_type`, `size_bytes`, `original_name`,
  `created_at`. (A nullable `url` column is reserved so an external link — e.g. Google
  Drive — can be added later without a schema change; not used in this stage.)
- A submission is valid if it has **text and/or one-or-more attachments** (decided:
  one submission = optional note text AND/OR several files — e.g. multiple photos of
  one assignment).

**4. Allowed types and limits (validated client-side and in the command schema).**
- Types (decided): `image/png`, `image/jpeg`, `image/heic`, `application/pdf` — images
  and PDF only. Plain text is already captured in the note field; office docs are out.
- Per-file cap (decided): **5 MB**. Forces light compression on large phone photos and
  maximizes how many files fit in the Supabase free tier (≈ 1 GB total); it is itself a
  guardrail.
- These are enforced again by a Storage bucket policy where practical.

**5. No file processing in the MVP.** No OCR, thumbnails, virus scan, or AI. Files are
preserved as-is for future analysis. Thumbnailing/transforms are a later, out-of-band
concern (Supabase image transforms or an external worker), not Vercel.

## Alternatives considered

- **Google Drive API integration** — more free storage (15 GB) and files live in the
  parent's own Drive, but needs OAuth + token refresh + possible Google app
  verification, and reliable uploads tend to require a server hop (conflicts with "no
  files through Vercel functions") or exposing tokens to the browser. Too much
  complexity and an external dependency for the MVP. Deferred as a possible future
  **external connector** (cf. Slack/voice in ADR 0007).
- **Link-only (paste a share URL)** — trivial (store a `url`), but fully manual and no
  real in-app capture. Kept as a *future* option via the reserved `url` column.
- **Upload through a Vercel function** — simplest client code, but violates the
  no-files-through-functions rule and risks payload/time limits. Rejected.

## Consequences

- Adds one Storage bucket + Storage RLS policies — **security-sensitive**, reviewed and
  approved by the parent (this ADR + CODEOWNERS) before the migration/policy is applied.
- The web app gains a client upload path (browser → Storage) distinct from the
  command layer; `homework.submit` records metadata only, so the single-command-surface
  rule (ADR 0007) still holds for all DB writes.
- AI-readiness fields exist but stay empty; the structure supports adding analysis
  later with no rewrite.
- Storage is bounded by the 5 MB/file cap and the ~1 GB free tier; if the family
  outgrows it, revisit with Google Drive (external connector) or a paid Supabase tier.
- ADR 0003's "uploads deferred" stance is now **superseded for images/PDF**; its
  text-first capture and AI-ready fields remain in force.

## Resolved (parent decisions, 2026-06-14)

1. **File types** — images + PDF only (`image/png`, `image/jpeg`, `image/heic`,
   `application/pdf`). No plain-text/office uploads.
2. **Per-file size cap** — **5 MB**. No separate per-student/total quota beyond the
   free-tier ceiling for now.
3. **Submission shape** — one submission allows **text and/or multiple attachments**.
