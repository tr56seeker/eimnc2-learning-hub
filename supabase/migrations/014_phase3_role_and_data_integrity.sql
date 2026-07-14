-- Phase 3 (Roles, Classes, and Learner Records) stabilization.
-- All statements are additive/guarded and safe to re-run. Nothing here drops
-- or rewrites existing data; every constraint is only added after confirming
-- no existing row would violate it, per the pattern already used in
-- 008_sections_management.sql.

-- 1. lesson_blocks_read_active never checked the parent lesson's `published`
-- flag, so an authenticated learner could read blocks belonging to an
-- unpublished/draft lesson as long as the block itself was active. Teachers
-- and admins keep full visibility (including inactive blocks, needed by
-- Lesson Studio); learners only see active blocks on published lessons.
drop policy if exists "lesson_blocks_read_active" on public.lesson_blocks;
create policy "lesson_blocks_read_active" on public.lesson_blocks
for select to authenticated using (
  public.is_teacher_or_admin()
  or (
    is_active = true
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_blocks.lesson_id and l.published = true
    )
  )
);

-- 2. profiles.lrn should be unique (a Learner Reference Number is a national
-- identifier). Only enforced if existing data is already clean; otherwise
-- this is a no-op with a notice so duplicates can be cleaned up first.
do $$
begin
  if not exists (
    select 1 from public.profiles
    where lrn is not null
    group by lrn
    having count(*) > 1
  ) then
    create unique index if not exists profiles_lrn_unique_idx
      on public.profiles (lrn) where lrn is not null;
  else
    raise notice 'Skipped profiles_lrn_unique_idx: clean duplicate LRNs first.';
  end if;
end $$;

-- 3. exam_retake_grants had no constraint preventing multiple simultaneous
-- unused grants for the same exam/learner pair. A partial unique index
-- enforces "at most one live grant" without touching used (history) rows.
do $$
begin
  if not exists (
    select 1 from public.exam_retake_grants
    where used = false
    group by exam_id, learner_id
    having count(*) > 1
  ) then
    create unique index if not exists exam_retake_grants_one_unused_idx
      on public.exam_retake_grants (exam_id, learner_id) where used = false;
  else
    raise notice 'Skipped exam_retake_grants_one_unused_idx: clean duplicate pending grants first.';
  end if;
end $$;

-- 4. profiles.status and exam_attempts.status are free-text columns backing
-- a fixed, code-enforced value set. Add CHECK constraints so the database
-- enforces the same contract the application already assumes
-- (lib/types.ts ProfileStatus, and "in_progress"/"submitted" throughout
-- app/learner/exams). Guarded so an unexpected existing value doesn't fail
-- the migration outright.
do $$
begin
  if not exists (
    select 1 from public.profiles
    where status is not null and status not in ('active', 'inactive', 'deleted')
  ) then
    alter table public.profiles drop constraint if exists profiles_status_check;
    alter table public.profiles
      add constraint profiles_status_check check (status in ('active', 'inactive', 'deleted'));
  else
    raise notice 'Skipped profiles_status_check: clean invalid profiles.status values first.';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from public.exam_attempts
    where status is not null and status not in ('in_progress', 'submitted')
  ) then
    alter table public.exam_attempts drop constraint if exists exam_attempts_status_check;
    alter table public.exam_attempts
      add constraint exam_attempts_status_check check (status in ('in_progress', 'submitted'));
  else
    raise notice 'Skipped exam_attempts_status_check: clean invalid exam_attempts.status values first.';
  end if;
end $$;

-- 5. profiles.grade_level was created as `int` (002_learners_sections.sql)
-- but migrations 005/006/007 each tried to make it `text` and silently
-- no-op'd because the column already existed. Application code
-- (lib/types.ts, app/teacher/learners/actions.ts, app/signup/actions.ts)
-- has treated it as `string | number | null` ever since, relying on
-- implicit Postgres coercion. This migration finalizes it as `text`,
-- matching what every call site already assumes. Casting int -> text is
-- lossless for existing values (e.g. 11 -> '11').
alter table public.profiles alter column grade_level type text using grade_level::text;

-- 6. Missing indexes on frequently-filtered foreign keys, identified during
-- the Phase 1 audit.
create index if not exists lesson_resources_lesson_id_idx on public.lesson_resources(lesson_id);
create index if not exists assignments_lesson_id_idx on public.assignments(lesson_id);
create index if not exists submissions_assignment_id_idx on public.submissions(assignment_id);
create index if not exists exams_competency_id_idx on public.exams(competency_id);
create index if not exists exam_attempts_exam_id_idx on public.exam_attempts(exam_id);
create index if not exists announcements_published_idx on public.announcements(published);
create index if not exists activity_logs_actor_id_idx on public.activity_logs(actor_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at);
