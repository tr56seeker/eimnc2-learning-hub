-- Phase 4 (continued): lesson version history and scheduled publishing.

-- A full snapshot (lesson fields + its blocks) is taken every time a lesson
-- is published, so a teacher can review or restore an earlier version.
-- Shared academic content, same write scope as lessons/lesson_blocks
-- themselves (any teacher/admin).
create table if not exists public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.lesson_versions enable row level security;

create index if not exists lesson_versions_lesson_idx on public.lesson_versions(lesson_id, created_at desc);

drop policy if exists "lesson_versions_read_teacher" on public.lesson_versions;
create policy "lesson_versions_read_teacher" on public.lesson_versions
for select to authenticated using (public.is_teacher_or_admin());

drop policy if exists "lesson_versions_write_teacher" on public.lesson_versions;
create policy "lesson_versions_write_teacher" on public.lesson_versions
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Scheduled publishing: a teacher sets a future publish time; the lesson
-- stays draft until that time passes, at which point the app flips
-- `published` to true the next time either lesson list page is loaded
-- (see lib/lesson-scheduling.ts) rather than depending on a cron job or
-- always-on server process.
alter table public.lessons add column if not exists scheduled_publish_at timestamptz;

create index if not exists lessons_scheduled_publish_at_idx on public.lessons(scheduled_publish_at) where scheduled_publish_at is not null;
