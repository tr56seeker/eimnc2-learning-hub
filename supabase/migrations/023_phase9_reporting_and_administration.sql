-- Phase 9: Reporting and Administration.
-- Adds the first normalized academic-structure tables (academic_years,
-- terms) so administration pages have somewhere real to manage school-year
-- and term data, per the master rehab prompt's staged-migration guidance
-- (existing free-text school_year/term columns on sections and
-- gradebook_assessments are left untouched — this is additive scaffolding,
-- not a forced retrofit). Also adds an is_admin() helper so genuinely
-- admin-scoped pages (account administration, academic-year administration,
-- the audit log viewer) can be gated more tightly than the existing
-- teacher-or-admin split, and narrows activity_logs (the dormant audit-log
-- table from the original schema) to admin-only reads.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- academic_years ------------------------------------------------------------

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  year_label text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'academic_years_year_label_idx'
  ) then
    create unique index academic_years_year_label_idx on public.academic_years (lower(year_label));
  end if;
end $$;

alter table public.academic_years enable row level security;

drop policy if exists "academic_years_read_teacher" on public.academic_years;
create policy "academic_years_read_teacher" on public.academic_years
for select to authenticated using (public.is_teacher_or_admin());

drop policy if exists "academic_years_write_admin" on public.academic_years;
create policy "academic_years_write_admin" on public.academic_years
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- terms -----------------------------------------------------------------

create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  order_index int not null default 0,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

create index if not exists terms_academic_year_idx on public.terms(academic_year_id);

alter table public.terms enable row level security;

drop policy if exists "terms_read_teacher" on public.terms;
create policy "terms_read_teacher" on public.terms
for select to authenticated using (public.is_teacher_or_admin());

drop policy if exists "terms_write_admin" on public.terms;
create policy "terms_write_admin" on public.terms
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- activity_logs: narrow reads to admin only ------------------------------
-- This table has existed since the original schema but nothing has ever
-- written to it. Phase 9 wires it up as the audit trail (lib/audit.ts) and
-- adds a dedicated viewer page gated to the admin role, so reads are
-- tightened accordingly. Inserts remain open to any authenticated user for
-- their own actor_id, or any teacher/admin acting as themselves, unchanged.

drop policy if exists "logs_read_teacher" on public.activity_logs;
drop policy if exists "logs_read_admin" on public.activity_logs;
create policy "logs_read_admin" on public.activity_logs
for select to authenticated using (public.is_admin());

create index if not exists activity_logs_action_idx on public.activity_logs(action);
