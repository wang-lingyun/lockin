-- LockIn — Stage 7: Coding Project Tracker + Rewards + manual XP (PRD §10.10,
-- §10.12, §12). Additive over 0007. Reuses owns_student(), set_updated_at(), and
-- level_for_xp() from 0001_init.sql, and the xp_events ledger for all XP.
--
-- Security-sensitive: new tables + RLS + two security-definer RPCs. Human review
-- required (CODEOWNERS).

-- ---------------------------------------------------------------------------
-- coding_projects — a student's coding project (AC 19). status active/completed/
-- archived; optional goal + demo/github links + a reflection note (PRD §10.10).
-- ---------------------------------------------------------------------------

create table coding_projects (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  project_name     text not null,
  goal             text,
  description      text,
  status           text not null default 'active'
                     check (status in ('active','completed','archived')),
  demo_link        text,
  github_link      text,
  reflection_notes text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index coding_projects_student_idx
  on coding_projects (student_id, created_at desc);

alter table coding_projects enable row level security;
create policy "coding_projects: owner all" on coding_projects for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger coding_projects_updated_at before update on coding_projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- coding_features — checklist items under a project. Completing a feature awards
-- 20 XP once (PRD §10.12); xp_awarded mirrors daily_missions as the idempotency
-- guard so re-completing never double-awards. Ownership flows through the parent
-- project (like homework_attachments → homework_submissions).
-- ---------------------------------------------------------------------------

create table coding_features (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references coding_projects(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'not_started'
                 check (status in ('not_started','in_progress','completed')),
  xp_awarded   integer not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index coding_features_project_idx on coding_features (project_id);

alter table coding_features enable row level security;
create policy "coding_features: owner all via project" on coding_features for all
  using (
    exists (
      select 1 from coding_projects p
      where p.id = coding_features.project_id and owns_student(p.student_id)
    )
  )
  with check (
    exists (
      select 1 from coding_projects p
      where p.id = coding_features.project_id and owns_student(p.student_id)
    )
  );
create trigger coding_features_updated_at before update on coding_features
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- rewards — parent-defined rewards (PRD §10.12). A reward unlocks when the
-- student's current_xp reaches required_xp; that's derived **on read** (no cron,
-- per ADR 0006). The unlocked/unlocked_at columns are reserved for a future
-- manual/parent-approved unlock path and are not written in the MVP.
-- ---------------------------------------------------------------------------

create table rewards (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  title        text not null,
  description  text,
  required_xp  integer,
  unlocked     boolean not null default false,
  unlocked_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index rewards_student_idx on rewards (student_id, created_at desc);

alter table rewards enable row level security;
create policy "rewards: owner all" on rewards for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger rewards_updated_at before update on rewards
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- set_coding_feature_status — set a feature's status; the first time it reaches
-- 'completed' it awards 20 XP via the xp_events ledger and bumps the student's
-- denormalized current_xp / current_level (mirrors complete_mission). Idempotent:
-- the xp_awarded guard means re-completing never re-awards. Returns the student.
-- ---------------------------------------------------------------------------

create or replace function set_coding_feature_status(p_feature_id uuid, p_status text)
returns students language plpgsql security definer set search_path = public as $$
declare
  v_feature    coding_features;
  v_student_id uuid;
  v_xp         integer := 0;
  v_student    students;
begin
  if p_status not in ('not_started','in_progress','completed') then
    raise exception 'invalid status';
  end if;

  select * into v_feature from coding_features where id = p_feature_id;
  if not found then
    raise exception 'coding feature not found';
  end if;

  select student_id into v_student_id from coding_projects
    where id = v_feature.project_id;
  if not owns_student(v_student_id) then
    raise exception 'not authorized';
  end if;

  -- Award 20 XP only on the first transition into 'completed'.
  if p_status = 'completed' and v_feature.xp_awarded = 0 then
    v_xp := 20;
  end if;

  update coding_features
    set status = p_status,
        completed_at = case when p_status = 'completed' then now() else null end,
        xp_awarded = greatest(xp_awarded, v_xp),
        updated_at = now()
    where id = p_feature_id;

  if v_xp > 0 then
    insert into xp_events (student_id, source_type, source_id, amount)
      values (v_student_id, 'coding_feature', p_feature_id, v_xp);
    update students
      set current_xp = current_xp + v_xp,
          current_level = level_for_xp(current_xp + v_xp),
          updated_at = now()
      where id = v_student_id;
  end if;

  select * into v_student from students where id = v_student_id;
  return v_student;
end;
$$;

-- ---------------------------------------------------------------------------
-- adjust_student_xp — manual parent XP adjustment (xp.adjust). Writes the ledger
-- (source_type 'manual') and bumps the denormalized aggregates, clamping
-- current_xp at 0 so a negative delta can't drive XP below zero. Returns the
-- student. The reason is recorded in admin_command_log by the command layer.
-- ---------------------------------------------------------------------------

create or replace function adjust_student_xp(
  p_student_id uuid,
  p_delta      integer,
  p_reason     text
) returns students language plpgsql security definer set search_path = public as $$
declare
  v_student students;
begin
  if not owns_student(p_student_id) then
    raise exception 'not authorized';
  end if;

  insert into xp_events (student_id, source_type, source_id, amount)
    values (p_student_id, 'manual', null, p_delta);

  update students
    set current_xp = greatest(0, current_xp + p_delta),
        current_level = level_for_xp(greatest(0, current_xp + p_delta)),
        updated_at = now()
    where id = p_student_id
    returning * into v_student;

  return v_student;
end;
$$;
