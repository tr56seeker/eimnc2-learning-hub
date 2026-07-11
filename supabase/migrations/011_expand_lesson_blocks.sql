-- Extend Lesson Studio with teacher-friendly module-blog block types.
-- Existing lesson blocks and URLs remain unchanged.

alter table public.lesson_blocks
  add column if not exists video_url text,
  add column if not exists resource_url text,
  add column if not exists resource_title text,
  add column if not exists resource_type text,
  add column if not exists alt_text text,
  add column if not exists caption text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true,
  add column if not exists display_order int not null default 0;

alter table public.lesson_blocks
  drop constraint if exists lesson_blocks_block_type_check;

alter table public.lesson_blocks
  add constraint lesson_blocks_block_type_check check (
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
  );
