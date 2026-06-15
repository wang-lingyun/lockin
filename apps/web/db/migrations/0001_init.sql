-- LockIn — Stage 1 init: identity, students, tasks, missions, XP.
-- Implements the subset of the schema needed for the vertical slice
-- (PRD §12; architecture-draft §3). RLS-first; parent-only auth (ADR 0004).
--
-- Security-sensitive: schema + RLS. Human review required (CODEOWNERS).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Level for a given total XP (PRD §10.12). Keep in sync with @lockin/shared.
create or replace function level_for_xp(p_xp integer)
returns integer language sql immutable as $$
  select case
    when p_xp >= 1200 then 6
    when p_xp >= 800  then 5
    when p_xp >= 500  then 4
    when p_xp >= 250  then 3
    when p_xp >= 100  then 2
    else 1
  end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — app-level mirror of auth.users (the parent)
-- ---------------------------------------------------------------------------

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'parent' check (role in ('parent','student')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: self read"   on profiles for select using (id = auth.uid());
create policy "profiles: self update" on profiles for update using (id = auth.uid());

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- students + ownership
-- ---------------------------------------------------------------------------

create table students (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  grade          text,
  avatar         text,
  current_xp     integer not null default 0,
  current_level  integer not null default 1,
  current_streak integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table parent_student_relationships (
  id                uuid primary key default gen_random_uuid(),
  parent_user_id    uuid not null references profiles(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  relationship_type text not null default 'parent',
  created_at        timestamptz not null default now(),
  unique (parent_user_id, student_id)
);

create table learning_profiles (
  id                       uuid primary key default gen_random_uuid(),
  student_id               uuid not null references students(id) on delete cascade,
  preferred_daily_minutes  integer,
  preferred_schedule_style text,
  motivation_style         text,
  weekly_goal_style        text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (student_id)
);

-- Ownership predicate used by RLS across student-scoped tables.
create or replace function owns_student(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from parent_student_relationships r
    where r.student_id = s and r.parent_user_id = auth.uid()
  );
$$;

alter table students enable row level security;
alter table parent_student_relationships enable row level security;
alter table learning_profiles enable row level security;

create policy "students: owner all" on students for all
  using (owns_student(id)) with check (owns_student(id));

create policy "psr: self all" on parent_student_relationships for all
  using (parent_user_id = auth.uid()) with check (parent_user_id = auth.uid());

create policy "learning_profiles: owner all" on learning_profiles for all
  using (owns_student(student_id)) with check (owns_student(student_id));

create trigger students_updated_at before update on students
  for each row execute function set_updated_at();
create trigger learning_profiles_updated_at before update on learning_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- subjects (defaults seeded; per-parent custom subjects allowed)
-- ---------------------------------------------------------------------------

create table subjects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  icon            text,
  color           text,
  is_default      boolean not null default false,
  owner_parent_id uuid references profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table subjects enable row level security;

create policy "subjects: read default or own" on subjects for select
  using (is_default or owner_parent_id = auth.uid());
create policy "subjects: write own" on subjects for all
  using (owner_parent_id = auth.uid()) with check (owner_parent_id = auth.uid());

create trigger subjects_updated_at before update on subjects
  for each row execute function set_updated_at();

insert into subjects (name, color, is_default) values
  ('Math',            '#6366f1', true),
  ('Coding',          '#22d3ee', true),
  ('Physics',         '#a78bfa', true),
  ('SAT',             '#f472b6', true),
  ('Chemistry',       '#34d399', true),
  ('Chinese',         '#fb7185', true),
  ('English Writing', '#fbbf24', true),
  ('Reading',         '#60a5fa', true),
  ('Reflection',      '#9aa4bf', true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- tasks, assignments, missions, xp
-- ---------------------------------------------------------------------------

create table tasks (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  subject_id        uuid references subjects(id) on delete set null,
  task_type         text,
  difficulty        text,
  xp_value          integer not null default 0,
  estimated_minutes integer,
  repeatable        boolean not null default false,
  optional_link     text,
  tags              text[],
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "tasks: owner all" on tasks for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create trigger tasks_updated_at before update on tasks
  for each row execute function set_updated_at();

create table task_assignments (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references tasks(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  assigned_by   uuid references profiles(id) on delete set null,
  assigned_date date,
  due_date      date,
  status        text not null default 'assigned',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table task_assignments enable row level security;
create policy "task_assignments: owner all" on task_assignments for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger task_assignments_updated_at before update on task_assignments
  for each row execute function set_updated_at();

create table daily_missions (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references students(id) on delete cascade,
  task_id            uuid references tasks(id) on delete set null,
  subject_id         uuid references subjects(id) on delete set null,
  schedule_block_id  uuid,  -- FK added in Stage 3 (calendar)
  date               date not null,
  status             text not null default 'not_started'
                       check (status in ('not_started','in_progress','completed')),
  xp_awarded         integer not null default 0,
  completed_at       timestamptz,
  notes              text,
  parent_feedback    text,
  student_reflection text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (student_id, date, schedule_block_id)
);

alter table daily_missions enable row level security;
create policy "daily_missions: owner all" on daily_missions for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger daily_missions_updated_at before update on daily_missions
  for each row execute function set_updated_at();

create table xp_events (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  source_type text not null,
  source_id   uuid,
  amount      integer not null,
  created_at  timestamptz not null default now()
);

alter table xp_events enable row level security;
create policy "xp_events: owner all" on xp_events for all
  using (owns_student(student_id)) with check (owns_student(student_id));

-- ---------------------------------------------------------------------------
-- audit log (used by the command layer; surfaced in Stage 8)
-- ---------------------------------------------------------------------------

create table admin_command_log (
  id             uuid primary key default gen_random_uuid(),
  parent_user_id uuid references profiles(id) on delete set null,
  actor_type     text not null check (actor_type in ('parent_ui','agent')),
  actor_id       uuid,
  channel        text not null check (channel in ('ui','slack','voice','api')),
  command_name   text not null,
  input_payload  jsonb,
  result_status  text not null,
  result_summary text,
  created_at     timestamptz not null default now()
);

alter table admin_command_log enable row level security;
create policy "admin_command_log: self read" on admin_command_log for select
  using (parent_user_id = auth.uid());
create policy "admin_command_log: self insert" on admin_command_log for insert
  with check (parent_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPCs (atomic, ownership-checked) — called by the command layer
-- ---------------------------------------------------------------------------

-- Create a student + ownership link + learning profile for the current parent.
create or replace function create_student(p_name text, p_grade text default null)
returns students language plpgsql security definer set search_path = public as $$
declare
  v_student students;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into students (name, grade) values (p_name, p_grade) returning * into v_student;
  insert into parent_student_relationships (parent_user_id, student_id)
    values (auth.uid(), v_student.id);
  insert into learning_profiles (student_id) values (v_student.id);

  return v_student;
end;
$$;

-- Complete a mission once: award XP, update aggregates. Idempotent.
create or replace function complete_mission(p_mission_id uuid)
returns students language plpgsql security definer set search_path = public as $$
declare
  v_mission daily_missions;
  v_xp      integer;
  v_student students;
begin
  select * into v_mission from daily_missions where id = p_mission_id;
  if not found then
    raise exception 'mission not found';
  end if;
  if not owns_student(v_mission.student_id) then
    raise exception 'not authorized';
  end if;

  -- Already completed → return current state without re-awarding.
  if v_mission.status = 'completed' then
    select * into v_student from students where id = v_mission.student_id;
    return v_student;
  end if;

  v_xp := coalesce((select xp_value from tasks where id = v_mission.task_id), 0);

  update daily_missions
    set status = 'completed', completed_at = now(), xp_awarded = v_xp
    where id = p_mission_id;

  if v_xp > 0 then
    insert into xp_events (student_id, source_type, source_id, amount)
      values (v_mission.student_id, 'mission', p_mission_id, v_xp);
  end if;

  update students
    set current_xp = current_xp + v_xp,
        current_level = level_for_xp(current_xp + v_xp),
        updated_at = now()
    where id = v_mission.student_id
    returning * into v_student;

  return v_student;
end;
$$;
