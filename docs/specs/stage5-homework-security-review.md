# Stage 5 — Homework Inbox security review

Children's-data privacy review gate for Stage 5 (PRD §11, ADR 0008). Completed
before merge. Each item below is a control plus how it is verified.

## Data isolation (RLS)

- [x] **`homework_submissions` is RLS-protected** with `owns_student(student_id)`
      for `using` and `with check` (`0005_homework.sql`). A parent can only read or
      write submissions for their own students.
- [x] **`homework_attachments` is RLS-protected**; ownership flows through the parent
      submission (`exists (… owns_student(s.student_id))`) for both `using` and
      `with check`. Attachment rows cannot be attached to another parent's submission.
- [x] **Cross-parent isolation verified manually**: signed in as parent A, a request
      for parent B's submission/attachment ids returns nothing (RLS), and B's students
      never appear in A's switcher.

## File storage (Supabase Storage)

- [x] **Bucket is private** (`public = false`) — no anonymous/public object URLs.
- [x] **Storage RLS** on `storage.objects` restricts the `homework` bucket to objects
      whose first path segment is a student the caller owns
      (`owns_student((split_part(name,'/',1))::uuid)`), for both `using` and
      `with check`. A parent cannot upload into, list, or read another family's prefix.
- [x] **Downloads use short-lived signed URLs** (10-minute TTL), generated server-side
      with the parent's RLS-scoped session at page render. No durable public links.
- [x] **Uploads go browser → Storage directly** (ADR 0008). File bytes never pass
      through a Vercel function (no payload/time-limit exposure, no server-side file
      handling). Verified: `SubmissionForm` uploads via the browser client; the
      `homework.submit` command writes metadata only.

## Input limits & validation

- [x] **Type allow-list** (`image/png`, `image/jpeg`, `image/heic`,
      `application/pdf`) enforced in **three** places: the client pre-upload check, the
      `HomeworkAttachmentInput` zod schema (`dispatch` validation), and the bucket's
      `allowed_mime_types`.
- [x] **5 MB per-file cap** enforced at the client, the schema
      (`HOMEWORK_MAX_FILE_BYTES`), and the bucket (`file_size_limit = 5242880`).
- [x] **At most 10 attachments** per submission (schema), and a submission must carry
      text and/or ≥1 file (schema `.refine`).
- [x] **All writes go through `dispatch()`** — the single validated command surface
      shared with the future agent gateway (ADR 0007). No direct table writes from UI.

## Secrets & keys

- [x] **No service-role key in the browser.** The client uses only the public anon key
      + the parent's session (`lib/env.ts` exposes URL + anon key only). RLS — not a
      privileged key — is what isolates data.
- [x] **No secrets committed**; env via `.env.local` (gitignored).

## AI-readiness (no processing in MVP)

- [x] **AI fields default to `not_started`** and are **never written** by any pipeline
      (AC 30). `detected_skills` / `detected_mistakes` / `recommended_next_steps` /
      `ai_summary` are stored for future use only; no inference runs on Vercel.

## Residual risk / accepted for MVP

- **Orphaned Storage objects**: if a parent uploads files but the `homework.submit`
  command then fails (or they navigate away), the uploaded objects remain with no
  metadata row. Low impact (still RLS-private, counts against the family's own quota),
  rare, and no cron is available on the free tier to sweep. Revisit if it becomes a
  real cost/clutter issue. Tracked in `docs/human/decisions.md`.
- **HEIC inline preview**: some browsers don't render `image/heic` inline; such files
  still download via their signed URL. Cosmetic only.
