---
description: Produce a detailed implementation plan for a given stage (no code).
---

Do NOT write code. Produce an implementation plan for the stage named in $ARGUMENTS
(or ask which stage if none given).

Read `CLAUDE.md` and `docs/specs/approved-prd.md` first. Output a plan with:

- **Goal** — one sentence.
- **Files likely touched.**
- **Database/schema changes** (and the matching `docs/specs/` update needed).
- **API routes / server actions.**
- **UI pages/components.**
- **Acceptance criteria** — traced to PRD §16 where possible.
- **Tests** to write.
- **What should NOT be built yet.**
- **Risks / open decisions.**

Save the plan to `docs/ai-drafts/stage-plan.md` (append if it exists).
