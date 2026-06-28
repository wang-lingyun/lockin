---
name: schedule-update
description: >-
  Update a LockIn student's schedule directly against the Supabase Postgres DB:
  add daily-mission tasks for a date, add recurring or one-off schedule blocks
  (calendar events), attach notes/links to tasks, and clear/rebuild a student's
  recurring blocks. Portable to another environment and to a Codex agent — the
  DB password is supplied by the environment, never stored in the repo. Use when
  asked to "add tasks/missions", "update the schedule", "add a class/practice/
  competition", or "clear and rebuild" a student's daily plan.
---

# LockIn — Schedule Update

Add and edit student schedule data straight in the LockIn Supabase database.
LockIn has no scripted command path (commands run only through the authenticated
UI), so structured schedule edits are done as **direct, parent-authorized SQL**.

This skill is self-contained and **portable**: it carries the connection
coordinates, the schema/FK facts, and the exact SQL templates. The only thing it
does NOT carry is the DB password — that comes from the environment (see
**Connecting**), so this folder is safe to copy into another environment or hand
to a Codex agent.

## Hard rules (read first)

- **Never commit secrets.** The DB password lives only in `credentials.env`
  (gitignored) or an environment variable — never in a tracked file.
- **This is a minor's data.** Only act on an explicit, specific human request.
  Echo back exactly what you will write (student, date, items) before running a
  destructive `delete`/`update`.
- **Authorization per operation.** A direct prod-DB write needs the user's
  explicit go-ahead for *that* operation, not a blanket one.
- **Additive by default.** Prefer `insert`. For `delete`/rebuild, confirm scope
  first and run inside a single `begin; … commit;` transaction so a mistake
  rolls back.
- Do not change schema, RLS, auth, or storage here — those need human review
  (CODEOWNERS). This skill only writes rows.

## Connecting

Run psql through the bundled helper, which resolves the password in this order
(option 3 — env var wins, else local creds file, else the app's `.env.local`):

1. `LOCKIN_DATABASE_URL` (a full connection URL incl. password), or
   `SUPABASE_DB_PASSWORD` set in the environment;
2. `credentials.env` in this skill folder (copy from `credentials.env.example`);
3. `apps/web/.env.local` at the repo root (this dev machine).

```bash
# One-off query / statement:
bash .Codex/skills/schedule-update/connect.sh -c "select id, name, grade from students order by created_at;"

# A multi-statement transaction from a heredoc:
bash .Codex/skills/schedule-update/connect.sh <<'SQL'
begin;
-- … statements …
commit;
SQL
```

The helper passes the password via `PGPASSWORD` (never on the command line) and
sets `-v ON_ERROR_STOP=1` so a transaction aborts cleanly on the first error.

**In another environment / Codex:** set `SUPABASE_DB_PASSWORD` (or
`LOCKIN_DATABASE_URL`) as a secret in that environment, *or* copy a filled-in
`credentials.env` into this folder. Override host/user/db with `LOCKIN_DB_*`
vars if the target database differs (see `credentials.env.example`).

## Workflow

1. **Identify the target** — which student, which date(s). Get the student id and
   the relevant subject/track ids. The current LockIn ids are in
   [reference.md](reference.md); **UUIDs differ per database**, so in any other
   environment run the *Discovery queries* there first.
2. **Pick the right shape:**
   - A dated piece of work the student checks off → a **task + mission** (template 1).
   - A repeating calendar item (class, practice, daily drill) → a **recurring
     schedule block** (template 2).
   - A single dated event (a competition, a one-time class) → a **one-off block**
     (template 3).
   - A resource link or instruction on existing work → a **note/link** (template 4).
3. **Confirm** the exact rows with the user (especially before delete/rebuild).
4. **Run** the SQL via `connect.sh` inside a transaction.
5. **Verify** with a read-back `select` for the affected student + date.
6. Durations: store minutes in `estimated_minutes`; the UI renders them (≥60 →
   hours with fraction, 30 → "0.5 hour", else minutes). Outcome-only items
   (e.g. "finish 3 problems") can leave `estimated_minutes` null.

All SQL templates, schema facts, FK behaviors, and the current ids are in
**[reference.md](reference.md)**.
