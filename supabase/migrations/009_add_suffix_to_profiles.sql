-- Store name suffixes separately from last_name.
alter table public.profiles
add column if not exists suffix text;
