# LockIn — High-Level Product Requirements

**Version:** 0.2
**Date:** 2026-06-14
**Product Name:** LockIn
**Status:** APPROVED — this is the canonical source of truth for all LockIn work.

**Changelog**
- v0.2 (2026-06-14): Added generic **subject tracks** (sub-subjects, e.g. Math → HMA,
  AoPS, Geometry, Calculus); added **Chemistry** subject; added **per-student dated
  calendar scheduling** (supersedes the prior "no complex calendar" non-goal); added
  **AI-native admin** via a typed Admin Command API + agent gateway (Slack/voice
  connectors deferred to an external module). See ADRs 0005–0007.
- v0.1 (2026-06-14): Initial approved PRD.
**Tagline Options:**
- Math. Code. Focus. Level Up.
- Turn summer into progress.
- Lock in. Learn deeply. Build daily.

---

## 1. Product Overview

**LockIn** is a private, multi-student learning dashboard for kids. It helps students stay focused, motivated, and self-driven through daily missions, weekly goals, XP, progress tracking, homework capture, mistake/revision review, and future AI-powered personalized learning plans.

The app should feel like a modern learning mission-control system, not a boring calendar or parent-only checklist.

The initial use case is a parent managing 2 kids during summer, but the product should be designed to support more students later.

---

## 2. Main Product Goals

LockIn should help a family answer these questions:

1. What should each kid do today?
2. What are their weekly learning goals?
3. Are they making consistent progress?
4. What homework or raw work has been collected?
5. What mistakes, weak topics, and skill gaps are showing up?
6. How can future AI generate customized learning plans from their actual work?
7. How can students feel ownership and motivation instead of feeling micromanaged?

---

## 3. Target Users

### 3.1 Parent User

The parent manages the overall system.

The parent should be able to:

- Create and manage student profiles.
- Define each student's active subjects.
- Create tasks.
- Assign tasks to one or more students.
- Create weekly goals.
- Review homework submissions.
- Review mistake/revision bank entries.
- View progress for each student.
- Adjust XP, levels, streaks, and rewards.
- Later approve AI-generated personalized plans.

### 3.2 Student User

Each student has their own dashboard.

The student should be able to:

- View today's missions.
- Choose tasks from the task bank, when allowed.
- Mark tasks as complete.
- Submit homework or raw work.
- Add reflections.
- View XP, level, streak, badges, and rewards.
- Track mistakes and corrections.
- Track coding projects, if Coding is an active subject.

---

## 4. Initial Student Profiles

The MVP should support at least 2 students.

### 4.1 Student A

Primary subjects: Math, Coding
Bonus subjects: Physics, SAT, Chemistry
Math tracks (sub-subjects, each independently scheduled): HMA, AoPS, Geometry, Calculus.
Learning style: More intensive, project-driven, strong focus on contest math and coding output.
Example focus: Math contest practice across tracks (HMA, AoPS, Geometry, Calculus), coding projects, optional physics/SAT/chemistry work.

> **Assumption (confirm):** "HMA" is treated as a renameable Math track label
> (e.g. a Hard Math / Honors Math Analysis program). Rename in seed data if it means
> something specific.

### 4.2 Student B

Primary subjects: Chinese, Math, English Writing
Bonus subjects can be added later.
Learning style: Balanced, reading/writing focused, strong focus on consistency and skill building.
Example focus: Chinese reading and writing, math fluency and problem solving, English paragraph and essay writing.

### 4.3 Important Design Rule

The system must not assume every student has the same subjects, goals, task types, schedule, or motivation model. Each student should have a separate learning profile.

---

## 5. Core Product Principles

### 5.1 Kid-Driven
Students should be able to choose some tasks from the task bank instead of only receiving parent-assigned work.

### 5.2 Outcome-Based
Track completed outcomes (problems solved, mistakes corrected, writing drafts completed, coding features built, homework submitted, reflections written, topics reviewed, reading passages completed), not just time.

### 5.3 Personalized Per Student
Each student should have separate: subjects, daily missions, weekly goals, XP, level, streak, homework submissions, mistake/revision bank, reflection history, personalized learning plan.

### 5.4 Future AI-Ready
Collect raw learning data in a structured way so future AI can analyze mistake patterns, weak topics, learning habits, writing quality, coding progress, Chinese reading/writing progress, reading comprehension, and recommended next steps.

### 5.5 Free-Tier Friendly
The MVP should be compatible with Vercel Hobby/free-tier hosting and Supabase Free where possible. Avoid heavy server-side processing, high-frequency cron jobs, long-running functions, and paid AI workflows in the MVP.

---

## 6. Recommended Technical Stack

- **Next.js** / **React** / **TypeScript** / **Tailwind CSS**
- **Supabase** (PostgreSQL, Auth, Storage)
- **Vercel** deployment

High-level architecture:

```text
Next.js app on Vercel Hobby
        ↓
Supabase Auth
        ↓
Supabase PostgreSQL
        ↓
Supabase Storage for future files
        ↓
Future external AI analysis module
```

---

## 7. Vercel Hobby / Free-Tier Compatibility Requirements

LockIn should be designed to run within Vercel Hobby/free-tier constraints for the MVP. Initial target: a private family dashboard with 1 parent account, 2 student profiles, low daily traffic, small number of homework submissions, text-first data entry, minimal file uploads, no heavy AI processing on Vercel.

### 7.1 Deployment Constraint
Deployable on: Vercel Hobby, Supabase Free (if possible), one GitHub repo, one production deployment, optional preview deployments.
Should NOT require: paid Vercel Pro features, paid team collaboration, high-frequency cron jobs, long-running serverless functions, background workers on Vercel, heavy image/video processing on Vercel, AI inference on Vercel.

### 7.2 Frontend Architecture Constraint
Use: Next.js App Router, TypeScript, Tailwind, lightweight pages, simple server actions or API routes only when needed, static/cached pages where possible.
Avoid: expensive SSR for every page, unnecessary API calls on every render, large client bundles, heavy animation libraries, large image assets, auto-refresh polling, realtime subscriptions unless truly needed.

### 7.3 Backend Architecture Constraint
Use Supabase for auth, PostgreSQL, row-level security, file storage, basic APIs. Vercel mainly hosts the web app. Use Vercel Functions only for lightweight ops (small validation, derived records, simple admin actions, future rate-limited AI calls). Do NOT use Vercel Functions for long-running AI, batch homework processing, OCR, large file parsing, heavy scheduled jobs, repeated background polling.

### 7.4 AI Processing Constraint
MVP collects data for future AI analysis but does not run heavy AI inside Vercel. For MVP: store raw homework, store AI-analysis-ready fields, allow manual parent review, add AI status fields (`not_started`, `queued`, `completed`, `failed`), do not implement expensive AI pipelines yet. Future AI processing is an external module.

### 7.5 File Upload Constraint
For MVP, prioritize text input over large uploads. Allowed: typed homework, code snippets, short writing drafts, small optional image upload placeholder. Avoid: large PDFs, large photo collections, video, audio, bulk imports, automatic OCR. If implemented: limit size/type, store in Supabase Storage (not Vercel runtime), store only metadata in PostgreSQL, do not process files in Vercel Functions.

### 7.6 Cron / Scheduled Job Constraint
MVP should not require frequent scheduled jobs. If needed, at most once per day. Prefer calculating progress on demand.

### 7.7 Data Fetching Requirement
Use student-scoped queries, pagination (homework, reflections, mistake entries), simple dashboard aggregate queries, minimal repeated fetching. Avoid loading all historical data on the dashboard, fetching all students' full homework history by default, fetching large file contents automatically, realtime listeners on every table, excessive auto-refresh.

### 7.8 MVP Usage Assumption
```text
Parent users: 1
Student profiles: 2 initially
Daily active users: 2–3
Daily tasks completed: 10–30
Daily homework submissions: 0–5
File uploads: minimal
AI calls: none in MVP
Traffic: private family use only
```

### 7.9 Cost Guardrails
1. Do not use Vercel Blob for homework storage unless explicitly needed.
2. Use Supabase Storage for future files.
3. No paid analytics tools.
4. No paid monitoring tools.
5. No paid AI calls in MVP.
6. No background workers in Vercel.
7. No high-frequency cron jobs.
8. No unnecessary serverless API routes.
9. Keep image optimization minimal.
10. Keep all pages and queries simple.

---

## 8. Authentication and User Management

Roles: Parent, Student. A parent account can own multiple student profiles.

For MVP (DECIDED): Parent login + student switcher inside the parent account. The backend must be designed to support real student accounts later.

### 8.1 Requirements
User authentication; parent account; multiple students under one parent; role-based access support; private data by default; students can only access their own data if student login is enabled later; parent can access all children under their account.

---

## 9. Access Control Requirements

### 9.1 Parent Permissions
Create/edit students; create subjects; **create subject tracks and activate/deactivate subjects and tracks per student**; create/assign tasks; create daily missions; **create and edit schedule blocks (calendar) for any of their students**; create weekly goals; review homework; view all student progress under their account; edit XP/rewards; create or approve plans; **manage agent service credentials and view the AdminCommandLog audit trail** (§10.17).

### 9.2 Student Permissions
View own missions; complete own tasks; submit own homework; add own reflections; add own mistake/revision entries if enabled; view own progress; view own rewards.

### 9.3 Data Isolation
Data must be isolated by parent/student ownership. A parent should only see students under their own account. If student login is implemented later, a student should only see their own data. Use Supabase Row Level Security or equivalent.

### 9.4 Agent Access
Agents act on behalf of a parent using scoped service credentials issued by that
parent. An agent's authority never exceeds the parent's own (same ownership/RLS
boundary). Every agent command is authenticated, authorized, validated, rate-limited,
and recorded in AdminCommandLog. Agent credentials can be revoked by the parent.

---

## 10. Core Product Modules

### 10.1 Parent Dashboard
Shows all students at a glance. Per student: today's completion status, weekly progress, current XP, level, streak, active subjects, homework waiting for review, mistakes/revisions needing correction, recent reflections.

### 10.2 Student Switcher
The selected student controls all student-specific views (Student Dashboard, Today's Missions, Weekly Quest Board, Task Bank, Homework Inbox, Mistake/Revision Bank, Coding Projects, Reflections, Rewards, Personalized Plan).

### 10.3 Student Dashboard
Student name, today's date, today's missions, XP earned today, weekly XP progress, current streak, current level, weekly goal progress, quick actions (complete task, add homework, add reflection, add mistake/revision, view weekly goals). The student should immediately understand what to do today.

### 10.4 Configurable Subject System
Subjects are configurable, not hard-coded. Defaults: Math, Coding, Physics, SAT, **Chemistry**, Chinese, English Writing, Reading, Reflection. Each student can have a different active subject list. Subject fields: name, description, icon, color, active/inactive, default or custom.

#### 10.4.1 Subject Tracks (Sub-subjects)
Any subject may have ordered child **tracks** (sub-subjects). Tracks are generic and
apply to any subject, not just Math.

- Example — Math tracks: HMA, AoPS, Geometry, Calculus.
- Chemistry and other subjects may define tracks later (optional).
- Each student activates tracks independently (a student can take Geometry + Calculus
  but not AoPS), with their own priority (primary / bonus / inactive).
- Tasks, assignments, daily missions, weekly goals, homework, and mistake entries may
  optionally be attributed to a specific track (`subject_track_id`), so progress and
  future AI analysis can be track-aware.
- Track fields: subject, name, description, icon, color, sort order, default/custom,
  active/inactive.
- **Each track can be scheduled independently** — see §10.16.

### 10.5 Today's Missions
Daily task list per student. Each mission: student, subject, task title, description, estimated time, difficulty, XP value, status (not started / in progress / completed / deferred / skipped), notes, completion timestamp.

- **Partially done** = `in_progress`. It is a started-but-unfinished marker; it does **not** count toward the day's progress bar or the done/total tally (only `completed` does). It can be toggled on and off.
- **Didn't do it** = `skipped`. An explicit not-done outcome (vs. `not_started` = still could be done), kept for history/AI analysis and reversible via Undo. It **counts as not-done** — it stays in the day's denominator (unlike a moved tombstone) so the percentage reflects the miss. Available on scheduled blocks too (materialized first).
- **Move to a further date** defers a mission to a later day with an optional note. The original day keeps a `deferred` **tombstone** ("Moved to {date}", `deferred_to` set) — out of the day's progress/totals but preserved for history; a fresh mission is created on the target date carrying the note. The tombstone also keeps a recurring schedule block from regenerating that day's occurrence (since occurrences are derived on read and skipped where a mission row already exists — see §13).

### 10.6 Weekly Quest Board
Weekly goals per student, mostly outcome-based. Each goal: student, subject, goal title, target number, current progress, unit, due date, status, completion percentage.

### 10.7 Task Bank
Library of reusable tasks. Tasks can be global, assigned to one/multiple students, subject-specific, repeatable, one-time. Each task: title, description, subject, task type, difficulty, XP value, estimated minutes, repeatable flag, optional link, assigned students, tags.

### 10.8 Homework Inbox
Students submit raw work. For MVP, text submission is enough; backend leaves room for image/file uploads. Each submission: student, subject, topic, assignment title, submission date, raw text, file URL (optional), image URL (optional), source type (typed text / photo / PDF / code / link), student notes, parent notes, review status (submitted / reviewed / needs correction / mastered), AI analysis status (not started / queued / completed / failed), AI summary (optional), detected skills (optional), detected mistakes (optional), recommended next steps (optional).

### 10.9 Mistake / Revision Bank
Multi-subject. Each entry: student, subject, related homework submission (optional), problem/assignment title, topic, mistake description, correct idea, mistake type, retry date, status (needs review / reviewed / mastered). Pipeline: Raw Homework → Parent or AI Review → Mistake/Revision Bank → Review Task → Weekly Plan → Daily Mission.

### 10.10 Coding Project Tracker
For students with Coding active. Each project: student, project name, goal, description, status, features to build, completed features, GitHub link (optional), demo link (optional), reflection notes. Each feature: project, title, description, status (not started / in progress / completed).

### 10.11 Reflection Page
Daily reflections. Prompts: what did I finish today? what was hard? what did I learn? what should I do tomorrow? Each reflection: student, date, completed work, difficulty/challenge, next step, parent comment (optional).

### 10.12 Streak (XP, Levels, and Rewards removed)
**Amended 2026-06-25 (ADR 0010):** the MVP keeps **only the daily Streak** as a motivation
signal. XP/points, Levels, and Rewards have been removed from the product. A day counts toward
the streak if the student writes a reflection **OR** completes at least one mission (the fixed
"minimum daily requirement"; a per-student configurable threshold is still deferred). The streak
is computed on read (ADR 0006).

The XP-related database columns/tables (`students.current_xp/current_level`, `tasks.xp_value`,
`daily_missions.xp_awarded`, `coding_features.xp_awarded`, the `rewards` table, the `xp_events`
ledger, and the `level_for_xp`/`adjust_student_xp` functions) are left **dormant** — present but
unused — rather than dropped, since one Supabase instance backs both dev and production.

*Original (now removed):* XP examples (math task 10, 5 hard math problems 15, mistake correction
10, coding task 15, coding feature 20, Chinese reading 10, English writing 10, reflection 5, bonus
physics/SAT 5); Levels L1 0 → L6 1200; Rewards (weekly badge, parent-approved reward, movie/game
time, special activity, project showcase).

### 10.13 Personalized Learning Plan Module
MVP includes the data structure even if plans are manually created first. A plan can be parent-created, AI-generated later, parent-approved, active, completed, archived. Each plan: student, week start date, source homework submissions, summary, priority subjects, priority topics, recommended tasks, parent notes, student notes, status.

### 10.14 AI Analysis Readiness
MVP does not need full AI analysis, but backend must be designed for it. Separate AI analysis result model. Each result: homework submission, student, analysis type (mistake detection / topic classification / skill gap / personalized plan / progress summary / writing feedback / coding feedback), model name, input snapshot, output summary, detected topics, detected strengths, detected weaknesses, mistake patterns, suggested tasks, confidence score, created date.

### 10.15 Subject Rubrics
Future AI analysis should be subject-aware. Each rubric: subject, rubric name, grade level, criteria, description.

### 10.16 Scheduling & Calendar
Each subject and each track can be placed on a **per-student dated calendar** with
specific dates and times (e.g. Geometry Mon 9:00, AoPS Mon 10:30, Calculus Tue 9:00).

- A **ScheduleBlock** represents a planned study session: student, subject, optional
  track, optional linked task, title, start/end datetime (or all-day), optional
  recurrence rule, optional target finish time (estimated minutes), location/notes, status.
- **Today's Missions are derived on demand** from the schedule blocks that fall on the
  current date — no cron job. Recurrence is expanded at read time. Completing a
  scheduled block can create/complete the corresponding DailyMission and award XP.
- Views: per-student day/week calendar; parent can see and edit all students'
  schedules; tracks are color-coded.
- **Free-tier safety:** schedule data lives in Postgres; recurrence is expanded on
  read; no background jobs, no high-frequency cron. (This supersedes the prior
  "complex calendar scheduling" non-goal for the single-parent, dated-calendar case —
  see ADR 0006. Still out of scope: multi-resource/room scheduling and automatic
  timetable optimization.)

### 10.17 AI-Native Admin (Agent Gateway)
LockIn is **administrable by AI agents, not only through the web UI.** A parent (or an
agent acting for the parent) can manage the site conversationally — including via
Slack and voice.

- **Single command surface:** every admin capability — create/edit students, subjects,
  tracks; create/assign tasks; build and edit schedule blocks; set weekly goals;
  review homework; adjust XP/rewards; create/approve plans — is exposed as a **typed,
  validated Admin Command API** used by *both* the web UI and agents. There is one
  source of truth, not a separate "AI path."
- **Agent gateway contract (MVP):** these commands are also published as an
  **agent-callable interface** (MCP tools and/or authenticated webhook endpoints) so an
  external agent (e.g. a Hermes-style agent) can operate LockIn. The contract and its
  auth are built in the MVP.
- **Channels (external, deferred):** Slack (text) and **voice** (speech-to-text) are
  front-ends that translate natural language into Admin Commands through the gateway.
  These connectors are post-MVP external modules (ADR 0007) so MVP stays Vercel-Hobby
  friendly; heavy NLU/STT runs in the external connector/service, never on Vercel.
- **Security:** agent access uses scoped service credentials; every command is
  authenticated, authorized to the parent's own data (same RLS/ownership as the UI),
  validated, rate-limited, and recorded in an **AdminCommandLog** audit trail. Voice
  and Slack inputs are treated as untrusted and validated like any other input.

---

## 11. Backend Requirements

### 11.1 Backend Responsibilities
Authentication; parent/student roles; multi-student data ownership; configurable subjects; **subject tracks (sub-subjects) and per-student track activation**; task storage; task assignment; daily mission storage; weekly goal storage; **schedule-block (calendar) storage and on-read mission derivation**; homework submission storage; file/image upload storage (future-ready); mistake/revision bank storage; coding project storage; reflection storage; XP and level calculations; streak calculations; personalized plan storage; AI analysis result storage; **a typed Admin Command API shared by the UI and agents, plus the authenticated agent gateway and AdminCommandLog audit trail**; row-level security or equivalent access control.

### 11.2 Data Privacy
Private by default; student data not publicly visible; homework requires authentication; parent only sees their own students; students only see their own data if student login is implemented; uploaded files not public by default; designed for future data export and deletion.

### 11.3 File Upload Support
Backend should support uploads later (images, PDFs, text files, code files). For MVP, file upload can be stubbed or simple. Future: homework photo upload, PDF worksheet upload, code file upload, AI OCR processing, AI review pipeline.

---

## 12. Data Model

Core tables/objects (field lists below are authoritative for the MVP schema):

1. **User** — id, email, display_name, role, created_at, updated_at
2. **ParentStudentRelationship** — id, parent_user_id, student_id, relationship_type, created_at
3. **Student** — id, name, grade, avatar, current_xp, current_level, current_streak, created_at, updated_at
4. **LearningProfile** — id, student_id, preferred_daily_minutes, preferred_schedule_style, motivation_style, weekly_goal_style, notes, created_at, updated_at  *(preferences only; subject/track membership lives in StudentSubject / StudentSubjectTrack — see reconciliation note below)*
5. **Subject** — id, name, description, icon, color, is_default, created_at, updated_at
6. **StudentSubject** — id, student_id, subject_id, priority_type (primary/bonus/inactive), created_at, updated_at
7. **Task** — id, title, description, subject_id, task_type, difficulty, xp_value, estimated_minutes, repeatable, optional_link, created_by, created_at, updated_at
8. **TaskAssignment** — id, task_id, student_id, assigned_by, assigned_date, due_date, status, created_at, updated_at
9. **DailyMission** — id, student_id, task_id (nullable), subject_id, subject_track_id (nullable), schedule_block_id (nullable), date, status (not_started/in_progress/completed/deferred/skipped), completed_at, deferred_to (nullable), notes, parent_feedback, student_reflection, created_at, updated_at  *(unique on student_id + date + schedule_block_id to prevent duplicate lazy generation; null schedule_block_id = ad-hoc mission. A `deferred` row is a "moved to {deferred_to}" tombstone; `skipped` = explicitly not done — see §10.5)*
10. **WeeklyGoal** — id, student_id, week_start_date, title, subject_id, target_value, current_value, unit, due_date, status, created_at, updated_at
11. **HomeworkSubmission** — id, student_id, subject_id, topic, assignment_title, submission_date, raw_text, file_url, image_url, source_type, student_notes, parent_notes, review_status, ai_analysis_status, ai_summary, detected_skills, detected_mistakes, recommended_next_steps, created_at, updated_at
12. **MistakeBankEntry** — id, student_id, subject_id, homework_submission_id, title, topic, mistake_description, correct_idea, mistake_type, retry_date, status, created_at, updated_at
13. **CodingProject** — id, student_id, project_name, description, goal, status, demo_link, github_link, created_at, updated_at
14. **CodingFeature** — id, project_id, title, description, status, created_at, updated_at
15. **Reflection** — id, student_id, date, what_finished, what_was_hard, what_learned, what_to_do_next, parent_comment, created_at, updated_at
16. **Reward** — id, student_id, title, description, required_xp, unlocked, unlocked_at, created_at, updated_at — *Retired from the MVP surface 2026-06-25 (ADR 0010): the `rewards` table is left dormant (no UI, no commands).*
17. **PersonalizedLearningPlan** — id, student_id, week_start_date, generated_from_homework_ids, summary, priority_subjects, priority_topics, recommended_tasks, parent_notes, student_notes, status, created_at, updated_at
18. **AIAnalysisResult** — id, homework_submission_id, student_id, analysis_type, model_name, input_snapshot, output_summary, detected_topics, detected_strengths, detected_weaknesses, mistake_patterns, suggested_tasks, confidence_score, created_at
19. **SubjectRubric** — id, subject_id, rubric_name, criteria, grade_level, description, created_at, updated_at
20. **SubjectTrack** — id, subject_id, name, description, icon, color, sort_order, is_default, is_active, created_at, updated_at
21. **StudentSubjectTrack** — id, student_id, subject_track_id, priority_type (primary/bonus/inactive), created_at, updated_at
22. **ScheduleBlock** — id, student_id, subject_id, subject_track_id (nullable), task_id (nullable), title, start_at, end_at, all_day, recurrence_rule (nullable), estimated_minutes (nullable), location, notes, status, created_at, updated_at
23. **AdminCommandLog** — id, actor_type (parent_ui/agent), actor_id, channel (ui/slack/voice/api), command_name, input_payload, result_status, result_summary, created_at

> **Track attribution:** `Task`, `TaskAssignment`, `DailyMission`, `WeeklyGoal`,
> `HomeworkSubmission`, and `MistakeBankEntry` each gain an optional
> `subject_track_id` so work, goals, and analysis can be attributed to a specific
> track (e.g. Geometry vs. Calculus) when one applies.
>
> **Reconciliation defaults (applied 2026-06-14 — confirm):**
> 1. **Subject/track membership has one source of truth:** `StudentSubject`
>    (+ `StudentSubjectTrack`). `LearningProfile` holds preferences only; the old
>    `primary_subjects`/`bonus_subjects` arrays were removed to avoid drift.
> 2. **`ScheduleBlock` is the plan; `DailyMission` is derived on read.** A mission row
>    is created lazily the first time a student opens/acts on that day, linked via
>    `schedule_block_id`; `task_id` is nullable (a block may have no task), and ad-hoc
>    missions use a null `schedule_block_id`. No cron.
>
> These defaults can be overridden; they are also tracked in
> `docs/human/decisions.md` → "Open decisions."

---

## 13. MVP Pages

1. Login page
2. Parent dashboard
3. Student dashboard
4. Student switcher
5. Today's Missions
6. Weekly Quest Board
7. Task Bank
8. Homework Inbox
9. Mistake / Revision Bank
10. Coding Project Tracker
11. Reflection Page
12. ~~Rewards / XP Page~~ — *Retired from the MVP surface 2026-06-25 (ADR 0010).*
13. Basic settings page
14. Schedule / Calendar page (per-student, track-aware, dated)
15. Admin & Agent settings page (manage agent service credentials, view AdminCommandLog audit trail)

---

## 14. UX and Design Requirements

Feel: modern, focused, motivational, clean, fast, not too childish, suitable for middle school students.
Design ideas: dark mode / focus-mode inspired design, mission cards, progress bars, badges, simple icons, clear subject colors, student switcher in top navigation, parent dashboard with compact student cards.
Main UX goal: *The student opens the site and immediately knows what to do today.*

---

## 15. Seed Data

Seed: 1 parent user, 2 student profiles, default subjects, default task types, initial task bank, example daily missions, example weekly goals, example rewards, example coding project for Student A, example Chinese/math/writing goals for Student B.

**Student A:** Math (primary), Coding (primary), Physics (bonus), SAT (bonus), Chemistry (bonus), Reflection (active). Math tracks: HMA, AoPS, Geometry, Calculus. Missions: solve 5 AMC geometry problems (Geometry track); add one feature to Python project; review Newton's Laws; write what I learned today. Chemistry seed task: e.g. "Balance 5 chemical equations." Example schedule blocks: Geometry Mon/Wed 9:00, AoPS Mon 10:30, Calculus Tue/Thu 9:00, Coding daily 16:00.

**Student B:** Chinese (primary), Math (primary), English Writing (primary), Reading (bonus/active), Reflection (active). Missions: read one Chinese passage and write a summary; solve 10 math problems; write and revise one paragraph; write what was hard today.

---

## 16. MVP Acceptance Criteria

1. Parent can log in.
2. Parent can view at least 2 student profiles.
3. Parent can switch between students.
4. Each student has separate active subjects.
5. Student A can focus on Math, Coding, Physics, SAT, and Chemistry.
6. Student B can focus on Chinese, Math, and English Writing.
7. Parent can create tasks.
8. Parent can assign tasks to one or more students.
9. Each student can view today's missions.
10. Each student can mark missions as completed.
11. Completing a mission marks it done and counts toward the streak (and can be undone). *(Amended 2026-06-25, ADR 0010 — was "Completing missions adds XP.")*
12. Dashboard (Today) shows today's completion % and the streak; Manage shows weekly progress. *(Amended 2026-06-25, ADR 0010 — was "Dashboard shows XP, level, streak, and weekly progress.")*
13. Parent can create weekly goals.
14. Students can submit raw homework text.
15. Homework submissions are stored per student.
16. Parent can review homework submissions.
17. Parent or student can create mistake/revision entries.
18. Mistake entries can link back to homework submissions.
19. Student A can track coding projects.
20. Students can write daily reflections.
21. Backend data is stored in Supabase.
22. Data is separated by parent/student ownership.
23. App can be deployed to Vercel.
24. The MVP can be deployed on Vercel Hobby/free tier.
25. The MVP does not require Vercel Pro features.
26. The MVP does not require long-running Vercel Functions.
27. The MVP does not require high-frequency cron jobs.
28. The MVP stores persistent data in Supabase, not in Vercel runtime.
29. The MVP stores homework as text first, with file upload designed as optional/future.
30. The MVP includes AI-ready data structures but does not run heavy AI processing.
31. The app remains suitable for private family-scale usage with 2 students.
32. The architecture can upgrade later without rewriting the whole app.
33. Subjects can have tracks (sub-subjects); Math includes HMA, AoPS, Geometry, and Calculus.
34. Chemistry exists as a subject with at least one seed task.
35. Each subject/track can be placed on a per-student dated calendar with times.
36. Today's Missions are derived from the schedule for the current date with no cron job.
37. Every admin action is available through one typed Admin Command API used by both the UI and agents.
38. An authenticated agent-gateway contract (MCP/webhook) is defined and scoped to the parent's own data.
39. Every admin/agent command is recorded in an audit log (AdminCommandLog).
40. Slack and voice connectors are NOT required for the MVP, but the command surface supports adding them without a rewrite.

---

## 17. Phase 1 Build Priority

1. Project setup
2. Authentication
3. Database schema
4. Parent/student data model
5. Student switcher
6. Dashboard layout
7. Subject configuration (incl. subject tracks / sub-subjects)
8. Task bank
9. Schedule blocks (calendar) + on-read mission derivation
10. Daily missions
11. XP and level logic
12. Weekly goals
13. Homework inbox
14. Mistake/revision bank
15. Reflection page
16. Coding project tracker
17. Parent dashboard
18. Rewards
19. Admin Command API + agent gateway + audit log
20. UI polish
21. Vercel deployment

---

## 18. Future Features

AI homework analysis; AI mistake detection; AI writing feedback; AI Chinese reading/writing feedback; AI coding feedback; AI-generated personalized weekly plan; parent approval workflow for AI plans; live Slack admin bot; voice (speech-to-text) admin control; external calendar sync (Google/Apple); focus timer; email reminders; mobile-first experience; weekly printable report; progress charts; file upload; photo upload; OCR for handwritten work; GitHub integration; sibling leaderboard (optional); export data; delete student data.

> Note: a per-student dated calendar is in the MVP (§10.16); only *external calendar
> sync* and advanced scheduling remain future work. The Admin Command API + agent
> gateway are in the MVP (§10.17); only the *live Slack bot and voice control* are
> future work.

---

## 19. Non-Goals for MVP

Full AI analysis pipeline; OCR for handwritten homework; large file upload system; public social sharing; payment/subscription features; multi-family commercial SaaS setup; advanced team management; high-frequency reminders; long-running background workers; real-time collaborative editing; native mobile app.

**Calendar scope (revised in v0.2):** a per-student dated calendar with times *is* in
scope (§10.16). Still out of scope for MVP: multi-resource/room scheduling, automatic
timetable optimization, and external calendar sync (Google/Apple).

**AI-native admin scope:** the typed Admin Command API and the agent-gateway contract
are in scope. Out of scope for MVP (built later as external modules): the live Slack
bot, voice/speech-to-text control, and any paid NLU/STT service.

---

## 20. References for Deployment Assumptions

Check again before production deployment (platform limits and pricing change):

- Vercel Hobby Plan: https://vercel.com/docs/plans/hobby
- Vercel Pricing: https://vercel.com/pricing
- Vercel Cron Jobs Usage and Pricing: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel Account Plans: https://vercel.com/docs/plans
