-- Phase 3: restrict each teacher to only their assigned sections/classes.
-- Today every teacher/admin account is an unscoped co-admin over all school
-- content and all learners. This migration introduces an explicit
-- teacher_assignments table (teacher <-> section) and narrows the RLS
-- policies that expose learner-linked data (profiles, submissions, exam
-- attempts/answers, grades, gradebook scores, retake grants) so a teacher
-- only sees/manages learners in their assigned sections. Shared academic
-- content (lessons, exams, question bank, sections themselves) remains
-- collaboratively editable by any teacher/admin, unchanged.
--
-- Backfill: every existing teacher/admin profile is assigned to every
-- existing section, so the current single-teacher deployment's behavior is
-- fully preserved after this migration runs. The new restriction only takes
-- effect for future teacher accounts, or once assignments are edited.

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, section_id)
);

alter table public.teacher_assignments enable row level security;

create index if not exists teacher_assignments_teacher_idx on public.teacher_assignments(teacher_id);
create index if not exists teacher_assignments_section_idx on public.teacher_assignments(section_id);

insert into public.teacher_assignments (teacher_id, section_id)
select p.id, s.id
from public.profiles p
cross join public.sections s
where p.role in ('teacher', 'admin')
on conflict (teacher_id, section_id) do nothing;

-- No dedicated Administrator role exists yet (see Phase 1 audit) — until it
-- does, assignment management is available to any teacher/admin account,
-- consistent with every other "teacher-write" policy already in this schema.
drop policy if exists "teacher_assignments_read" on public.teacher_assignments;
create policy "teacher_assignments_read" on public.teacher_assignments
for select to authenticated using (public.is_teacher_or_admin());

drop policy if exists "teacher_assignments_write" on public.teacher_assignments;
create policy "teacher_assignments_write" on public.teacher_assignments
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Helper functions --------------------------------------------------------

create or replace function public.is_assigned_to_section(target_section_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments ta
    where ta.teacher_id = auth.uid() and ta.section_id = target_section_id
  );
$$;

-- A learner with no section assigned yet is visible to any teacher/admin
-- (someone needs to be able to assign them to a section); otherwise the
-- calling teacher must be assigned to that learner's section.
create or replace function public.is_assigned_to_learner_section(target_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (learner.section_id is null) or public.is_assigned_to_section(learner.section_id)
      from public.profiles learner
      where learner.id = target_learner_id
    ),
    false
  );
$$;

-- profiles ------------------------------------------------------------

drop policy if exists "profiles_select_own_or_teacher" on public.profiles;
create policy "profiles_select_own_or_teacher" on public.profiles
for select to authenticated using (
  id = auth.uid()
  or (public.is_teacher_or_admin() and (role <> 'learner' or public.is_assigned_to_learner_section(id)))
);

drop policy if exists "profiles_update_own_or_teacher" on public.profiles;
create policy "profiles_update_own_or_teacher" on public.profiles
for update to authenticated using (
  id = auth.uid()
  or (public.is_teacher_or_admin() and (role <> 'learner' or public.is_assigned_to_learner_section(id)))
) with check (
  id = auth.uid()
  or (public.is_teacher_or_admin() and (role <> 'learner' or public.is_assigned_to_learner_section(id)))
);

-- exam_attempts ---------------------------------------------------------

drop policy if exists "attempts_read_own_or_teacher" on public.exam_attempts;
create policy "attempts_read_own_or_teacher" on public.exam_attempts
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "attempts_update_own_or_teacher" on public.exam_attempts;
create policy "attempts_update_own_or_teacher" on public.exam_attempts
for update to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

-- exam_answers ------------------------------------------------------------

drop policy if exists "answers_read_own_or_teacher" on public.exam_answers;
create policy "answers_read_own_or_teacher" on public.exam_answers
for select to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and (
        a.learner_id = auth.uid()
        or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(a.learner_id))
      )
  )
);

-- submissions -------------------------------------------------------------

drop policy if exists "submissions_read_own_or_teacher" on public.submissions;
create policy "submissions_read_own_or_teacher" on public.submissions
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "submissions_update_teacher" on public.submissions;
create policy "submissions_update_teacher" on public.submissions
for update to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

-- grades --------------------------------------------------------------

drop policy if exists "grades_read_own_or_teacher" on public.grades;
create policy "grades_read_own_or_teacher" on public.grades
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "grades_update_teacher" on public.grades;
create policy "grades_update_teacher" on public.grades
for update to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

-- gradebook_assessments (school/term column definitions; scoped when tied
-- to a specific section, shared when section_id is null) -----------------

drop policy if exists "gradebook_assessments_read_teacher" on public.gradebook_assessments;
create policy "gradebook_assessments_read_teacher" on public.gradebook_assessments
for select to authenticated using (
  public.is_teacher_or_admin() and (section_id is null or public.is_assigned_to_section(section_id))
);

drop policy if exists "gradebook_assessments_manage_teacher" on public.gradebook_assessments;
create policy "gradebook_assessments_manage_teacher" on public.gradebook_assessments
for all to authenticated using (
  public.is_teacher_or_admin() and (section_id is null or public.is_assigned_to_section(section_id))
) with check (
  public.is_teacher_or_admin() and (section_id is null or public.is_assigned_to_section(section_id))
);

-- gradebook_scores ----------------------------------------------------

drop policy if exists "gradebook_scores_read_own_or_teacher" on public.gradebook_scores;
create policy "gradebook_scores_read_own_or_teacher" on public.gradebook_scores
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "gradebook_scores_manage_teacher" on public.gradebook_scores;
create policy "gradebook_scores_manage_teacher" on public.gradebook_scores
for all to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

-- exam_retake_grants --------------------------------------------------

drop policy if exists "exam_retake_grants_read_own_or_teacher" on public.exam_retake_grants;
create policy "exam_retake_grants_read_own_or_teacher" on public.exam_retake_grants
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "exam_retake_grants_insert_teacher" on public.exam_retake_grants;
create policy "exam_retake_grants_insert_teacher" on public.exam_retake_grants
for insert to authenticated with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

drop policy if exists "exam_retake_grants_update_teacher" on public.exam_retake_grants;
create policy "exam_retake_grants_update_teacher" on public.exam_retake_grants
for update to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);
