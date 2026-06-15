-- LockIn — Stage 6: Mistake/Revision Bank + Reflections (PRD §10.9, §10.11, §12).
-- Captures the learning loop after work is reviewed: mistakes to revisit and
-- daily reflections. Additive over 0006. Reuses owns_student() and
-- set_updated_at() from 0001_init.sql. The streak is computed on read (no cron,
-- per ADR 0006) from these reflections + completed missions — no schema needed.
--
-- Security-sensitive: new tables + RLS. Human review required (CODEOWNERS).

-- ---------------------------------------------------------------------------
-- mistake_bank_entries — one row per mistake to revisit (AC 17). Optional links
-- to a subject/track (ADR 0005) and to the homework submission it came from
-- (AC 18; on delete set null so removing homework never drops the mistake).
-- Pipeline (PRD §10.9): Raw Homework → Review → Mistake Bank → Review Task.
-- ---------------------------------------------------------------------------

create table mistake_bank_entries (
  id                     uuid primary key default gen_random_uuid(),
  student_id             uuid not null references students(id) on delete cascade,
  subject_id             uuid references subjects(id) on delete set null,
  subject_track_id       uuid references subject_tracks(id) on delete set null,
  homework_submission_id uuid references homework_submissions(id) on delete set null,
  title                  text,
  topic                  text,
  mistake_description    text,
  correct_idea           text,
  mistake_type           text,
  retry_date             date,
  status                 text not null default 'needs_review'
                           check (status in ('needs_review','reviewed','mastered')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index mistake_bank_entries_student_idx
  on mistake_bank_entries (student_id, status, created_at desc);

alter table mistake_bank_entries enable row level security;
create policy "mistake_bank_entries: owner all" on mistake_bank_entries for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger mistake_bank_entries_updated_at before update on mistake_bank_entries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- reflections — one daily reflection per student (AC 20). The four prompts are
-- PRD §10.11: what did I finish / what was hard / what did I learn / what to do
-- next; parent_comment is the optional parent response. unique(student_id, date)
-- makes a day's reflection editable rather than duplicated. The date default is
-- Pacific to match the app timezone (lib/date.ts, migration 0006).
-- ---------------------------------------------------------------------------

create table reflections (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  date            date not null default (now() at time zone 'America/Los_Angeles')::date,
  what_finished   text,
  what_was_hard   text,
  what_learned    text,
  what_to_do_next text,
  parent_comment  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (student_id, date)
);

create index reflections_student_idx on reflections (student_id, date desc);

alter table reflections enable row level security;
create policy "reflections: owner all" on reflections for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger reflections_updated_at before update on reflections
  for each row execute function set_updated_at();
