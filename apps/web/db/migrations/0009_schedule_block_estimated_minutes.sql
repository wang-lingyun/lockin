-- LockIn — Stage 9: target finish time for schedule blocks (PRD §10.16). Additive
-- over 0008. Mirrors tasks.estimated_minutes (0001_init.sql): a planning *estimate*
-- (not time-tracking), surfaced on the Today page in hours (0.5h granularity).
--
-- Non-sensitive: a single nullable column on an existing table. No RLS or auth
-- change (schedule_blocks RLS from 0003_schedule_blocks.sql still applies).

alter table schedule_blocks add column estimated_minutes integer;
