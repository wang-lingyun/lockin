-- LockIn — Stage 5: Homework Inbox (PRD §10.8, §12; ADR 0003 amended by ADR 0008).
-- Students submit raw work (text and/or image/PDF attachments); parents review.
-- Files live in a private Supabase Storage bucket; Postgres holds metadata only.
-- Additive over 0004. Reuses owns_student() and set_updated_at() from 0001_init.sql.
--
-- Security-sensitive: new tables + RLS, a Storage bucket, and a storage.objects
-- RLS policy. Human review required (CODEOWNERS). See docs/specs/
-- stage5-homework-security-review.md.

-- ---------------------------------------------------------------------------
-- homework_submissions — one row per submission. raw_text and attachments are
-- both optional individually, but a submission needs at least one (enforced in
-- the command schema). AI-ready fields are present but never populated in the
-- MVP (AC 30): no pipeline writes them.
-- ---------------------------------------------------------------------------

create table homework_submissions (
  id                     uuid primary key default gen_random_uuid(),
  student_id             uuid not null references students(id) on delete cascade,
  subject_id             uuid references subjects(id) on delete set null,
  subject_track_id       uuid references subject_tracks(id) on delete set null,
  topic                  text,
  assignment_title       text,
  submission_date        date not null default current_date,
  raw_text               text,
  source_type            text not null default 'text'
                           check (source_type in ('text','photo','pdf','code','link')),
  student_notes          text,
  parent_notes           text,
  review_status          text not null default 'submitted'
                           check (review_status in
                             ('submitted','reviewed','needs_correction','mastered')),
  -- AI-ready, left unpopulated in the MVP (AC 30; never auto-processed).
  ai_analysis_status     text not null default 'not_started'
                           check (ai_analysis_status in
                             ('not_started','queued','completed','failed')),
  ai_summary             text,
  detected_skills        jsonb,
  detected_mistakes      jsonb,
  recommended_next_steps jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index homework_submissions_student_idx
  on homework_submissions (student_id, submission_date desc, created_at desc);

alter table homework_submissions enable row level security;
create policy "homework_submissions: owner all" on homework_submissions for all
  using (owns_student(student_id)) with check (owns_student(student_id));
create trigger homework_submissions_updated_at before update on homework_submissions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- homework_attachments — zero-or-more files per submission. storage_path is the
-- Supabase object key (bucket 'homework'); `url` is reserved for a future
-- external link (e.g. Google Drive) and is unused now. Ownership flows through
-- the parent submission, which is itself owns_student-gated.
-- ---------------------------------------------------------------------------

create table homework_attachments (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references homework_submissions(id) on delete cascade,
  storage_path  text,
  url           text,
  mime_type     text not null,
  size_bytes    bigint not null,
  original_name text not null,
  created_at    timestamptz not null default now()
);

create index homework_attachments_submission_idx
  on homework_attachments (submission_id);

alter table homework_attachments enable row level security;
create policy "homework_attachments: owner all" on homework_attachments for all
  using (
    exists (
      select 1 from homework_submissions s
      where s.id = submission_id and owns_student(s.student_id)
    )
  )
  with check (
    exists (
      select 1 from homework_submissions s
      where s.id = submission_id and owns_student(s.student_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: a private bucket with a 5 MB/file cap and an images+PDF allow-list.
-- Objects are pathed homework/{student_id}/{uuid}-{filename}; the first path
-- segment is the student id, so the storage.objects policy can reuse
-- owns_student() exactly like every table above. Downloads use short-lived
-- signed URLs (generated server-side with the parent session); the bucket is
-- never public.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework', 'homework', false, 5242880,
  array['image/png','image/jpeg','image/heic','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "homework objects: owner all" on storage.objects for all to authenticated
  using (
    bucket_id = 'homework'
    and owns_student((split_part(name, '/', 1))::uuid)
  )
  with check (
    bucket_id = 'homework'
    and owns_student((split_part(name, '/', 1))::uuid)
  );
