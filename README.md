# LockIn

> Math. Code. Focus. Level Up.

**LockIn** is a private, multi-student summer learning dashboard for kids — daily
missions, weekly goals, XP/levels/streaks, homework capture, a mistake/revision bank,
and a data model ready for future AI-powered personalized learning plans.

> **Status:** Foundation pass. Governance, specs, and rules are in place; the app has
> not been scaffolded yet.

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — project rules (read this first).
- **[docs/specs/approved-prd.md](docs/specs/approved-prd.md)** — the canonical,
approved product requirements (source of truth).
- **[docs/human/workflow-and-governance.md](docs/human/workflow-and-governance.md)** —
how we build LockIn (requirements → staged plans → bounded code → human review).
- **[docs/human/decisions.md](docs/human/decisions.md)** — decisions log.
- **[docs/adr/](docs/adr/)** — architecture decision records.
- **[AI_DISCLOSURE.md](AI_DISCLOSURE.md)** — how AI involvement is tracked.

## Planned stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL,
Auth, Storage) · deployed on Vercel Hobby. See ADRs
[0001](docs/adr/0001-use-nextjs-and-vercel.md) and
[0002](docs/adr/0002-use-supabase-postgres.md).

## Repository layout

```
docs/human/        Original human intent — workflow, decisions
docs/ai-drafts/    Claude-generated planning (pre-approval)
docs/specs/        Approved specs (PRD)
docs/adr/          Architecture decision records
.claude/agents/    Bounded subagent roles
.claude/commands/  Reusable slash commands
.github/           CODEOWNERS, PR template, CI
apps/web/          (future) the Next.js app
packages/shared/   (future) shared types & validation
```

## Roadmap

Stage 0 (repo setup) → Stage 1 (parent/student model) → first vertical slice:
login → create child → assign task → child marks complete → parent sees progress.
Then staged build per [the workflow doc](docs/human/workflow-and-governance.md).