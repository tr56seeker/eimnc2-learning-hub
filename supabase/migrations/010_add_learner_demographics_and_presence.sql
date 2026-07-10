-- Learner demographics and lightweight presence tracking.
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists birthdate date;
alter table public.profiles add column if not exists last_seen_at timestamptz;
