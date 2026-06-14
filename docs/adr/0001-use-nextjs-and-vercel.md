# ADR 0001 — Use Next.js (App Router) on Vercel

- **Status:** Accepted
- **Date:** 2026-06-14

## Context

LockIn is a private family-scale learning dashboard that must run on free/low-cost
hosting, render fast, and stay simple to maintain. The team is small and AI-assisted.

## Decision

Use **Next.js (App Router) + React + TypeScript + Tailwind CSS**, deployed on the
**Vercel Hobby (free) tier**. Use server actions / API routes only for lightweight
operations. Prefer static or cached pages; avoid per-render API calls, heavy SSR,
large bundles, realtime listeners, and polling.

## Consequences

- One repo, one production deployment, optional preview deployments.
- Must respect Vercel Hobby limits: no long-running functions, no high-frequency
  cron, no background workers, no AI inference on Vercel.
- Re-verify Vercel limits/pricing before production (PRD §20, References).
