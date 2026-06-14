# AI Disclosure

LockIn is built with substantial assistance from Claude Code, under human direction
and review. We track AI involvement transparently rather than hiding or quarantining
it.

## How AI work is tracked

**Branches**

- `human/...` — primarily human-authored
- `ai/stageN-...` — primarily AI-authored under human direction

**Pull request labels**

- `ai-generated` — code substantially written by AI
- `ai-assisted` — human-led, AI-assisted
- `human-authored` — primarily human
- `needs-human-review` — requires human sign-off before merge
- `security-sensitive` — touches auth, storage, permissions, or privacy

**Commit trailers**

```
AI-Assisted: Claude Code
Human-Reviewed-By: <name>
Spec-Source: docs/specs/approved-prd.md
```

## Human review guarantee

The following always require human review before merge (enforced via
`.github/CODEOWNERS`): database schema, authentication, file storage, permissions/RLS,
and approved specs. A human owns all product decisions, architecture, data model,
auth, privacy, and final merge.

## Data & privacy note

LockIn stores children's learning data. It is private by default and not intended for
public sharing. See PRD §11.2.
