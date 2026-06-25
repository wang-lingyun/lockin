# ADR 0010 — Remove XP & Levels (keep the Streak); retire Rewards

- **Status:** Accepted (2026-06-25)
- **Supersedes:** the gamification half of PRD §10.12 and acceptance criteria §16(11)(12);
  retires the Reward model (§16.16) and the Rewards / XP page (§13.12) from the MVP surface.
- **Relates to:** ADR 0006 (on-read derivation — the streak is computed on read),
  ADR 0007 (one typed Admin Command surface — XP/reward commands are removed from it).
- (ADR 0009 stays reserved for the deferred Google-Calendar-sync gate per the decisions log.)

## Context

LockIn shipped (Stage 1 / Stage 7) with a points economy: every task carried an `xp_value`,
completing a mission or a coding feature awarded XP, XP rolled up into Levels
(L1 0 → L6 1200), and **Rewards** unlocked when `current_xp ≥ required_xp`. A parent could
also adjust XP manually.

The parent — who is also the single student in this household — decided the points/level
framing is the wrong motivator for this product. The one motivation signal worth keeping is
the **daily streak**. This started as a request to add an "unmark done" (undo) button for an
accidentally-completed task; once XP is gone, undo is a trivial status flip (there are no
points to claw back), so both changes land together.

Crucially, **the streak is already independent of XP.** `lib/streak/computeStreak.ts`
qualifies a day by "a reflection OR ≥1 completed mission" and never reads XP or level
(see the 2026-06-14 decisions-log row). So removing XP leaves the streak untouched.

## Decision

1. **Remove the XP and Level concepts** from the product entirely — code, UI, copy, the
   shared command surface, and the completion RPCs. Nothing awards, displays, or adjusts
   points or levels anymore.
2. **Retire Rewards entirely.** The feature only ever worked as an XP-threshold unlock; with
   no XP there is nothing to unlock, so the page, commands, and nav entry are removed (not
   repurposed into a manual-unlock list — that was considered and rejected).
3. **Keep the Streak** exactly as it is (qualifying day = reflection or ≥1 completed mission).
4. **Add an "unmark done" (undo)** path: a `mission.uncomplete` command + `uncomplete_mission`
   RPC that flips a completed mission back to `not_started`.
5. **Leave the database schema dormant, not dropped.** A single Supabase instance backs both
   dev and production, so every migration is immediately production. Rather than run
   destructive `DROP`s on the live DB, migration `0010_remove_xp_keep_streak.sql` only
   `create or replace`s the completion RPCs to be XP-free (and adds `uncomplete_mission`).
   These columns/tables/functions stay physically present but **unused**:
   - `students.current_xp`, `students.current_level`
   - `tasks.xp_value`
   - `daily_missions.xp_awarded`, `coding_features.xp_awarded`
   - the whole `rewards` table and the `xp_events` ledger
   - the `level_for_xp` and `adjust_student_xp` functions

## Consequences

- **Today** shows "% done today" + the streak, and **no XP anywhere**. A done mission shows an
  **Undo** button; un-completing updates the percentage. (A done item on Today is always a
  materialized mission, so it always has a `missionId` — the undo needs nothing else.)
- **Manage** loses the XP bar, the "+N XP this week" line, the Level badge, and the next-reward
  block. The glance strip shows the streak instead of the level.
- **Coding** still tracks projects and features and marks them done; finishing a feature no
  longer awards points.
- The shared package drops `LEVEL_THRESHOLDS` / `levelForXp` / `xpToNextLevel`,
  `CODING_FEATURE_XP`, the reward/XP-adjust commands and schemas, and `xpValue` on task
  creation; it gains `MissionUncompleteInput` and the `mission.uncomplete` command.
- **Dormant schema is intentional debt.** The unused columns still come back in `SELECT *`
  reads and are simply ignored by the typed row shapes. A later, separately-reviewed migration
  can drop them once we're confident nothing external depends on them. Until then, do not
  reintroduce reads of these columns.
- Reversible: re-introducing points would mean re-adding the command/UI layer; the ledger and
  columns are still there to build on.
