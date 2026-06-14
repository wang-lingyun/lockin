# CLAUDE.md

Project rules for working in this repository. Read this before doing anything.

## Project

LockIn is a private, multi-student summer learning dashboard for kids. The first
use case is one parent managing 2 students, but the product is designed to support
more students later.

The canonical, approved specification is **[docs/specs/approved-prd.md](docs/specs/approved-prd.md)**.
When the PRD and any other document disagree, the PRD wins.

## Product Principles

- Math and coding are core. Physics, SAT, Chinese, and English Writing are optional
  learning tracks.
- Parents/admins create schedules and review progress. Students complete tasks and
  upload homework.
- Each student has a **separate** learning profile — do not assume shared subjects,
  goals, task types, schedules, or motivation models.
- Outcome-based, not time-based. Track problems solved, drafts written, features
  built, mistakes corrected — not minutes.
- Raw homework collection must be preserved in a structured way for future AI
  analysis.
- Do not build full AI analysis in the MVP. Build extensible, AI-ready data
  structures only.

## Technical Constraints

- Stack: Next.js (App Router) + React + TypeScript + Tailwind + Supabase
  (PostgreSQL, Auth, Storage). Deployed on Vercel.
- Must be deployable on the **Vercel Hobby (free) tier** and Supabase Free where
  possible.
- Prefer simple, low-cost architecture. Avoid microservices.
- No long-running serverless functions. No background workers on Vercel.
- No high-frequency cron jobs. If a scheduled job is truly needed, at most once/day;
  prefer computing progress on demand.
- No AI model inference on Vercel. No paid AI calls in the MVP.
- Homework is **text-first** in the MVP. File/image upload is designed-for but not
  required; if implemented, files go to Supabase Storage with only metadata in
  Postgres — never processed inside Vercel functions.
- Keep bundles small, queries student-scoped, lists paginated. No realtime listeners
  or auto-refresh polling unless truly needed.
- **Subjects can have generic tracks** (sub-subjects); track attribution is optional
  on tasks/missions/goals/homework. See ADR 0005.
- **Calendar** is a per-student dated `ScheduleBlock` model; Today's Missions are
  derived from it **on read** (recurrence expanded at read time, no cron). See ADR 0006.
- **One admin command surface:** every admin action is a typed, validated Admin
  Command used by *both* the UI and AI agents — never build a separate "AI path."
  The agent gateway (MCP/webhook) is auth'd, parent-scoped, and audit-logged; Slack
  and voice are deferred external connectors. See ADR 0007.

## Authentication (DECIDED)

MVP uses **parent-only login with an in-account student switcher**. Students are
profiles inside the parent account, not separate logins. The schema must be designed
so real per-student logins can be added later without a rewrite. See
[docs/adr/0004-auth-parent-only-with-student-switcher.md](docs/adr/0004-auth-parent-only-with-student-switcher.md).

## Coding Rules

- Do not write app code before producing a plan that has been reviewed.
- Do not change the database schema without updating `docs/specs/`.
- Do not modify auth, storage, or permissions/RLS without explicit human approval
  (these paths are also protected by CODEOWNERS).
- Every feature must have acceptance criteria (trace them to PRD §16 where possible).
- Every PR must include tests, or explain why tests are not applicable.
- After writing code, run lint / typecheck / tests before declaring a task done.

## AI Work Rules

- AI-generated drafts (plans, schema drafts, UX drafts) go under `docs/ai-drafts/`.
- Approved specs go under `docs/specs/`. Promote drafts into specs only after human
  review.
- Organize app code by **architecture**, not by human-vs-AI author. Never create
  `human-code/` vs `ai-code/` directories.
- Never commit secrets. Use `.env.local` (gitignored) and document required env vars.
- Never invent product decisions. Mark assumptions clearly and surface them.

## Repository Map

```
docs/human/      Your original intent — workflow philosophy, decisions log
docs/ai-drafts/  Claude-generated planning, pre-approval
docs/specs/      Approved, canonical specs (PRD lives here)
docs/adr/        Architecture Decision Records
.claude/agents/  Bounded subagent role definitions
.claude/commands/ Reusable slash commands
.github/         CODEOWNERS, PR template, CI
apps/web/        (future) the Next.js app
packages/shared/ (future) shared types & validation
```

## Workflow

Human decides product → Claude proposes plans → Claude writes bounded code →
Human reviews architecture, data model, auth, privacy, and merge.

Build one vertical slice at a time. Multi-agent / multi-worktree fan-out only after
Stage 0/1 interfaces are stable. See
[docs/human/workflow-and-governance.md](docs/human/workflow-and-governance.md).
