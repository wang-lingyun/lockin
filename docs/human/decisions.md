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
