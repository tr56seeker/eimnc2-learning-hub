-- Safe teacher-managed learner enrollment extensions.
-- Run in Supabase SQL Editor before using teacher-managed learner enrollment.

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists middle_initial text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists grade_level text;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists must_change_password boolean default false;

create index if not exists profiles_first_name_idx on public.profiles(first_name);
create index if not exists profiles_last_name_idx on public.profiles(last_name);
create index if not exists profiles_middle_initial_idx on public.profiles(middle_initial);
create index if not exists profiles_must_change_password_idx on public.profiles(must_change_password);
