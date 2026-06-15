-- LockIn — Stage 4: weekly goals / Quest Board (PRD §10.6, §12). Per-student,
-- per-week outcome goals with target/current progress. Additive over 0003.
-- Reuses owns_student() and set_updated_at() from 0001_init.sql.
--
-- Security-sensitive: new RLS policy + security-definer RPC. Human review
-- required (CODEOWNERS).

-- ---------------------------------------------------------------------------
-- weekly_goals — outcome-based goals scoped to a student and a calendar week.
-- subject_id / subject_track_id are optional track attribution (ADR 0005).
-- Progress is manual in the MVP (no auto-derivation from missions).
-- ---------------------------------------------------------------------------

create table weekly_goals (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  subject_id       uuid references subjects(id) on delete set null,
  subject_track_id uuid references subject_tracks(id) on delete set null,
  week_start_date  date not null,
  title            text not null,
  target_value     numeric,
  current_value    numeric not null default 0,
  unit             text,
  due_date         date,
  status           text not null default 'active'
                     check (status in ('active','completed','archived')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index weekly_goals_student_week_idx
  on weekly_goals (student_id, week_start_date);

alter table weekly_goals enable row level security;
create policy "weekly_goals: owner all" on weekly_goals for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger weekly_goals_updated_at before update on weekly_goals
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- increment_weekly_goal — atomic progress bump (mirrors complete_mission):
-- ownership-checked, clamps current_value at 0, and auto-completes the goal
-- when it reaches its target. Server-side so UI and agent paths behave alike.
-- ---------------------------------------------------------------------------

create or replace function increment_weekly_goal(p_goal_id uuid, p_delta numeric)
returns weekly_goals language plpgsql security definer set search_path = public as $$
declare
  v_goal weekly_goals;
begin
  select * into v_goal from weekly_goals where id = p_goal_id;
  if not found then
    raise exception 'weekly goal not found';
  end if;
  if not owns_student(v_goal.student_id) then
    raise exception 'not authorized';
  end if;

  update weekly_goals
    set current_value = greatest(0, current_value + p_delta),
        status = case
          when target_value is not null
               and (current_value + p_delta) >= target_value
          then 'completed'
          else status
        end,
        updated_at = now()
    where id = p_goal_id
    returning * into v_goal;

  return v_goal;
end;
$$;
