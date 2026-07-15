-- Phase 7: Assessment Integrity Monitoring.
-- Until now only an aggregated violation_count + a single termination_reason
-- string were kept per attempt, with no per-event timeline and no teacher
-- review/resolution workflow. This adds both, building on the real-time
-- server-side violation tracking already in recordExamViolationAction.

create table if not exists public.exam_integrity_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  event_type text not null check (event_type in ('tab_switch', 'copy_attempt', 'paste_attempt', 'right_click', 'fullscreen_exit')),
  created_at timestamptz not null default now()
);

alter table public.exam_integrity_events enable row level security;

create index if not exists exam_integrity_events_attempt_idx on public.exam_integrity_events(attempt_id, created_at);

drop policy if exists "exam_integrity_events_read" on public.exam_integrity_events;
create policy "exam_integrity_events_read" on public.exam_integrity_events
for select to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and (
        a.learner_id = auth.uid()
        or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(a.learner_id))
      )
  )
);

drop policy if exists "exam_integrity_events_insert_own" on public.exam_integrity_events;
create policy "exam_integrity_events_insert_own" on public.exam_integrity_events
for insert to authenticated with check (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.learner_id = auth.uid()
  )
);

-- One review record per attempt that has at least one violation. Status
-- values mirror the master rehabilitation spec's incident classification.
create table if not exists public.exam_incident_reviews (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.exam_attempts(id) on delete cascade,
  status text not null default 'needs_review' check (
    status in ('needs_review', 'no_concern', 'technical_issue', 'clarification_required', 'possible_violation', 'resolved', 'escalated')
  ),
  notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exam_incident_reviews enable row level security;

create index if not exists exam_incident_reviews_status_idx on public.exam_incident_reviews(status);

drop policy if exists "exam_incident_reviews_teacher" on public.exam_incident_reviews;
create policy "exam_incident_reviews_teacher" on public.exam_incident_reviews
for all to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and public.is_teacher_or_admin()
      and public.is_assigned_to_learner_section(a.learner_id)
  )
) with check (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id
      and public.is_teacher_or_admin()
      and public.is_assigned_to_learner_section(a.learner_id)
  )
);
