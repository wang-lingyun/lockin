-- LockIn — Stage 3: per-student calendar (ADR 0006). The schedule is the plan;
-- Today's Missions are derived from it on read (no cron). Additive over 0002.
--
-- Security-sensitive: new RLS policy + FK. Human review required (CODEOWNERS).

-- ---------------------------------------------------------------------------
-- schedule_blocks — source of truth for planned study sessions.
-- recurrence_rule holds an iCal RRULE, expanded at read time (rrule.js).
-- ---------------------------------------------------------------------------

create table schedule_blocks (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  subject_id       uuid references subjects(id) on delete set null,
  subject_track_id uuid references subject_tracks(id) on delete set null,
  task_id          uuid references tasks(id) on delete set null,
  title            text not null,
  start_at         timestamptz,
  end_at           timestamptz,
  all_day          boolean not null default false,
  recurrence_rule  text,
  location         text,
  notes            text,
  status           text not null default 'planned'
                     check (status in ('planned','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index schedule_blocks_student_idx on schedule_blocks (student_id);

alter table schedule_blocks enable row level security;
create policy "schedule_blocks: owner all" on schedule_blocks for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger schedule_blocks_updated_at before update on schedule_blocks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Wire the deferred FK: daily_missions.schedule_block_id (column + unique key
-- were created in 0001_init.sql) now references schedule_blocks.
-- ---------------------------------------------------------------------------

alter table daily_missions
  add constraint daily_missions_schedule_block_id_fkey
  foreign key (schedule_block_id) references schedule_blocks(id) on delete set null;
