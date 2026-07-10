-- Complete learner profile management compatibility migration.
-- Safe to run after earlier migrations; all column changes are idempotent.

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists middle_initial text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists grade_level text;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists must_change_password boolean default false;

update public.profiles
set status = 'active'
where status is null;

create index if not exists profiles_first_name_idx on public.profiles(first_name);
create index if not exists profiles_last_name_idx on public.profiles(last_name);
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_must_change_password_idx on public.profiles(must_change_password);

drop policy if exists "profiles_select_own_or_teacher" on public.profiles;
create policy "profiles_select_own_or_teacher" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_teacher_or_admin());

drop policy if exists "profiles_update_own_or_teacher" on public.profiles;
create policy "profiles_update_own_or_teacher" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_teacher_or_admin())
with check (id = auth.uid() or public.is_teacher_or_admin());
