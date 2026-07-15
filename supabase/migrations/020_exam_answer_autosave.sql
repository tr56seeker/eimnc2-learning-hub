-- Phase 6: exam answer autosave.
-- The exam-taking form previously only persisted answers once, at final
-- submit — a crashed browser, dropped connection, or accidental navigation
-- before submitting lost every answer. This table stores in-progress
-- answers per question as the learner types/selects, independent of the
-- final scored exam_answers row written at submit time.
create table if not exists public.exam_attempt_drafts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.question_bank(id) on delete cascade,
  answer_text text,
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

alter table public.exam_attempt_drafts enable row level security;

create index if not exists exam_attempt_drafts_attempt_idx on public.exam_attempt_drafts(attempt_id);

-- The learner owns drafts for their own in-progress attempt; teacher/admin
-- can read (e.g. to help a learner recover a session) scoped the same way
-- as every other learner-linked table.
drop policy if exists "exam_attempt_drafts_learner_own" on public.exam_attempt_drafts;
create policy "exam_attempt_drafts_learner_own" on public.exam_attempt_drafts
for all to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.learner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.learner_id = auth.uid()
  )
);

drop policy if exists "exam_attempt_drafts_read_teacher" on public.exam_attempt_drafts;
create policy "exam_attempt_drafts_read_teacher" on public.exam_attempt_drafts
for select to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and public.is_teacher_or_admin()
      and public.is_assigned_to_learner_section(a.learner_id)
  )
);
