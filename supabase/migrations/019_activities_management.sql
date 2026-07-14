-- Phase 5: teacher-managed activities (assignments).
-- There was previously no teacher UI to create an assignment at all — the
-- table could only be populated by direct DB access. This adds the
-- archive/soft-delete field needed for that management UI, matching the
-- is_active pattern already used on sections and question_bank.
alter table public.assignments add column if not exists is_active boolean not null default true;

create index if not exists assignments_is_active_idx on public.assignments(is_active);
