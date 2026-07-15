-- Phase 10: teacher-configurable expected filename pattern per activity.
-- Submissions stay link-based (no Supabase Storage usage, by deliberate
-- choice — see docs/DEPLOYMENT.md). We can't rename a file that lives in a
-- learner's own Drive, so instead the app always computes the canonical
-- filename from the teacher's pattern (lib/filename-pattern.ts) at submission
-- time and stores it, rather than trusting learner-typed input.

alter table public.assignments add column if not exists expected_filename_pattern text;
alter table public.submissions add column if not exists submitted_filename text;
