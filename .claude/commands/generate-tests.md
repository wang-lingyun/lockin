---
description: Generate tests for the feature/files in $ARGUMENTS, traced to acceptance criteria.
---

Generate tests for the feature or files named in $ARGUMENTS.

Read `docs/specs/approved-prd.md` §16 and map each relevant acceptance criterion to a
test. Cover edge cases: empty states, per-student data isolation, XP/level/streak math,
pagination, and permission boundaries.

Keep tests fast, deterministic, and CI-friendly on the free tier. If something cannot
be tested, state why instead of writing a hollow test.
