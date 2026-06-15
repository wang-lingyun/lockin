# Database (Supabase / PostgreSQL)

SQL migrations live here. This directory is CODEOWNERS-protected — schema, RLS,
and storage changes require human review (see ADR 0002, PRD §11).

- `migrations/` — ordered SQL migrations, applied in filename order.

| File | What it does |
|------|--------------|
| `migrations/0001_init.sql` | Stage 1: profiles + `handle_new_user` trigger, students + ownership, learning profiles, subjects (+ seed defaults), tasks, assignments, daily missions, XP events, audit log. RLS on every table. RPCs `owns_student`, `create_student`, `complete_mission`. |
| `migrations/0002_subjects_tracks.sql` | Stage 2: `subject_tracks`, `student_subjects`, `student_subject_tracks` (RLS); `subject_track_id` added to `tasks` and `daily_missions`; seeds Math tracks HMA/AoPS/Geometry/Calculus. |
| `migrations/0003_schedule_blocks.sql` | Stage 3: `schedule_blocks` (per-student dated calendar with `recurrence_rule` iCal RRULE, RLS, `updated_at` trigger); adds the deferred `daily_missions.schedule_block_id` → `schedule_blocks(id)` FK. Missions are derived from blocks **on read** (no cron); a block is materialized into a `daily_mission` only when marked done. |
| `migrations/0004_weekly_goals.sql` | Stage 4: `weekly_goals` (per-student, per-week outcome goals with target/current/unit/status, optional subject/track attribution, RLS, `updated_at` trigger). RPC `increment_weekly_goal` atomically bumps progress (clamped ≥0) and auto-completes when the target is reached. Progress is manual in the MVP; goals are separate from XP. |
| `migrations/0005_homework.sql` | Stage 5 (ADR 0008): `homework_submissions` (text + AI-ready fields, `review_status`, optional subject/track, RLS, `updated_at` trigger) and `homework_attachments` (file metadata; RLS via the parent submission). Also creates the **private `homework` Storage bucket** (5 MB/file, images+PDF) and a `storage.objects` RLS policy keyed on `owns_student()` (first path segment = student id). Files upload browser→Storage; Postgres holds metadata only; downloads use short-lived signed URLs. See `docs/specs/stage5-homework-security-review.md`. |
| `migrations/0006_homework_submission_date_pacific.sql` | Sets `homework_submissions.submission_date` default to the Pacific calendar day (`(now() at time zone 'America/Los_Angeles')::date`) instead of UTC `current_date`, matching the app timezone in `lib/date.ts` (`APP_TIME_ZONE`). Only changes the column default; existing rows untouched. |

## Applying a migration

You need a Supabase project (see `../../../docs/DEPLOYMENT.md`).

**Option A — Supabase dashboard (simplest, no install):**
1. Open your project → **SQL Editor** → **New query**.
2. Paste the contents of `migrations/0001_init.sql` and **Run**.

**Option B — Supabase CLI / psql:**
```bash
brew install supabase/tap/supabase            # one-time
psql "$SUPABASE_DB_URL" -f apps/web/db/migrations/0001_init.sql
```

## Notes

- `handle_new_user` auto-creates a `profiles` row whenever someone signs up via
  Supabase Auth — so the first parent just signs up in the app.
- RLS isolates all student data by parent ownership (`owns_student`). The anon
  key is safe in the browser; nothing is readable without a parent session.
- `complete_mission` is idempotent and awards XP via the `xp_events` ledger,
  keeping `students.current_xp` / `current_level` as a denormalized snapshot.
- Default subjects (Math, Coding, Physics, SAT, Chemistry, Chinese, English
  Writing, Reading, Reflection) are seeded by the migration. Math sub-tracks
  (HMA/AoPS/Geometry/Calculus) and seed students arrive in a later stage.
