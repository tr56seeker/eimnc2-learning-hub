-- Phase: teacher-facing competency management (add/reorder/archive).
-- competencies already had teacher-write RLS (schema.sql) but no UI ever
-- used it. Adds a soft-delete flag so archiving a competency doesn't break
-- existing lessons/questions/projects that still reference it (their
-- competency_id stays intact; archived competencies just stop appearing
-- as a choice for new content).

alter table public.competencies add column if not exists is_active boolean not null default true;

create index if not exists competencies_active_order_idx on public.competencies(is_active, order_index);
