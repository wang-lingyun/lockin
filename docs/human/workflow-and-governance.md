# Workflow & Governance (Human Intent)

This is the original human-authored process for building LockIn with Claude. It is
intent, not a spec — the approved spec is [../specs/approved-prd.md](../specs/approved-prd.md).

## Core rule

> Human decides product. Claude proposes plans. Claude writes bounded code.
> Human reviews architecture, data model, auth, privacy, and merge.

This buys the speed of vibe coding without losing control of the product or repo quality.

## Sequence

1. **Requirements first — do not start with code.** Produce a PRD, user roles, core
   journeys, data model, backend requirements, Vercel-compatible architecture, a
   milestone plan, and a list of risks/missing decisions. Use plan mode heavily
   before allowing code changes.
2. **Staged implementation, not one giant build.** Each stage has: goal, files
   likely touched, schema changes, API routes, UI pages/components, acceptance
   criteria, tests, and "what should NOT be built yet." Do one vertical slice first:
   login → create child → assign task → child marks complete → parent sees progress.
3. **Multiple agents only after Stage 0/1 is stable.** One architect/orchestrator
   creates the repo skeleton and contracts first. Do not let multiple agents edit the
   same files at the start. For parallel work, use git worktrees, not multiple agents
   on one checkout.
4. **Separate by intent/provenance/review status, not by author.** Never split app
   code into `human-code/` vs `ai-code/`. Use `docs/human/`, `docs/ai-drafts/`, and
   `docs/specs/` instead.
5. **Track AI work through branches, PRs, commits.** Branch naming
   (`human/...`, `ai/stageN-...`), PR labels (`ai-generated`, `ai-assisted`,
   `human-authored`, `needs-human-review`, `security-sensitive`), and commit trailers
   (`AI-Assisted:`, `Human-Reviewed-By:`, `Spec-Source:`). CODEOWNERS forces human
   review on sensitive areas.
6. **Strong CLAUDE.md** holds the project rules — see [../../CLAUDE.md](../../CLAUDE.md).

## Suggested stages

- Stage 0: Repo setup — Next.js, auth choice, DB choice, CI
- Stage 1: User model — parent/admin + children/student profiles
- Stage 2: Schedule builder — daily/weekly task plan
- Stage 3: Task completion tracking and motivation loop
- Stage 4: Homework upload / raw artifact collection
- Stage 5: Parent dashboard
- Stage 6: Multi-child learning tracks
- Stage 7: AI analysis placeholder (not full AI yet)
- Stage 8: Polish, deployment, observability

## Agent roles (for later fan-out)

- **Architect** — owns architecture, contracts, schema; reviews PRs.
- **Frontend** — pages, components, UX, responsive design.
- **Backend** — DB schema, API routes, auth, storage.
- **QA** — tests, edge cases, acceptance checks.
- **Security/Review** — auth rules, file upload safety, privacy review.
- **Docs** — README, setup guide, deployment guide.

## Branch / PR / commit conventions

Branches: `human/prd-initial`, `ai/stage1-auth`, `ai/stage2-schedule-ui`, etc.
Labels: `ai-generated`, `ai-assisted`, `human-authored`, `needs-human-review`, `security-sensitive`.
Commit trailer example:

```
Implement schedule card UI

AI-Assisted: Claude Code
Human-Reviewed-By: Lingyun Wang
Spec-Source: docs/specs/approved-prd.md
```
