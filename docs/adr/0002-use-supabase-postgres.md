# ADR 0002 — Use Supabase (PostgreSQL, Auth, Storage)

- **Status:** Accepted
- **Date:** 2026-06-14

## Context

We need authentication, a relational database for ~19 related entities, row-level
access control to isolate family data, and future file storage — all on a free tier,
with Vercel hosting only the web app.

## Decision

Use **Supabase** for PostgreSQL, Auth, Row-Level Security, and Storage (future files).
Vercel hosts the Next.js app and lightweight server actions. Persistent data lives in
Supabase, never in the Vercel runtime. Files (when added) go to Supabase Storage with
only metadata in Postgres.

## Consequences

- RLS is the primary data-isolation mechanism; auth/storage/RLS changes are
  human-reviewed (CODEOWNERS).
- Target Supabase Free tier for the MVP.
- AI analysis is an external module later, not a Supabase-hosted heavy pipeline.
