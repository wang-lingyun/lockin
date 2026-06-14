# ADR 0004 — MVP auth: parent-only login with student switcher

- **Status:** Accepted
- **Date:** 2026-06-14

## Context

The first use case is one parent managing two students. Real per-student logins add
auth, onboarding, and RLS complexity that isn't needed for a private family MVP, but
the product must support real student accounts later (PRD §8).

## Decision

MVP uses a **single parent login** with an in-account **student switcher**. Students
are profiles (`Student` rows) owned by the parent via `ParentStudentRelationship`,
not auth users. All student-scoped data carries `student_id`, and ownership is
enforced through the parent relationship.

To stay forward-compatible with real student logins:

- Keep `User.role` and a clear ownership chain (parent → relationship → student).
- Scope every student-owned table by `student_id` from day one.
- Write RLS so it can later also grant a student-user access to their own rows
  without restructuring tables.

## Consequences

- Simpler MVP: one set of credentials, no student onboarding.
- Later, introducing student logins is an additive RLS/policy change, not a schema
  rewrite.
- Decided 2026-06-14 with the user (foundation pass).
