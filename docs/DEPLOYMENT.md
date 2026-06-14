# Deployment Guide

LockIn deploys as one Next.js app on **Vercel Hobby**, backed by **Supabase** (DB / Auth
/ Storage). Persistent data lives in Supabase, never in the Vercel runtime (ADR 0001/0002).

This is a monorepo (npm workspaces). The deployable app is `apps/web`.

## One-time setup

### 1. Supabase project
1. Create a project at https://supabase.com (Free tier).
2. Project Settings → API. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)
3. Schema/migrations live in `apps/web/db/` and are applied via the Supabase CLI
   (added from Stage 1). Stage 0 needs no schema.

### 2. Vercel project
1. Sign in to https://vercel.com with GitHub (Hobby tier).
2. **Import** the `lockin` repository.
3. Set **Root Directory = `apps/web`** (monorepo). Vercel auto-detects Next.js.
4. Add Environment Variables (from step 1):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AGENT_GATEWAY_SIGNING_SECRET` (Stage 8 only)
5. Deploy.

### 3. Local development
```bash
npm install                       # from repo root (installs all workspaces)
cp apps/web/.env.example apps/web/.env.local   # then fill in Supabase values
npm run dev                       # http://localhost:3000
```

## How deploys happen

Vercel is git-connected:

- Push to a branch / open a PR → **Preview deployment** (temporary URL).
- Merge to `main` → **Production deployment** (your live URL).

No manual deploy command. CI (`.github/workflows/ci.yml`) runs
lint → typecheck → test → build on every push/PR.

## Free-tier guardrails (PRD §7)

- No long-running functions, no background workers, no high-frequency cron, no AI
  inference on Vercel.
- Today's Missions and progress are computed on read (ADR 0006).
- Re-verify Vercel limits/pricing before production (PRD §20, References).
