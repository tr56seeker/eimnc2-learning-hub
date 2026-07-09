-- Editable DepEd-style term gradebook tables.
-- Run in Supabase SQL Editor before using editable Term Gradebook scoring.

create table if not exists public.gradebook_assessments (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  category text not null check (category in ('written', 'performance', 'summative', 'term_exam')),
  label text not null,
  highest_possible numeric(8,2) default 0,
  display_order int not null default 0,
  section_id uuid references public.sections(id) on delete set null,
  school_year text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gradebook_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.gradebook_assessments(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, learner_id)
);

alter table public.gradebook_assessments enable row level security;
alter table public.gradebook_scores enable row level security;

drop policy if exists "gradebook_assessments_read_teacher" on public.gradebook_assessments;
create policy "gradebook_assessments_read_teacher" on public.gradebook_assessments
for select to authenticated using (public.is_teacher_or_admin());

drop policy if exists "gradebook_assessments_manage_teacher" on public.gradebook_assessments;
create policy "gradebook_assessments_manage_teacher" on public.gradebook_assessments
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "gradebook_scores_read_own_or_teacher" on public.gradebook_scores;
create policy "gradebook_scores_read_own_or_teacher" on public.gradebook_scores
for select to authenticated using (learner_id = auth.uid() or public.is_teacher_or_admin());

drop policy if exists "gradebook_scores_manage_teacher" on public.gradebook_scores;
create policy "gradebook_scores_manage_teacher" on public.gradebook_scores
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create index if not exists gradebook_assessments_term_section_idx on public.gradebook_assessments(term, section_id);
create index if not exists gradebook_assessments_category_order_idx on public.gradebook_assessments(category, display_order);
create index if not exists gradebook_assessments_active_idx on public.gradebook_assessments(is_active);
create index if not exists gradebook_scores_assessment_idx on public.gradebook_scores(assessment_id);
create index if not exists gradebook_scores_learner_idx on public.gradebook_scores(learner_id);
