# Decisions Log

Chronological record of product/architecture decisions. Newest at the bottom.
Significant architecture decisions also get a numbered ADR under `../adr/`.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-14 | Adopt the requirements-first, staged, human-reviewed workflow. | Speed of vibe coding without losing control of product or repo quality. See [workflow-and-governance.md](workflow-and-governance.md). |
| 2026-06-14 | PRD v0.1 approved as canonical spec at `docs/specs/approved-prd.md`. | Single source of truth for all later work. |
| 2026-06-14 | Stack: Next.js + React + TS + Tailwind + Supabase, deployed on Vercel Hobby. | Free-tier friendly, AI-ready later. ADR 0001 / 0002. |
| 2026-06-14 | MVP auth = parent-only login + in-account student switcher. | Simplest path for a 1-parent / 2-student family; schema still designed for real student logins later. ADR 0004. |
| 2026-06-14 | Homework is text-first in MVP; uploads designed-for but deferred. | Vercel Hobby cost guardrails. ADR 0003. |
| 2026-06-14 | First pass scope = foundation only (governance scaffolding). No app code yet. | Establish docs/specs/rules before any code, per the workflow. |
| 2026-06-14 | PRD v0.2: generic subject **tracks** (sub-subjects) under any subject; Math = HMA/AoPS/Geometry/Calculus. | Math needs independently managed/scheduled sub-subjects; keep it generic. ADR 0005. |
| 2026-06-14 | Added **Chemistry** as a (bonus) subject with seed task. | Requested. |
| 2026-06-14 | Per-student **dated calendar** with times; missions derived on read (no cron). Supersedes the "no complex calendar" non-goal. | "Each track with its own schedule," kept free-tier safe. ADR 0006. |
| 2026-06-14 | **AI-native admin**: one typed Admin Command API + agent gateway (MCP/webhook) in MVP; Slack + voice connectors deferred to external modules. | Manage LockIn conversationally via agents; stay Vercel-Hobby friendly. ADR 0007. |
| 2026-06-14 | **Stage 1 vertical slice** built: `0001_init.sql` (schema + RLS + RPCs), shared zod command schemas, the command layer (`dispatch`→registry→handlers + `admin_command_log`), parent auth (login/signup/signout + middleware), parent dashboard (student switcher, today's missions, XP bar, admin forms). | First end-to-end path login→child→assign→complete→XP. UI and the future agent gateway share one validated command surface. |
| 2026-06-14 | **Stage 2 subjects & tracks** built (ADR 0005): `0002_subjects_tracks.sql` (`subject_tracks`, `student_subjects`, `student_subject_tracks` + RLS; Math tracks seeded; `subject_track_id` on tasks/missions), 4 new commands (`subject.create`, `track.create`, `student.setSubjectPriority/setTrackPriority`), `/settings` page for per-student three-way priority. | Per-student configurable subjects (AC 4/5/6); Math exposes HMA/AoPS/Geometry/Calculus (AC 33). Decided: UI = activate+prioritize only (create commands built, no custom-creation form yet); priority = primary/bonus/inactive, absence = inactive. |
| 2026-06-14 | **Stage 3 calendar & on-read missions** built (ADR 0006): `0003_schedule_blocks.sql` (`schedule_blocks` + RLS + the deferred `daily_missions.schedule_block_id` FK), full iCal **RRULE** recurrence via `rrule.js` (server-side `lib/missions/recurrence.ts`), `getTodaysMissions` merging persisted + virtual entries, 4 new commands (`schedule.block.create/update/delete`, `mission.completeScheduled`), `/schedule` week-agenda UI, dashboard now derived from the calendar. | Per-track dated schedule with times (AC 35) and Today's Missions derived on read with no cron (AC 36), within Vercel Hobby limits. Decided: a block materializes into a `daily_mission` only when marked done (idempotent via `(student,date,block)` unique key), so re-opening a day never duplicates; the add-block form exposes none/daily/weekly presets but stores real RRULE strings (agent can set arbitrary rules via the `update` command). |
| 2026-06-14 | **Stage 4 weekly goals (Quest Board)** built: `0004_weekly_goals.sql` (`weekly_goals` + RLS + `increment_weekly_goal` RPC), 4 new commands (`weeklyGoal.create/update/delete/incrementProgress`), `/quests` week-scoped board (`GoalCard` + progress bars + manual +/− / complete / archive / delete), dashboard "XP this week" + this-week goal progress. | Outcome-based weekly goals (AC 13) + dashboard weekly progress (AC 12), free-tier safe (read-time aggregates, no cron). Decided: goals are **week-scoped** and progress is **manual** in the MVP (no auto-derivation from missions); goals are **separate from XP** (completing a goal awards no XP); a goal **auto-completes** when current ≥ target; status enum = active/completed/archived; **no seed goals** (per-student and date-bound — parent creates them). |
| 2026-06-14 | Stage 4 added **no new ADR** — it implements PRD §10.6/§12 directly and reuses existing decisions (command surface ADR 0007, track attribution ADR 0005). | Not every stage is an architecture fork; a spec-driven feature on established patterns doesn't warrant an ADR. |
| 2026-06-14 | **Working agreement:** at any genuinely new architectural fork, Claude proposes a numbered ADR (Context / Decision / Status / Consequences) for human review **before** writing code; spec-driven features that reuse existing ADRs/patterns just get a decisions-log row. Next likely ADRs: homework file/metadata model (Stage 5, ADR 0003 lands here), agent-token auth & gateway transport (Stage 8, ADR 0007). | Keep durable rationale captured where it matters without ceremony on routine work. Reinforces the requirements-first, human-reviewed workflow. |

## Open decisions / to revisit

- Exact RLS keying strategy once real student logins are introduced.
- Whether the daily-streak recalculation is on-demand vs a once/day job.
- Hosting region / Supabase project provisioning details (pre-production).
- **"HMA" meaning** — assumed a renameable Math-track label; confirm if it maps to a
  specific program.
- **Agent gateway transport** — MCP server vs. signed webhooks vs. both (ADR 0007).
- **[Default applied, confirm] Subject membership source of truth** = `StudentSubject`
  (+ `StudentSubjectTrack`); `LearningProfile` arrays removed (PRD §12).
- **[Default applied, confirm] Missions model** = `ScheduleBlock` is the plan,
  `DailyMission` created lazily on read with `schedule_block_id`, nullable `task_id`
  (PRD §12). Alternative: keep calendar and missions fully separate.
- **Stage 0 npm audit:** 7 advisories remain (esbuild via vitest dev server; postcss
  bundled in Next). All dev/transitive, not reachable in the deployed static app; fixes
  require breaking major bumps. Deferred — revisit when bumping Next/vitest majors.
- **Streak recalculation (Stage 1):** `students.current_streak` exists and is displayed
  but is not yet updated (defaults 0). On-read recalculation lands with the calendar
  (Stage 3 / ADR 0006).
- **Middleware Edge-runtime warning:** `@supabase/ssr` triggers a benign `process.version`
  warning in the Edge middleware build. Non-fatal, build passes; standard for this stack.
- **Stage 1 ad-hoc missions:** `daily_missions.schedule_block_id` is null in Stage 1, so
  the `unique(student_id, date, schedule_block_id)` constraint permits multiple ad-hoc
  missions per day (NULLs are distinct). Schedule-block FK + dedup arrive in Stage 3.
- **Calendar timezone (Stage 3):** all schedule date/time math is **UTC** for now
  (consistent with `lib/date.ts` `todayISO()` and `lib/missions/recurrence.ts`). Per-student
  timezones are deferred — a student in a non-UTC zone may see a block's day/time shifted.
  Revisit before multi-timezone use; the schema stores `timestamptz`, so no migration is
  needed, only read-time conversion.
- **Streak recalculation (Stage 3):** still not implemented — `current_streak` stays a
  displayed default. Now that the calendar exists it can be recomputed on read from
  completed missions; tracked for a later stage.
- **Weekly goal auto-progress (Stage 4):** goal `current_value` is bumped manually
  (`increment_weekly_goal`). Auto-deriving progress from completed missions/homework (e.g.
  "+1 per AoPS mission") is deferred — would link `weekly_goals` to a metric source; revisit
  with the analytics/AI work. Goals are also intentionally **separate from XP** for now.
