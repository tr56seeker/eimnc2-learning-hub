-- Phase 10: login hardening
-- Adds a self-pruning failed-login attempt log and lockout check, accessed only
-- through security-definer functions (never a direct table policy) so an
-- unauthenticated login request can record/check attempts without any broader
-- table access. Also documents that the account-status gate now runs inside
-- app/login/actions.ts before a session is issued, not just downstream in
-- lib/auth.ts's require*() helpers.

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_identifier_idx on public.login_attempts (identifier, created_at desc);

alter table public.login_attempts enable row level security;
-- Intentionally no policies: this table is only ever touched by the
-- security-definer functions below, never queried directly by anon/authenticated roles.

create or replace function public.record_failed_login(p_identifier text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.login_attempts where created_at < now() - interval '1 day';
  insert into public.login_attempts (identifier) values (lower(trim(p_identifier)));
$$;

create or replace function public.is_login_locked(p_identifier text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select count(*) >= 5
  from public.login_attempts
  where identifier = lower(trim(p_identifier))
    and created_at > now() - interval '15 minutes';
$$;

create or replace function public.clear_login_attempts(p_identifier text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.login_attempts where identifier = lower(trim(p_identifier));
$$;

grant execute on function public.record_failed_login(text) to anon, authenticated;
grant execute on function public.is_login_locked(text) to anon, authenticated;
grant execute on function public.clear_login_attempts(text) to anon, authenticated;
