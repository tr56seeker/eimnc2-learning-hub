-- Anti-cheating: configurable violation threshold per exam, and
-- violation tracking + termination reason per attempt.

alter table public.exams
add column if not exists max_violations int not null default 3;

alter table public.exam_attempts
add column if not exists violation_count int not null default 0,
add column if not exists termination_reason text;
