-- Modern Lesson Studio content blocks.
-- Run in Supabase SQL Editor before using /teacher/lessons/[id]/studio.

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_type text not null check (
    block_type in (
      'heading',
      'paragraph',
      'objectives',
      'image',
      'video',
      'definition',
      'safety',
      'procedure',
      'tools_materials',
      'formula',
      'embed',
      'module',
      'module_pdf',
      'activity',
      'checklist',
      'quick_question',
      'reflection',
      'glossary',
      'references',
      'resources'
    )
  ),
  title text,
  body text,
  image_url text,
  video_url text,
  resource_url text,
  resource_title text,
  resource_type text,
  caption text,
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_blocks enable row level security;

drop policy if exists "lesson_blocks_read_active" on public.lesson_blocks;
create policy "lesson_blocks_read_active" on public.lesson_blocks
for select to authenticated using (is_active = true);

drop policy if exists "lesson_blocks_manage_teacher" on public.lesson_blocks;
create policy "lesson_blocks_manage_teacher" on public.lesson_blocks
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create index if not exists lesson_blocks_lesson_order_idx on public.lesson_blocks(lesson_id, display_order);
create index if not exists lesson_blocks_active_idx on public.lesson_blocks(is_active);
