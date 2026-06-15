# Database (Supabase / PostgreSQL)

SQL migrations live here. This directory is CODEOWNERS-protected — schema, RLS,
and storage changes require human review (see ADR 0002, PRD §11).

- `migrations/` — ordered SQL migrations, applied in filename order.

| File | What it does |
|------|--------------|
| `migrations/0001_init.sql` | Stage 1: profiles + `handle_new_user` trigger, students + ownership, learning profiles, subjects (+ seed defaults), tasks, assignments, daily missions, XP events, audit log. RLS on every table. RPCs `owns_student`, `create_student`, `complete_mission`. |
| `migrations/0002_subjects_tracks.sql` | Stage 2: `subject_tracks`, `student_subjects`, `student_subject_tracks` (RLS); `subject_track_id` added to `tasks` and `daily_missions`; seeds Math tracks HMA/AoPS/Geometry/Calculus. |

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
