-- LockIn — Stage 2: subject tracks + per-student subject/track priority (ADR 0005).
-- Additive over 0001_init.sql. Reuses set_updated_at() and owns_student().
--
-- Security-sensitive: new RLS policies. Human review required (CODEOWNERS).

-- ---------------------------------------------------------------------------
-- subject_tracks — generic sub-subjects under any subject (Math → HMA/AoPS/...)
-- ---------------------------------------------------------------------------

create table subject_tracks (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid not null references subjects(id) on delete cascade,
  name            text not null,
  description     text,
  icon            text,
  color           text,
  sort_order      integer not null default 0,
  is_default      boolean not null default false,
  is_active       boolean not null default true,
  owner_parent_id uuid references profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table subject_tracks enable row level security;

create policy "subject_tracks: read default or own" on subject_tracks for select
  using (is_default or owner_parent_id = auth.uid());
create policy "subject_tracks: write own" on subject_tracks for all
  using (owner_parent_id = auth.uid()) with check (owner_parent_id = auth.uid());

create trigger subject_tracks_updated_at before update on subject_tracks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- student_subjects / student_subject_tracks — per-student activation + priority
-- Absence of a row = inactive. priority_type carries the core-vs-optional signal.
-- ---------------------------------------------------------------------------

create table student_subjects (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  subject_id    uuid not null references subjects(id) on delete cascade,
  priority_type text not null check (priority_type in ('primary','bonus','inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (student_id, subject_id)
);

alter table student_subjects enable row level security;
create policy "student_subjects: owner all" on student_subjects for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger student_subjects_updated_at before update on student_subjects
  for each row execute function set_updated_at();

create table student_subject_tracks (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  subject_track_id uuid not null references subject_tracks(id) on delete cascade,
  priority_type    text not null check (priority_type in ('primary','bonus','inactive')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (student_id, subject_track_id)
);

alter table student_subject_tracks enable row level security;
create policy "student_subject_tracks: owner all" on student_subject_tracks for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger student_subject_tracks_updated_at before update on student_subject_tracks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Track attribution on tasks/missions (optional; selector UI lands later).
-- ---------------------------------------------------------------------------

alter table tasks
  add column subject_track_id uuid references subject_tracks(id) on delete set null;
alter table daily_missions
  add column subject_track_id uuid references subject_tracks(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Seed default Math tracks (AC 33) under the seeded default Math subject.
-- ---------------------------------------------------------------------------

insert into subject_tracks (subject_id, name, sort_order, is_default)
select s.id, v.name, v.ord, true
from subjects s
join (values ('HMA', 1), ('AoPS', 2), ('Geometry', 3), ('Calculus', 4))
  as v(name, ord) on true
where s.name = 'Math' and s.is_default;
