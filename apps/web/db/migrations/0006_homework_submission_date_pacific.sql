-- LockIn — make the auto-stamped homework submission date use the app timezone
-- (Pacific, America/Los_Angeles) instead of UTC, matching lib/date.ts
-- APP_TIME_ZONE. `now()` is a timestamptz; converting it to the Pacific wall
-- clock and casting to date yields the family's local calendar day (DST-aware).
-- Additive over 0005; only changes the column default (existing rows untouched).

alter table homework_submissions
  alter column submission_date
  set default (now() at time zone 'America/Los_Angeles')::date;
