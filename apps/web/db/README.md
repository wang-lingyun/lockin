# Database (Supabase / PostgreSQL)

SQL migrations and the seed script live here. This directory is CODEOWNERS-protected —
schema, RLS, and storage changes require human review (see ADR 0002, PRD §11).

- `migrations/` — ordered SQL migrations (added from Stage 1).
- `seed.sql` — default subjects, Math tracks, Chemistry, and the two seed students
  (PRD §15), added in Stage 1/2.

Apply with the Supabase CLI against your project. Stage 0 ships no schema yet.
