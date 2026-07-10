-- Complete, idempotent learner profile fields. Existing data is preserved.
alter table public.profiles
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists middle_name text,
add column if not exists middle_initial text,
add column if not exists grade_level text,
add column if not exists status text default 'active',
add column if not exists must_change_password boolean default false;
