-- 1. Tighten grades/exam_attempts RLS.
-- The app always writes learner scores server-side via the service-role
-- (admin) client, which bypasses RLS entirely (see app/learner/exams/actions.ts).
-- The "own" write clauses on these two policies were therefore dead weight for
-- the app but still let any authenticated learner call PostgREST directly and
-- forge their own exam_attempts.score / grades rows. Restrict both to
-- teacher/admin only.

drop policy if exists "attempts_update_own_or_teacher" on public.exam_attempts;
create policy "attempts_update_own_or_teacher" on public.exam_attempts
for update to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "grades_insert_teacher_or_own_exam" on public.grades;
create policy "grades_insert_teacher_or_own_exam" on public.grades
for insert to authenticated with check (public.is_teacher_or_admin());

-- 2. exam_retake_grants was created ad-hoc (no prior migration committed it).
-- This documents the table as it's actually used in app/learner/exams/actions.ts,
-- app/learner/exams/[id]/page.tsx, and app/teacher/learners/actions.ts, and
-- enables RLS. `create table if not exists` / `drop policy if exists` keep this
-- safe to run against the existing production table.

create table if not exists public.exam_retake_grants (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  note text,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.exam_retake_grants enable row level security;

drop policy if exists "exam_retake_grants_read_own_or_teacher" on public.exam_retake_grants;
create policy "exam_retake_grants_read_own_or_teacher" on public.exam_retake_grants
for select to authenticated using (learner_id = auth.uid() or public.is_teacher_or_admin());

drop policy if exists "exam_retake_grants_insert_teacher" on public.exam_retake_grants;
create policy "exam_retake_grants_insert_teacher" on public.exam_retake_grants
for insert to authenticated with check (public.is_teacher_or_admin());

-- Learner may mark their own still-unused grant as used (this happens when
-- they start the retake attempt); they cannot revive a used grant or touch
-- anyone else's row.
drop policy if exists "exam_retake_grants_learner_mark_used" on public.exam_retake_grants;
create policy "exam_retake_grants_learner_mark_used" on public.exam_retake_grants
for update to authenticated
using (learner_id = auth.uid() and used = false)
with check (learner_id = auth.uid() and used = true);

drop policy if exists "exam_retake_grants_update_teacher" on public.exam_retake_grants;
create policy "exam_retake_grants_update_teacher" on public.exam_retake_grants
for update to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create index if not exists exam_retake_grants_exam_learner_idx on public.exam_retake_grants(exam_id, learner_id);
create index if not exists exam_retake_grants_learner_used_idx on public.exam_retake_grants(learner_id, used);
