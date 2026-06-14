# ADR 0006 — Per-student dated calendar; missions derived on read

- **Status:** Accepted (supersedes part of PRD §19)
- **Date:** 2026-06-14

## Context

Each subject/track needs its own schedule "with dates and times." PRD v0.1 listed
"complex calendar scheduling" as a non-goal; v0.2 revises this for the single-parent,
dated-calendar case. We must stay within Vercel Hobby (no cron, no background jobs).

## Decision

Add a `ScheduleBlock` entity (student, subject, optional track, optional task, start/
end datetime or all-day, optional recurrence rule, status). The schedule is the source
of planned study sessions. **Today's Missions are derived on demand** from the blocks
falling on the current date; recurrence is expanded at read time. Completing a block
can create/complete a `DailyMission` and award XP. No scheduled jobs.

## Consequences

- A dated per-student calendar is now in scope; multi-resource/room scheduling,
  automatic optimization, and external calendar sync remain out of scope for MVP.
- Read-time recurrence expansion keeps the free tier safe but must be bounded
  (paginate/limit the date window queried).
