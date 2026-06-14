# LockIn — Architecture Draft

**Status:** DRAFT (in `docs/ai-drafts/`, pre-approval). Not authoritative until promoted
to `docs/specs/`. Derived from `docs/specs/approved-prd.md` v0.2 and ADRs 0001–0007.

This document proposes the concrete shape of the system: repository layout, database
schema, row-level security, the shared command layer (used by both UI and agents), the
agent gateway, and the page→component map.

> **Items marked “➕ addition beyond PRD §12”** are schema/architecture proposals not in
> the approved data model. They need human review before promotion. Nothing here changes
> the PRD until approved.

---

## 1. Guiding principles (from PRD + ADRs)

- One web app on **Vercel Hobby**; **Supabase** owns DB/Auth/Storage. Persistent data
  never lives in the Vercel runtime.
- **No cron, no background workers, no AI on Vercel.** Progress and Today's Missions are
  computed **on read**.
- **One command surface:** every mutation goes through a typed command handler in
  `packages/shared`. The UI (server actions) and the agent gateway both call the *same*
  handlers — never a separate “AI path” (ADR 0007).
- **Parent-only auth** now; schema scoped by `student_id` so per-student logins are an
  additive RLS change later (ADR 0004).
- Generic **subject tracks** (ADR 0005); **dated calendar** with on-read mission
  derivation (ADR 0006).

---

## 2. Repository layout

```
lockin/
  apps/
    web/
      app/                      # Next.js App Router
        (auth)/login/
        (app)/
          dashboard/            # parent dashboard
          students/[id]/        # student-scoped views
            today/              # Today's Missions
            quests/             # Weekly Quest Board
            tasks/              # Task Bank
            homework/
            mistakes/
            coding/
            reflections/
            rewards/
            schedule/           # calendar
          settings/
            agents/             # agent credentials + audit log
        api/
          agent/route.ts        # agent gateway (webhook) — Stage 8
      components/
      lib/
        supabase/               # server + browser clients   (CODEOWNERS: none, but see auth/)
        auth/                   # session helpers            (CODEOWNERS-protected)
        storage/                # Supabase Storage helpers   (CODEOWNERS-protected)
        commands/               # command dispatcher (calls packages/shared handlers)
        missions/               # on-read mission derivation
      db/                       # SQL migrations + RLS        (CODEOWNERS-protected)
        migrations/
        seed.sql
      tests/
  packages/
    shared/
      types/                    # DB types (generated) + domain types
      validation/               # zod schemas
      commands/                 # typed Admin Command definitions + handlers
```

This matches the `CODEOWNERS` paths already committed (`apps/web/db/`,
`apps/web/lib/auth/`, `apps/web/lib/storage/`).

---

## 3. Data model → Postgres schema

Conventions: `uuid` PKs (`default gen_random_uuid()`); `timestamptz` for
`created_at`/`updated_at`; an `updated_at` trigger; status/enum fields as `text` + a
`CHECK` constraint (simple to evolve vs Postgres enums). All names `snake_case`.

### 3.1 Identity & ownership

```sql
-- ➕ addition beyond PRD §12: app-level mirror of auth.users.
-- The parent IS a Supabase auth user; this row carries app role + display name.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'parent' check (role in ('parent','student')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table students (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  grade           text,
  avatar          text,
  current_xp      integer not null default 0,   -- cached aggregate (see §3.6)
  current_level   integer not null default 1,   -- cached aggregate
  current_streak  integer not null default 0,   -- cached aggregate
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Many-to-many parent↔student (PRD §12.2). MVP uses one parent, but this keeps
-- multiple guardians / future student-users additive.
create table parent_student_relationships (
  id                uuid primary key default gen_random_uuid(),
  parent_user_id    uuid not null references profiles(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  relationship_type text not null default 'parent',
  created_at        timestamptz not null default now(),
  unique (parent_user_id, student_id)
);

create table learning_profiles (
  id                        uuid primary key default gen_random_uuid(),
  student_id                uuid not null references students(id) on delete cascade,
  preferred_daily_minutes   integer,
  preferred_schedule_style  text,
  motivation_style          text,
  weekly_goal_style         text,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (student_id)
);
-- NOTE: per the v0.2 reconciliation default, subject/track membership is NOT stored
-- here; it lives in student_subjects / student_subject_tracks (single source of truth).
```

### 3.2 Subjects & tracks (ADR 0005)

```sql
create table subjects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  icon            text,
  color           text,
  is_default      boolean not null default false,
  owner_parent_id uuid references profiles(id) on delete cascade,  -- ➕ null = global default
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table subject_tracks (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid not null references subjects(id) on delete cascade,
  name            text not null,
  description     text,
  icon            text,
  color           text,
  sort_order      integer not null default 0,
  is_default      boolean not null default false,
  is_active       boolean not null default true,
  owner_parent_id uuid references profiles(id) on delete cascade,  -- ➕ null = global default
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table student_subjects (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  subject_id    uuid not null references subjects(id) on delete cascade,
  priority_type text not null check (priority_type in ('primary','bonus','inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (student_id, subject_id)
);

create table student_subject_tracks (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  subject_track_id uuid not null references subject_tracks(id) on delete cascade,
  priority_type    text not null check (priority_type in ('primary','bonus','inactive')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (student_id, subject_track_id)
);
```

### 3.3 Tasks, assignments, schedule, missions

```sql
create table tasks (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  subject_id       uuid references subjects(id) on delete set null,
  subject_track_id uuid references subject_tracks(id) on delete set null,  -- optional (PRD note)
  task_type        text,
  difficulty       text,
  xp_value         integer not null default 0,
  estimated_minutes integer,
  repeatable       boolean not null default false,
  optional_link    text,
  tags             text[],
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table task_assignments (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid not null references tasks(id) on delete cascade,
  student_id       uuid not null references students(id) on delete cascade,
  subject_track_id uuid references subject_tracks(id) on delete set null,
  assigned_by      uuid references profiles(id) on delete set null,
  assigned_date    date,
  due_date         date,
  status           text not null default 'assigned',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Calendar plan (ADR 0006). Source of truth for scheduled study.
create table schedule_blocks (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  subject_id       uuid references subjects(id) on delete set null,
  subject_track_id uuid references subject_tracks(id) on delete set null,
  task_id          uuid references tasks(id) on delete set null,
  title            text not null,
  start_at         timestamptz,
  end_at           timestamptz,
  all_day          boolean not null default false,
  recurrence_rule  text,                -- iCal RRULE; expanded at read time
  location         text,
  notes            text,
  status           text not null default 'planned',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Derived-on-read (ADR 0006): a row is created lazily the first time the day is
-- opened/acted on. task_id + schedule_block_id nullable; ad-hoc missions have both null.
create table daily_missions (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references students(id) on delete cascade,
  task_id           uuid references tasks(id) on delete set null,
  subject_id        uuid references subjects(id) on delete set null,
  subject_track_id  uuid references subject_tracks(id) on delete set null,
  schedule_block_id uuid references schedule_blocks(id) on delete set null,
  date              date not null,
  status            text not null default 'not_started'
                      check (status in ('not_started','in_progress','completed')),
  xp_awarded        integer not null default 0,   -- ➕ snapshot to prevent double-count
  completed_at      timestamptz,
  notes             text,
  parent_feedback   text,
  student_reflection text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- prevents duplicate lazy generation of the same scheduled block on the same day:
  unique (student_id, date, schedule_block_id)
);
```

> **On the uniqueness constraint:** Postgres treats `NULL`s as distinct, so multiple
> ad-hoc missions (`schedule_block_id IS NULL`) on the same day are allowed, while a
> given scheduled block can only generate one mission per day. 👍

### 3.4 Goals, homework, mistakes, coding, reflections, rewards, plans

```sql
create table weekly_goals (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  subject_id       uuid references subjects(id) on delete set null,
  subject_track_id uuid references subject_tracks(id) on delete set null,
  week_start_date  date not null,
  title            text not null,
  target_value     numeric,
  current_value    numeric not null default 0,
  unit             text,
  due_date         date,
  status           text not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table homework_submissions (
  id                     uuid primary key default gen_random_uuid(),
  student_id             uuid not null references students(id) on delete cascade,
  subject_id             uuid references subjects(id) on delete set null,
  subject_track_id       uuid references subject_tracks(id) on delete set null,
  topic                  text,
  assignment_title       text,
  submission_date        date not null default current_date,
  raw_text               text,
  file_url               text,    -- future (ADR 0003)
  image_url              text,    -- future
  source_type            text not null default 'typed_text'
                           check (source_type in ('typed_text','photo','pdf','code','link')),
  student_notes          text,
  parent_notes           text,
  review_status          text not null default 'submitted'
                           check (review_status in ('submitted','reviewed','needs_correction','mastered')),
  ai_analysis_status     text not null default 'not_started'
                           check (ai_analysis_status in ('not_started','queued','completed','failed')),
  ai_summary             text,
  detected_skills        text[],
  detected_mistakes      text[],
  recommended_next_steps text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table mistake_bank_entries (
  id                     uuid primary key default gen_random_uuid(),
  student_id             uuid not null references students(id) on delete cascade,
  subject_id             uuid references subjects(id) on delete set null,
  subject_track_id       uuid references subject_tracks(id) on delete set null,
  homework_submission_id uuid references homework_submissions(id) on delete set null,
  title                  text,
  topic                  text,
  mistake_description    text,
  correct_idea           text,
  mistake_type           text,
  retry_date             date,
  status                 text not null default 'needs_review'
                           check (status in ('needs_review','reviewed','mastered')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table coding_projects (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  project_name text not null,
  description  text,
  goal         text,
  status       text not null default 'active',
  demo_link    text,
  github_link  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table coding_features (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references coding_projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'not_started'
                check (status in ('not_started','in_progress','completed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table reflections (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  date             date not null default current_date,
  what_finished    text,
  what_was_hard    text,
  what_learned     text,
  what_to_do_next  text,
  parent_comment   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table rewards (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  title        text not null,
  description  text,
  required_xp  integer,
  unlocked     boolean not null default false,
  unlocked_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table personalized_learning_plans (
  id                          uuid primary key default gen_random_uuid(),
  student_id                  uuid not null references students(id) on delete cascade,
  week_start_date             date,
  generated_from_homework_ids uuid[],
  summary                     text,
  priority_subjects           text[],
  priority_topics             text[],
  recommended_tasks           jsonb,
  parent_notes                text,
  student_notes               text,
  status                      text not null default 'draft',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
```

### 3.5 AI-readiness & rubrics (stored, not populated in MVP)

```sql
create table ai_analysis_results (
  id                     uuid primary key default gen_random_uuid(),
  homework_submission_id uuid references homework_submissions(id) on delete cascade,
  student_id             uuid not null references students(id) on delete cascade,
  analysis_type          text,
  model_name             text,
  input_snapshot         jsonb,
  output_summary         text,
  detected_topics        text[],
  detected_strengths     text[],
  detected_weaknesses    text[],
  mistake_patterns       text[],
  suggested_tasks        jsonb,
  confidence_score       numeric,
  created_at             timestamptz not null default now()
);

create table subject_rubrics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  rubric_name text not null,
  criteria    jsonb,
  grade_level text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### 3.6 XP ledger (➕ addition beyond PRD §12 — proposed)

PRD stores `current_xp/level/streak` on `students`. To compute **XP earned today**,
**weekly XP**, and **streaks** correctly on read (no cron) without double-counting, a
small append-only ledger is cleaner than recomputing from scattered tables:

```sql
create table xp_events (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  source_type text not null,     -- 'mission' | 'mistake_correction' | 'coding_feature' | 'manual' ...
  source_id   uuid,
  amount      integer not null,
  created_at  timestamptz not null default now()
);
```

`students.current_xp/level/streak` become **cached aggregates** updated by the command
handlers (single source: §4). Level thresholds (L1 0, L2 100, L3 250, L4 500, L5 800,
L6 1200) live in `packages/shared`. Streak = derived from days with a qualifying
`daily_missions`/`reflections` row, evaluated on read. **Flag for review.**

### 3.7 Agent credentials (➕ addition beyond PRD §12 — Stage 8)

```sql
create table agent_credentials (
  id              uuid primary key default gen_random_uuid(),
  parent_user_id  uuid not null references profiles(id) on delete cascade,
  label           text not null,
  token_hash      text not null,           -- store a hash, never the raw token
  scopes          text[] not null default '{}',
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table admin_command_log (
  id             uuid primary key default gen_random_uuid(),
  parent_user_id uuid references profiles(id) on delete set null,
  actor_type     text not null check (actor_type in ('parent_ui','agent')),
  actor_id       uuid,                       -- profile id or agent_credential id
  channel        text not null check (channel in ('ui','slack','voice','api')),
  command_name   text not null,
  input_payload  jsonb,
  result_status  text not null,             -- 'ok' | 'error'
  result_summary text,
  created_at     timestamptz not null default now()
);
```

---

## 4. The command layer (one surface for UI + agents — ADR 0007)

Every mutation is a **typed command**, defined once in `packages/shared/commands`:

```ts
// packages/shared/commands/registry.ts (sketch)
export const commands = {
  'student.create':        { input: StudentCreate,        handler: createStudent },
  'task.create':           { input: TaskCreate,           handler: createTask },
  'task.assign':           { input: TaskAssign,           handler: assignTask },
  'mission.complete':      { input: MissionComplete,      handler: completeMission },
  'schedule.block.create': { input: ScheduleBlockCreate,  handler: createScheduleBlock },
  'weeklyGoal.create':     { input: WeeklyGoalCreate,     handler: createWeeklyGoal },
  'homework.review':       { input: HomeworkReview,       handler: reviewHomework },
  'xp.adjust':             { input: XpAdjust,             handler: adjustXp },
  // ...one entry per admin capability in PRD §10.17
} as const
```

- **Inputs** are zod schemas (validation shared by UI and gateway).
- **Handlers** run inside a transaction, enforce parent ownership, write the row(s),
  update XP aggregates, and append to `admin_command_log`.
- **UI path:** server actions call `dispatch('task.assign', input, { actor: parentUi })`.
- **Agent path (Stage 8):** `app/api/agent/route.ts` authenticates a bearer token
  against `agent_credentials`, then calls the *same* `dispatch(...)` with
  `{ actor: agent }`. MCP, if added, is a thin adapter over the same registry.
- This means the “AI-native admin” is mostly free once the command layer exists — the
  gateway is just another caller. We therefore **build the command layer from Stage 1**
  and add the external gateway endpoint in Stage 8.

---

## 5. Row-Level Security strategy

Enable RLS on every table. A helper centralizes the ownership check:

```sql
create or replace function owns_student(s uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from parent_student_relationships r
    where r.student_id = s and r.parent_user_id = auth.uid()
  );
$$;
```

- **Student-scoped tables** (most of them): `using (owns_student(student_id))` for
  select/insert/update/delete.
- **Child-of-child tables** (`coding_features`): check via the parent row —
  `using (exists (select 1 from coding_projects p where p.id = project_id and owns_student(p.student_id)))`.
- **Subjects / subject_tracks:** readable if `is_default` OR `owner_parent_id = auth.uid()`;
  writable only by the owner.
- **profiles:** `id = auth.uid()`.
- **agent_credentials / admin_command_log:** `parent_user_id = auth.uid()`.
- **Forward-compat (ADR 0004):** when student logins arrive, extend `owns_student` (or
  add a parallel `is_self(student_id)` clause) — tables don't change.
- **Agent gateway:** runs server-side. It must execute commands **as the parent**
  (e.g. a Supabase client carrying the parent's identity / a scoped service role that
  re-applies `owns_student`), never with an unrestricted service key. Detailed in the
  Stage 8 plan + a security review.

---

## 6. Reads & on-read mission derivation

- **Server Components** read via the Supabase server client; lists are paginated
  (homework, reflections, mistakes) per PRD §7.7.
- `lib/missions/getTodaysMissions(studentId, date)`:
  1. read `schedule_blocks` for the student overlapping `date` (expand `recurrence_rule`
     within the day window only — bounded work);
  2. `upsert` a `daily_missions` row per block via the unique key (idempotent);
  3. return the day's missions (scheduled + ad-hoc) joined with task/subject/track.
- No cron: derivation happens the first time the day is viewed or a command touches it.

---

## 7. Page → component map (MVP, PRD §13)

| Route | Page | Key components |
|---|---|---|
| `/login` | Login | `AuthForm` |
| `/dashboard` | Parent dashboard | `StudentCard` (×N), `ReviewQueueBadge` |
| `/students/[id]/today` | Today's Missions | `MissionCard`, `XpBar`, `StreakChip`, `QuickActions` |
| `/students/[id]/quests` | Weekly Quest Board | `GoalCard`, `ProgressBar` |
| `/students/[id]/tasks` | Task Bank | `TaskRow`, `TaskForm`, `AssignDialog` |
| `/students/[id]/schedule` | Calendar | `WeekGrid`, `ScheduleBlockForm` (track-colored) |
| `/students/[id]/homework` | Homework Inbox | `SubmissionList` (paginated), `SubmissionForm`, `ReviewPanel` |
| `/students/[id]/mistakes` | Mistake/Revision Bank | `MistakeEntryForm`, `MistakeList` |
| `/students/[id]/coding` | Coding Tracker | `ProjectCard`, `FeatureChecklist` |
| `/students/[id]/reflections` | Reflections | `ReflectionForm`, `ReflectionList` |
| `/students/[id]/rewards` | Rewards / XP | `LevelMeter`, `RewardCard` |
| `/settings` | Settings | subject/track config, student CRUD |
| `/settings/agents` | Admin & Agent | `AgentCredentialList`, `AuditLogTable` |

Global: `TopNav` with the `StudentSwitcher` (PRD §10.2); dark/focus-mode theme (§14).

---

## 8. Environment & deployment

- Env vars (Vercel + `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only),
  `AGENT_GATEWAY_SIGNING_SECRET` (Stage 8).
- Migrations in `apps/web/db/migrations` applied via the Supabase CLI; `seed.sql` loads
  default subjects, the Math tracks, Chemistry, two students, and example data (PRD §15).
- CI (`.github/workflows/ci.yml`) runs lint/typecheck/test once `apps/web` exists.

---

## 9. Open items for human review

1. **XP ledger (`xp_events`)** vs. recomputing from source tables (§3.6).
2. **`profiles` mirror table** vs. using `auth.users` directly.
3. **`owner_parent_id` on subjects/tracks** for custom (non-default) subjects.
4. Confirm the two v0.2 reconciliation defaults (membership source of truth; missions
   model) — see PRD §12 and `decisions.md`.
5. **Agent gateway transport** — webhook only for MVP, MCP later, or both (ADR 0007).
6. **“HMA”** label confirmation (PRD §4.1).
