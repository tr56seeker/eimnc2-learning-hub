-- Essay grading workflow.
-- The Phase 1 audit found `exam_answers` had no UPDATE policy at all, so
-- any correction (e.g. scoring an essay after submission) had to go
-- through the service-role client. This adds a teacher/admin policy scoped
-- to the same section-assignment rule as every other learner-linked table
-- (via the parent exam_attempts row), so essay grading can go through the
-- normal RLS-scoped client instead.
drop policy if exists "exam_answers_update_teacher" on public.exam_answers;
create policy "exam_answers_update_teacher" on public.exam_answers
for update to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and public.is_teacher_or_admin()
      and public.is_assigned_to_learner_section(a.learner_id)
  )
) with check (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and public.is_teacher_or_admin()
      and public.is_assigned_to_learner_section(a.learner_id)
  )
);
