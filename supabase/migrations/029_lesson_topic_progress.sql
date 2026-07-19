-- Phase 1 of per-topic learner progress: lets a quiz be scoped to one specific
-- lesson (not just the broader competency it belongs to), and adds real
-- completion/response tracking for the interactive lesson block types
-- (activity, checklist, quick_question, reflection), which today are purely
-- static content with no way to know whether a learner actually engaged with
-- them. Together with the existing lesson_progress (reading) and
-- assignments/submissions (performance task) tables, this is the last piece
-- needed for a real per-lesson progress rollup.

alter table public.exams
add column if not exists lesson_id uuid references public.lessons(id) on delete set null;

create index if not exists exams_lesson_id_idx on public.exams(lesson_id);

-- One row per learner per interactive block. `response` shape depends on the
-- block type: null for activity (a plain done/not-done checkbox), a boolean
-- array for checklist (which items are ticked), and { "text": "..." } for
-- quick_question/reflection (the learner's own typed answer — self-check,
-- not graded). `completed` is the single flag the progress rollup reads,
-- computed client-side per block type (e.g. checklist completed once every
-- item is ticked) so the rollup query doesn't need to know block-type rules.
create table if not exists public.lesson_block_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  block_id uuid not null references public.lesson_blocks(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  response jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, block_id)
);

alter table public.lesson_block_progress enable row level security;

create index if not exists lesson_block_progress_learner_idx on public.lesson_block_progress(learner_id);
create index if not exists lesson_block_progress_lesson_idx on public.lesson_block_progress(lesson_id);

drop policy if exists "lesson_block_progress_read_own_or_teacher" on public.lesson_block_progress;
create policy "lesson_block_progress_read_own_or_teacher" on public.lesson_block_progress
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "lesson_block_progress_write_own" on public.lesson_block_progress;
create policy "lesson_block_progress_write_own" on public.lesson_block_progress
for all to authenticated using (learner_id = auth.uid()) with check (learner_id = auth.uid());
