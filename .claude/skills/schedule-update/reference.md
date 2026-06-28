# Schedule-update reference

Connection coordinates, schema facts, SQL templates, and current IDs for the
LockIn Supabase database. Run everything through `connect.sh` (see SKILL.md).

> **UUIDs differ per database.** The IDs below are the current LockIn production
> values. In any other environment, run the *Discovery queries* first and use
> those IDs instead.

## Connection coordinates (non-secret)

| Field | Value |
|---|---|
| Host (session pooler) | `aws-1-us-west-2.pooler.supabase.com` |
| Port | `5432` |
| User | `postgres.hwrnevicgtnbexnsxitm` |
| Database | `postgres` |
| SSL | `sslmode=require` |
| Supabase project ref | `hwrnevicgtnbexnsxitm` (region `us-west-2`) |

Password: **not here** — from `SUPABASE_DB_PASSWORD` / `LOCKIN_DATABASE_URL` /
`credentials.env` / `apps/web/.env.local`.

## Discovery queries (run these in a new environment)

```sql
-- Students (and which parent owns them)
select s.id, s.name, s.grade, r.parent_user_id
from students s
join parent_student_relationships r on r.student_id = s.id
order by s.created_at;

-- Subjects
select id, name, is_default from subjects order by name;

-- Tracks (sub-subjects)
select t.id, t.name, s.name as subject
from subject_tracks t join subjects s on s.id = t.subject_id
order by s.name, t.name;
```

`created_by` / `assigned_by` on tasks and assignments = the **parent_user_id**.

## Current IDs (LockIn prod — verify per env)

**Parent** (`created_by` / `assigned_by`): `9109e39c-2427-47e5-a85d-f58bcf46ed74`

**Students**

| Name | ID | Notes |
|---|---|---|
| Hengsheng Wang | `91145fe0-2ab9-4016-b3d3-6cb005451986` | older; competition math (Grade 9) |
| Hengsheen Wang | `d9f92f22-f522-4590-94e4-2e51a0b44b70` | younger |

**Subjects**

| Subject | ID |
|---|---|
| Math | `fec7a1fc-ae4c-4335-9735-820d64d4ecb0` |
| Physics | `8656d278-8d06-445c-a8aa-bfde87a2e7f4` |
| Coding | `7e2524f7-f00d-4610-9a09-4e8af8c13262` |
| Reading | `5d52099d-f09a-4a69-a227-ab9db97d2c73` |
| Chinese | `d36a0f73-6982-47d0-8fbf-c41925628cea` |
| Swim | `46e78b86-f60d-4d0a-b878-1358eab4cbba` |
| English Writing | `68f42964-89ea-457d-80f0-7e285af70c10` |
| Chemistry | `2d362eab-90e6-41d9-846e-d948d6f26ab8` |
| SAT | `65b0a9ad-c65b-416e-856b-4699c1c25f82` |
| Reflection | `a7d8ea15-6c2f-4bae-af13-4e4f67a64bba` |

**Math tracks** (sub-subjects; `subject_track_id`)

| Track | ID |
|---|---|
| AMC 10 | `8e5570e4-200e-45cd-8cf3-dacef9cf2500` |
| AoPS | `91d5bc92-1a7f-4144-b353-f50d57508f85` |
| Calculus | `2f2a71ba-fdf4-4411-8ef2-b69b3932f6dd` |
| Geometry | `0254ea4a-4006-474a-b41f-51a5a9dd96d2` |
| HMA | `208c5711-a9a8-407a-8344-fa3d13403c94` |
| Math Dash | `91561c20-13f2-49be-b23d-07016c0cdbaa` |
| Number Theory | `31ded5f5-a2fe-4c9b-b99a-ea01cc203957` |
| Think Academy | `637a961e-ae74-4883-81f2-d5f48fc26db2` |

## Schema facts that matter

- A **task** (`tasks`) is parent-owned work; it becomes a student's when
  **assigned** (`task_assignments`), which also materializes a **mission**
  (`daily_missions`) for a date. The Today page shows missions for a date plus
  schedule-block occurrences.
- **`daily_missions` FKs**: `task_id` and `schedule_block_id` are
  **ON DELETE SET NULL** (deleting a task/block keeps the mission as history);
  `task_assignments.task_id` is **ON DELETE CASCADE**.
- **`schedule_blocks`** has no `created_by`; RLS is via `owns_student(student_id)`.
  Columns: `student_id, subject_id, subject_track_id, task_id, title, start_at,
  end_at, all_day, recurrence_rule, location, notes, status (default 'planned'),
  estimated_minutes`.
- **Time convention**: the app stores wall-clock time **as UTC** ("floating").
  Write `start_at`/`end_at` as `'YYYY-MM-DDThh:mm:00Z'`. Recurrence is expanded
  **on read** (no cron); the app prepends `DTSTART` from `start_at`, so a weekly
  `BYDAY` rule must be anchored on a `start_at` that falls on that weekday.
- **RRULE format** (no `DTSTART` line — app adds it):
  `FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20260831T000000Z`, `FREQ=DAILY;UNTIL=…`,
  `FREQ=DAILY;INTERVAL=2;UNTIL=…` (every other day). A **null** `recurrence_rule`
  = one-off, occurs only on `start_at`'s calendar day.
- **Descriptions** render on Today as a muted sub-line and support `[label](url)`
  markdown links and bare URLs (clickable, open in a new tab).

## SQL templates

### 1 — Add academic tasks → assignments → missions for a date

```sql
begin;
with t as (
  insert into tasks (title, description, subject_id, subject_track_id, estimated_minutes, created_by)
  values
    ('Number Theory', null, 'fec7a1fc-ae4c-4335-9735-820d64d4ecb0', null, 120, '9109e39c-2427-47e5-a85d-f58bcf46ed74'),
    ('Coding', '[3 problems listed here](https://usaco.guide/…)', '7e2524f7-f00d-4610-9a09-4e8af8c13262', null, 90, '9109e39c-2427-47e5-a85d-f58bcf46ed74')
    -- one row per task; description/track/minutes may be null
  returning id, title, subject_id
),
a as (
  insert into task_assignments (task_id, student_id, assigned_by, assigned_date)
  select id, '91145fe0-2ab9-4016-b3d3-6cb005451986', '9109e39c-2427-47e5-a85d-f58bcf46ed74', '2026-06-27' from t
  returning task_id
)
insert into daily_missions (student_id, task_id, subject_id, date, status)
select '91145fe0-2ab9-4016-b3d3-6cb005451986', id, subject_id, '2026-06-27', 'not_started' from t;
commit;
```

### 2 — Recurring schedule block (class / practice / daily drill)

```sql
insert into schedule_blocks
  (student_id, subject_id, subject_track_id, title, start_at, end_at, recurrence_rule, estimated_minutes)
values
  -- Weekly on Mondays (anchor start_at on a Monday):
  ('<STUDENT_ID>','<SUBJECT_ID>', null, 'Ms Patsy class',
   '2026-06-22T16:00:00Z','2026-06-22T17:00:00Z',
   'FREQ=WEEKLY;BYDAY=MO;UNTIL=20260831T000000Z', 60),
  -- Daily:
  ('<STUDENT_ID>','<SUBJECT_ID>', null, 'Chinese study',
   '2026-06-22T08:00:00Z','2026-06-22T08:15:00Z',
   'FREQ=DAILY;UNTIL=20260831T000000Z', 15),
  -- Every other day (anchored to start_at):
  ('<STUDENT_ID>','<SUBJECT_ID>','91d5bc92-1a7f-4144-b353-f50d57508f85','AoPS Algebra',
   '2026-06-22T08:45:00Z','2026-06-22T09:00:00Z',
   'FREQ=DAILY;INTERVAL=2;UNTIL=20260831T000000Z', 15);
```

### 3 — One-off dated event (e.g. a competition)

```sql
insert into schedule_blocks (student_id, subject_id, title, start_at, all_day, location, notes)
values ('<STUDENT_ID>','46e78b86-f60d-4d0a-b878-1358eab4cbba','Swim Competition',
        '2026-06-27T00:00:00Z', true, 'KCAC', 'KCAC');
-- recurrence_rule null → shows only on 2026-06-27. `notes` shows on Today.
```

### 4 — Attach / change a note or link on a task

```sql
update tasks set description = '[5 problems listed here](https://usaco.guide/…)'  -- or plain text
where id = (
  select dm.task_id from daily_missions dm
  join tasks t on t.id = dm.task_id
  where dm.student_id = '<STUDENT_ID>' and dm.date = '<YYYY-MM-DD>' and t.title = '<Title>'
);
```

### 5 — Clear & rebuild a student's recurring blocks

```sql
begin;
delete from schedule_blocks where student_id = '<STUDENT_ID>';  -- missions keep history (SET NULL)
-- then re-insert with template 2 …
commit;
```

### Verify (read back)

```sql
-- Missions + one-off blocks for a student on a date
select 'mission' kind, t.title, s.name subject, t.estimated_minutes mins
from daily_missions dm join tasks t on t.id=dm.task_id join subjects s on s.id=dm.subject_id
where dm.student_id='<STUDENT_ID>' and dm.date='<YYYY-MM-DD>'
union all
select 'block', b.title, s.name, b.estimated_minutes
from schedule_blocks b join subjects s on s.id=b.subject_id
where b.student_id='<STUDENT_ID>' and b.start_at::date='<YYYY-MM-DD>' and b.recurrence_rule is null
order by 1,2;

-- A student's recurring blocks
select b.start_at::time time, b.title, s.name subject, b.estimated_minutes mins, b.recurrence_rule
from schedule_blocks b left join subjects s on s.id=b.subject_id
where b.student_id='<STUDENT_ID>' and b.recurrence_rule is not null
order by b.recurrence_rule, b.start_at::time;
```
