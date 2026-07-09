-- Safe learner profile and section management extensions.
-- Run in Supabase SQL Editor before using the teacher Learners and Sections pages.

alter table public.profiles
add column if not exists email text,
add column if not exists grade_level int,
add column if not exists status text not null default 'active';

alter table public.sections
add column if not exists is_active boolean not null default true;

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_lrn_idx on public.profiles(lrn);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_grade_level_idx on public.profiles(grade_level);
create index if not exists sections_grade_level_idx on public.sections(grade_level);
create index if not exists sections_active_idx on public.sections(is_active);

insert into public.sections (name, grade_level, school_year)
select 'Apollo', 11, '2026-2027'
where not exists (
  select 1 from public.sections
  where name = 'Apollo' and grade_level = 11 and school_year = '2026-2027'
);

insert into public.sections (name, grade_level, school_year)
select 'EIM', 12, '2026-2027'
where not exists (
  select 1 from public.sections
  where name = 'EIM' and grade_level = 12 and school_year = '2026-2027'
);
