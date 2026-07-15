-- Phase 10: index the foreign keys Postgres doesn't index automatically.
-- Flagged by the Phase 10 audit: these are hit by RLS exists(...) subqueries
-- or report/list-page filters and had no supporting index.

create index if not exists learner_achievements_achievement_idx on public.learner_achievements(achievement_id);
create index if not exists projects_competency_idx on public.projects(competency_id);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists question_bank_created_by_idx on public.question_bank(created_by);
create index if not exists exams_created_by_idx on public.exams(created_by);
create index if not exists assignments_created_by_idx on public.assignments(created_by);
create index if not exists announcements_created_by_idx on public.announcements(created_by);
create index if not exists achievements_created_by_idx on public.achievements(created_by);
create index if not exists gradebook_assessments_section_idx on public.gradebook_assessments(section_id);
