-- LockIn — mission "skipped" outcome ("Didn't do it" on the Today page). Additive
-- over 0011_mission_deferral.sql.
--
-- A 'skipped' mission was explicitly *not* done (vs. 'not_started' = still could
-- be). It's a recorded, terminal-but-reversible outcome: kept for history (and
-- future AI analysis), counts as not-done in the day's progress, and stops the
-- item nagging. Available on scheduled blocks too (materialized first, like
-- complete/partial/defer).
--
-- Non-sensitive: a check-constraint widening only. No RLS or auth change (the
-- "daily_missions: owner all" policy from 0001_init.sql still applies).

alter table daily_missions
  drop constraint daily_missions_status_check,
  add constraint daily_missions_status_check
    check (status in ('not_started', 'in_progress', 'completed', 'deferred', 'skipped'));
