-- Phase 8: Projects/Milestones and Achievements.
-- Scoped to individual project assignment for now (not group projects —
-- group membership/roles/shared-submission handling is meaningfully more
-- scope and is deferred). Achievements are teacher-awarded (manual) rather
-- than auto-triggered by rules, which is also deferred.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  overview text,
  competency_id uuid references public.competencies(id) on delete set null,
  due_at timestamptz,
  rubric jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- One row per learner assigned to a project; also carries the project's
-- per-learner progress/status/final outcome since this is an individual
-- (not group) assignment model.
create table if not exists public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'on_track' check (status in ('on_track', 'delayed', 'needs_intervention', 'completed')),
  progress_percentage int not null default 0,
  final_score numeric,
  final_reflection text,
  teacher_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, learner_id)
);

-- Resubmission creates a new row (matches the existing `submissions` table
-- pattern) rather than overwriting, preserving evidence history.
create table if not exists public.milestone_submissions (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.project_milestones(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  content_text text,
  file_url text,
  status text not null default 'submitted' check (status in ('submitted', 'checked', 'returned')),
  score numeric,
  feedback text,
  submitted_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_assignments enable row level security;
alter table public.milestone_submissions enable row level security;

create index if not exists project_milestones_project_idx on public.project_milestones(project_id, display_order);
create index if not exists project_assignments_project_idx on public.project_assignments(project_id);
create index if not exists project_assignments_learner_idx on public.project_assignments(learner_id);
create index if not exists milestone_submissions_milestone_idx on public.milestone_submissions(milestone_id);
create index if not exists milestone_submissions_learner_idx on public.milestone_submissions(learner_id);

drop policy if exists "projects_read" on public.projects;
create policy "projects_read" on public.projects
for select to authenticated using (
  public.is_teacher_or_admin()
  or exists (select 1 from public.project_assignments pa where pa.project_id = id and pa.learner_id = auth.uid())
);

drop policy if exists "projects_write_teacher" on public.projects;
create policy "projects_write_teacher" on public.projects
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "project_milestones_read" on public.project_milestones;
create policy "project_milestones_read" on public.project_milestones
for select to authenticated using (
  public.is_teacher_or_admin()
  or exists (select 1 from public.project_assignments pa where pa.project_id = project_id and pa.learner_id = auth.uid())
);

drop policy if exists "project_milestones_write_teacher" on public.project_milestones;
create policy "project_milestones_write_teacher" on public.project_milestones
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "project_assignments_read" on public.project_assignments;
create policy "project_assignments_read" on public.project_assignments
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "project_assignments_write_teacher" on public.project_assignments;
create policy "project_assignments_write_teacher" on public.project_assignments
for all to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

drop policy if exists "milestone_submissions_read" on public.milestone_submissions;
create policy "milestone_submissions_read" on public.milestone_submissions
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "milestone_submissions_insert_own" on public.milestone_submissions;
create policy "milestone_submissions_insert_own" on public.milestone_submissions
for insert to authenticated with check (learner_id = auth.uid());

drop policy if exists "milestone_submissions_update_teacher" on public.milestone_submissions;
create policy "milestone_submissions_update_teacher" on public.milestone_submissions
for update to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);

-- Achievements: a teacher-managed catalog of definitions, and the actual
-- awarded instances. Manual award only (no auto-triggered rules engine).
-- No visibility/leaderboard feature — an achievement is visible only to
-- the learner who earned it and their teacher, never to other learners,
-- per the master rehabilitation spec's "no public leaderboards" rule.
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  category text not null check (
    category in (
      'lesson_completion',
      'competency_mastery',
      'timely_submission',
      'improved_performance',
      'project_completion',
      'safety_compliance',
      'consistent_participation',
      'remediation_completion',
      'enrichment_completion',
      'teacher_recognition'
    )
  ),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.learner_achievements (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  evidence_note text,
  awarded_at timestamptz not null default now()
);

alter table public.achievements enable row level security;
alter table public.learner_achievements enable row level security;

create index if not exists learner_achievements_learner_idx on public.learner_achievements(learner_id);

drop policy if exists "achievements_read" on public.achievements;
create policy "achievements_read" on public.achievements
for select to authenticated using (true);

drop policy if exists "achievements_write_teacher" on public.achievements;
create policy "achievements_write_teacher" on public.achievements
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

drop policy if exists "learner_achievements_read" on public.learner_achievements;
create policy "learner_achievements_read" on public.learner_achievements
for select to authenticated using (
  learner_id = auth.uid()
  or (public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id))
);

drop policy if exists "learner_achievements_write_teacher" on public.learner_achievements;
create policy "learner_achievements_write_teacher" on public.learner_achievements
for all to authenticated using (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
) with check (
  public.is_teacher_or_admin() and public.is_assigned_to_learner_section(learner_id)
);
