# LockIn — Staged Implementation Plan

**Status:** DRAFT (`docs/ai-drafts/`, pre-approval). Derived from
`docs/specs/approved-prd.md` v0.2, `architecture-draft.md`, and ADRs 0001–0007.

Each stage is independently shippable and lists: **Goal · Files · Schema · API/commands
· UI · Acceptance (→ PRD §16) · Tests · Not yet.** Acceptance numbers like `[AC 9]`
reference PRD §16 criteria.

Build order follows PRD §17, restructured so **Stage 1 is one thin vertical slice**
end-to-end (the workflow's recommended slice: login → create child → assign task →
child marks complete → parent sees progress), then later stages add breadth.

> **Single-surface rule:** from Stage 1 on, every mutation goes through a typed command
> handler in `packages/shared/commands`. The external agent gateway (Stage 8) is just
> another caller — we do not retrofit it.

---

## Stage 0 — Repo setup & deploy skeleton

- **Goal:** A deployable empty Next.js app wired to Supabase, with CI green.
- **Files:** `apps/web/` (Next.js App Router + TS + Tailwind), `apps/web/lib/supabase/`,
  `packages/shared/`, `.env.example`, `apps/web/db/` (empty migrations dir),
  `docs/DEPLOYMENT.md`.
- **Schema:** none yet (just the migration tooling/config).
- **API/commands:** none.
- **UI:** a placeholder landing page; Tailwind theme tokens (dark/focus mode, §14).
- **Acceptance:** `[AC 23,24,25,26,27]` deploys to Vercel Hobby; CI runs
  lint/typecheck; Supabase project connected via env vars.
- **Tests:** CI smoke (build + typecheck). One trivial unit test to prove the runner.
- **Not yet:** any tables, auth UI, features.

## Stage 1 — Vertical slice (auth + student + task + mission + XP)

- **Goal:** Prove the whole pipe with RLS: parent logs in, creates a student, switches
  to them, creates & assigns one task, sees it as a Today's Mission, marks it complete,
  XP increments, parent dashboard reflects it.
- **Files:** `app/(auth)/login`, `app/(app)/dashboard`, `app/(app)/students/[id]/today`,
  `lib/auth/`, `lib/commands/`, `packages/shared/commands/{registry,student,task,mission}`,
  `components/{StudentSwitcher,MissionCard,XpBar,StudentCard}`.
- **Schema:** `profiles`, `students`, `parent_student_relationships`,
  `learning_profiles`, minimal `subjects` (defaults), `tasks`, `task_assignments`,
  `daily_missions`, `xp_events` + cached aggregates on `students`. RLS + `owns_student()`.
- **API/commands:** `student.create`, `task.create`, `task.assign`,
  `mission.complete` (awards XP via `xp_events`, updates aggregates, logs to
  `admin_command_log`).
- **UI:** login, parent dashboard with student cards, student switcher in TopNav,
  Today's Missions list with complete action, XP bar.
- **Acceptance:** `[AC 1,2,3,7,8,9,10,11,12,21,22]`.
- **Tests:** RLS isolation (parent B cannot read parent A's student), mission-complete
  awards XP once (idempotency via `xp_awarded` snapshot), level threshold calc.
- **Not yet:** tracks, calendar, goals, homework, etc. One subject is enough.

## Stage 2 — Subjects & tracks (configurable system, ADR 0005)

- **Goal:** Full configurable subjects + generic tracks; per-student activation.
- **Files:** `app/(app)/settings` (subject/track config), `components/SubjectConfig`,
  `packages/shared/commands/{subject,track}`.
- **Schema:** finalize `subjects` (+`owner_parent_id`), `subject_tracks`,
  `student_subjects`, `student_subject_tracks`; add `subject_track_id` FKs already in
  tasks/missions/etc.
- **API/commands:** `subject.create`, `track.create`, `student.setSubjectPriority`,
  `student.setTrackPriority`.
- **UI:** settings page to manage subjects/tracks and per-student priority; track
  color/icon; Math shows HMA/AoPS/Geometry/Calculus.
- **Acceptance:** `[AC 4,5,6,33,34]` (Chemistry seeded; Math tracks present).
- **Tests:** a student can activate Geometry+Calculus but not AoPS; default subjects
  visible to all, custom subjects only to owner.
- **Not yet:** scheduling tracks (Stage 3).

## Stage 3 — Calendar & on-read missions (ADR 0006)

- **Goal:** Per-student dated calendar; Today's Missions derived from it without cron.
- **Files:** `app/(app)/students/[id]/schedule`, `lib/missions/getTodaysMissions`,
  `components/{WeekGrid,ScheduleBlockForm}`, `packages/shared/commands/schedule`.
- **Schema:** `schedule_blocks`; `daily_missions.schedule_block_id` + unique
  `(student_id,date,schedule_block_id)`.
- **API/commands:** `schedule.block.create/update/delete`.
- **UI:** week calendar (track-colored); creating a block; Today's Missions now reflect
  the schedule for the date.
- **Acceptance:** `[AC 35,36]`.
- **Tests:** recurrence expands within the day window; re-opening a day does not
  duplicate missions (unique key); ad-hoc (null block) missions coexist.
- **Not yet:** external calendar sync, drag-drop optimization (non-goals).

## Stage 4 — Weekly goals (Quest Board)

- **Goal:** Outcome-based weekly goals per student/track with progress.
- **Files:** `app/(app)/students/[id]/quests`, `components/{GoalCard,ProgressBar}`,
  `packages/shared/commands/weeklyGoal`.
- **Schema:** `weekly_goals`.
- **API/commands:** `weeklyGoal.create/update`, `weeklyGoal.incrementProgress`.
- **UI:** quest board with target/current/%; weekly XP progress on dashboard.
- **Acceptance:** `[AC 13]` + dashboard weekly progress (`[AC 12]`).
- **Tests:** progress aggregation; week boundary handling.
- **Not yet:** auto-deriving goal progress from missions (manual/explicit for MVP).

## Stage 5 — Homework Inbox (text-first, ADR 0003)

- **Goal:** Students submit text homework; parents review.
- **Files:** `app/(app)/students/[id]/homework`,
  `components/{SubmissionForm,SubmissionList,ReviewPanel}`,
  `packages/shared/commands/homework`.
- **Schema:** `homework_submissions` (incl. AI-ready fields, unpopulated).
- **API/commands:** `homework.submit`, `homework.review` (sets review_status,
  parent_notes).
- **UI:** submission form (raw_text), paginated list, parent review panel.
- **Acceptance:** `[AC 14,15,16,29,30]`.
- **Tests:** per-student isolation; pagination; review_status transitions; AI fields
  default to `not_started` and are never auto-processed.
- **Not yet:** file/image upload, OCR, any AI pipeline (non-goals).

## Stage 6 — Mistake/Revision Bank + Reflections

- **Goal:** Capture mistakes (optionally linked to homework) and daily reflections.
- **Files:** `app/(app)/students/[id]/{mistakes,reflections}`, related components,
  `packages/shared/commands/{mistake,reflection}`.
- **Schema:** `mistake_bank_entries`, `reflections`.
- **API/commands:** `mistake.create/update`, `reflection.create/update`.
- **UI:** mistake entry form with optional homework link; reflection prompts (§10.11).
- **Acceptance:** `[AC 17,18,20]`.
- **Tests:** mistake→homework link integrity; reflection contributes to streak
  qualification.
- **Not yet:** AI mistake detection.

## Stage 7 — Coding tracker, Rewards, full Parent Dashboard, plan structures

- **Goal:** Remaining student modules + a complete parent overview + AI-ready plan
  tables (stored, manual).
- **Files:** `app/(app)/students/[id]/{coding,rewards}`, dashboard aggregation,
  `packages/shared/commands/{codingProject,codingFeature,reward,plan}`.
- **Schema:** `coding_projects`, `coding_features`, `rewards`,
  `personalized_learning_plans`, `ai_analysis_results`, `subject_rubrics`.
- **API/commands:** coding project/feature CRUD; `reward.create/unlock`;
  `xp.adjust`; `plan.create` (manual).
- **UI:** coding project cards + feature checklist; rewards/level meter; parent
  dashboard shows per-student completion, weekly progress, review queue, recent
  reflections (§10.1).
- **Acceptance:** `[AC 19]` + dashboard completeness; `[AC 30,32]` (AI-ready structures
  exist, no heavy processing).
- **Tests:** coding feature completion awards XP; reward unlock at XP threshold;
  dashboard aggregates correct per student.
- **Not yet:** populating AI tables via any model.

## Stage 8 — Admin Command API gateway, audit log, polish, deploy/observability

- **Goal:** Expose the existing command layer to external agents; finalize polish and
  production deploy. (Slack/voice connectors remain external/future.)
- **Files:** `app/api/agent/route.ts`, `app/(app)/settings/agents`,
  `components/{AgentCredentialList,AuditLogTable}`, `lib/auth/` (token verification).
- **Schema:** `agent_credentials`, `admin_command_log` (already used by handlers; now
  surfaced + token issuance).
- **API/commands:** authenticated `/api/agent` webhook that verifies a bearer token
  against `agent_credentials` and calls the same `dispatch(...)` as the UI, scoped to
  the parent (acts as the parent; never unrestricted service role).
- **UI:** create/revoke agent credentials; view the audit log.
- **Acceptance:** `[AC 37,38,39,40]`.
- **Tests:** an agent token can only act within its parent's data; revoked tokens are
  rejected; every command appears in `admin_command_log`; the live Slack/voice
  connectors are NOT required.
- **Not yet:** the live Slack bot, voice/STT, MCP server (post-MVP external modules) —
  but the contract supports adding them.

---

## Cross-cutting (every stage)

- New/changed schema → update `docs/specs/` and add a migration; auth/storage/RLS
  changes are `security-sensitive` + `needs-human-review` (CODEOWNERS).
- Every PR: tests or a justified exception; lint/typecheck/test green; provenance
  trailers.
- Run a **security review** (the `security-reviewer` agent) at Stage 1 (RLS baseline),
  Stage 5 (homework/privacy), and Stage 8 (agent gateway).

## Decisions still open (carry from `decisions.md`)

1. Confirm v0.2 reconciliation defaults (membership source of truth; missions model).
2. XP ledger vs recompute; `profiles` mirror; `owner_parent_id` on subjects.
3. Agent gateway transport (webhook / MCP / both).
4. “HMA” label meaning.
