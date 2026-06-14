# ADR 0005 — Generic subject tracks (sub-subjects)

- **Status:** Accepted
- **Date:** 2026-06-14

## Context

Math needs to be split into independently managed and scheduled sub-subjects (HMA,
AoPS, Geometry, Calculus). Other subjects (e.g. Chemistry) may want the same later.

## Decision

Introduce a **generic track layer** that applies to any subject, not a Math special
case. A `SubjectTrack` belongs to a `Subject`; a `StudentSubjectTrack` activates a
track per student with its own priority. `Task`, `TaskAssignment`, `DailyMission`,
`WeeklyGoal`, `HomeworkSubmission`, and `MistakeBankEntry` gain an optional
`subject_track_id` for track-aware progress and future AI analysis.

Subjects without tracks behave exactly as before (track is optional everywhere).

## Consequences

- Uniform model; no per-subject branching in code.
- Slightly more join complexity; mitigated by keeping `subject_id` denormalized on
  child records alongside the optional `subject_track_id`.
