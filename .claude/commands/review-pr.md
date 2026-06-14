---
description: Review the current diff against the approved spec; list issues before fixing.
---

Review the current diff (or the PR named in $ARGUMENTS) against `docs/specs/approved-prd.md`
and `CLAUDE.md`.

Do NOT fix anything yet. Produce a findings list with: severity, file:line, the issue,
and a suggested fix. Specifically check:

- Matches the relevant PRD acceptance criteria (§16).
- Respects Vercel Hobby + Supabase Free constraints (no long-running functions,
  high-frequency cron, AI on Vercel, large bundles, polling).
- No schema/auth/storage/RLS change without a matching `docs/specs/` update and the
  `security-sensitive` + `needs-human-review` labels.
- Per-student data isolation is preserved.
- Tests present or a justified exception.
- No secrets committed.

End with a clear verdict: approve, approve-with-nits, or request-changes.
