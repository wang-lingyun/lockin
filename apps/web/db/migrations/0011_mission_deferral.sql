-- LockIn — mission deferral: "move a mission to a further date" + a defer note
-- (Today page). Additive over 0001_init.sql's daily_missions.
--
-- Two changes, both on the existing daily_missions table:
--   1. A new 'deferred' status. When a mission is moved to a later date we leave a
--      *tombstone* row on the original date in this status: it shows as
--      "Moved to {date}" and — crucially — keeps that day's schedule-block
--      occurrence suppressed (Today derives block occurrences on read and only
--      skips a date that already has a persisted mission row; ADR 0006). Without
--      the tombstone the recurrence would simply regenerate the moved occurrence.
--   2. deferred_to: the target date a tombstone was moved to (null otherwise).
-- The defer note reuses the existing daily_missions.notes column.
--
-- Non-sensitive: a check-constraint widening + one nullable column on an existing
-- table. No RLS or auth change (the "daily_missions: owner all" policy from
-- 0001_init.sql still applies).

alter table daily_missions
  drop constraint daily_missions_status_check,
  add constraint daily_missions_status_check
    check (status in ('not_started', 'in_progress', 'completed', 'deferred'));

alter table daily_missions add column deferred_to date;
