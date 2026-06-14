# ADR 0003 — Homework capture is text-first; uploads deferred

- **Status:** Accepted
- **Date:** 2026-06-14

## Context

Homework collection is core and must be preserved for future AI analysis. But large
file/photo/PDF uploads and OCR are expensive and conflict with Vercel Hobby cost
guardrails (PRD §7.5, §19).

## Decision

MVP captures homework as **text first** (typed solutions, code snippets, short
drafts). The `HomeworkSubmission` model includes `file_url` / `image_url` /
`source_type` fields so uploads can be added later without a schema rewrite. If/when
uploads ship: limit size and type, store in Supabase Storage, keep only metadata in
Postgres, and never process files inside Vercel functions.

## Consequences

- MVP needs no storage buckets to function.
- AI-readiness fields (`ai_analysis_status`, `detected_*`, etc.) are stored now but
  not populated by any pipeline in the MVP.
