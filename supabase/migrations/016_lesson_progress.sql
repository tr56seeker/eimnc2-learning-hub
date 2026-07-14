-- Phase 4: lesson reading progress, resume, and mark-complete.
-- One row per learner per lesson. `last_section` stores the anchor id of
-- the reader section the learner most recently scrolled to, so the reader
-- can offer a "Continue where you left off" link. Teacher/admin read access
-- reuses the Phase 3 section-assignment scoping so this stays consistent
-- with every other learner-linked table.

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  last_section text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create index if not exists lesson_progress_learner_idx on public.lesson_progress(learner_id);
create index if not exists lesson_progress_lesson_idx on public.lesson_progress(lesson_id);

drop policy if exists "lesson_progress_read_own_or_teacher" on public.lesson_progress;
create policy "lesson_progress_read_own_or_teacher" on public.lesson_progress
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "lesson_progress_write_own" on public.lesson_progress;
create policy "lesson_progress_write_own" on public.lesson_progress
for all to authenticated using (learner_id = auth.uid()) with check (learner_id = auth.uid());
