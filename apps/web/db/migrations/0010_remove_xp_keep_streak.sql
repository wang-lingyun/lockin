-- LockIn — Stage 11: remove XP & Levels from the product, keep Streak (ADR 0010,
-- PRD §10.12 amended). Motivation is now the streak alone; the Rewards feature is
-- retired. This migration is NON-DESTRUCTIVE: it only redefines the completion
-- RPCs so they stop doing XP accounting, and adds an undo RPC. No columns or
-- tables are dropped.
--
-- DORMANT (intentionally left in place, unused, per the "leave columns dormant"
-- decision — reversible, and honours the additive-migration rule):
--   students.current_xp / current_level, tasks.xp_value, daily_missions.xp_awarded,
--   coding_features.xp_awarded, rewards.* (whole table), the xp_events table, and
--   the level_for_xp() / adjust_student_xp() functions. Nothing reads or writes
--   them after this migration; they can be dropped in a later cleanup if desired.
--
-- No RLS or auth change. complete_mission / uncomplete_mission / the coding-feature
-- RPC stay SECURITY DEFINER and keep their owns_student() ownership checks (the
-- daily_missions / students / coding_features RLS from 0001 & 0008 still applies).

-- ---------------------------------------------------------------------------
-- complete_mission — mark a mission done. XP accounting removed: it now only sets
-- status + completed_at. Idempotent (re-completing is a no-op). Still returns the
-- student row so existing callers/return types are unchanged.
-- ---------------------------------------------------------------------------
create or replace function complete_mission(p_mission_id uuid)
returns students language plpgsql security definer set search_path = public as $$
declare
  v_mission daily_missions;
  v_student students;
begin
  select * into v_mission from daily_missions where id = p_mission_id;
  if not found then
    raise exception 'mission not found';
  end if;
  if not owns_student(v_mission.student_id) then
    raise exception 'not authorized';
  end if;

  if v_mission.status <> 'completed' then
    update daily_missions
      set status = 'completed', completed_at = now()
      where id = p_mission_id;
  end if;

  select * into v_student from students where id = v_mission.student_id;
  return v_student;
end;
$$;

-- ---------------------------------------------------------------------------
-- uncomplete_mission — undo an accidental completion. Sets the mission back to
-- not_started and clears completed_at. Idempotent (no-op if not completed). With
-- XP gone there is nothing to claw back. Returns the student row, mirroring
-- complete_mission.
-- ---------------------------------------------------------------------------
create or replace function uncomplete_mission(p_mission_id uuid)
returns students language plpgsql security definer set search_path = public as $$
declare
  v_mission daily_missions;
  v_student students;
begin
  select * into v_mission from daily_missions where id = p_mission_id;
  if not found then
    raise exception 'mission not found';
  end if;
  if not owns_student(v_mission.student_id) then
    raise exception 'not authorized';
  end if;

  if v_mission.status = 'completed' then
    update daily_missions
      set status = 'not_started', completed_at = null
      where id = p_mission_id;
  end if;

  select * into v_student from students where id = v_mission.student_id;
  return v_student;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_coding_feature_status — XP award removed. Now only validates + sets status
-- and completed_at, then returns the student. (coding_features.xp_awarded is left
-- dormant and no longer written.)
-- ---------------------------------------------------------------------------
create or replace function set_coding_feature_status(p_feature_id uuid, p_status text)
returns students language plpgsql security definer set search_path = public as $$
declare
  v_feature    coding_features;
  v_student_id uuid;
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

  update coding_features
    set status = p_status,
        completed_at = case when p_status = 'completed' then now() else null end,
        updated_at = now()
    where id = p_feature_id;

  select * into v_student from students where id = v_student_id;
  return v_student;
end;
$$;
