-- Safe exam builder extensions for existing EIM NC II Learning Hub databases.
-- Run in Supabase SQL Editor before using the teacher exam builder UI.

alter table public.question_bank
add column if not exists is_active boolean not null default true;

alter table public.exams
add column if not exists randomize_choices boolean not null default false,
add column if not exists show_result_after_submit boolean not null default true,
add column if not exists allow_review_after_close boolean not null default false;

update public.exams
set show_result_after_submit = show_score_after_submit
where show_score_after_submit is not null;

create index if not exists question_bank_competency_idx on public.question_bank(competency_id);
create index if not exists question_bank_active_idx on public.question_bank(is_active);
create index if not exists exam_questions_exam_order_idx on public.exam_questions(exam_id, order_index);

drop policy if exists "exam_questions_read_authenticated" on public.exam_questions;
drop policy if exists "exam_questions_read_published_or_teacher" on public.exam_questions;
create policy "exam_questions_read_published_or_teacher" on public.exam_questions
for select to authenticated using (
  public.is_teacher_or_admin()
  or exists (
    select 1 from public.exams e
    where e.id = exam_id and e.status = 'published'
  )
);

drop policy if exists "attempts_insert_own" on public.exam_attempts;
drop policy if exists "attempts_insert_own_published_exam" on public.exam_attempts;
create policy "attempts_insert_own_published_exam" on public.exam_attempts
for insert to authenticated with check (
  learner_id = auth.uid()
  and exists (
    select 1 from public.exams e
    where e.id = exam_id and e.status = 'published'
  )
);
