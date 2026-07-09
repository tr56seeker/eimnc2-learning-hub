-- EIM NC II Learning Hub Database Schema
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('learner', 'teacher', 'admin');
create type public.question_type as enum ('multiple_choice', 'true_false', 'identification', 'essay');
create type public.exam_status as enum ('draft', 'published', 'closed');
create type public.submission_status as enum ('draft', 'submitted', 'checked', 'returned');
create type public.grade_component as enum ('written_work', 'performance_task', 'quarterly_assessment');
create type public.difficulty_level as enum ('easy', 'average', 'hots');

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level int not null,
  school_year text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'learner',
  lrn text,
  section_id uuid references public.sections(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  description text,
  grade_level int,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid references public.competencies(id) on delete set null,
  title text not null,
  slug text not null,
  summary text,
  content_md text,
  estimated_minutes int default 45,
  order_index int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  url text not null,
  resource_type text not null default 'link',
  created_at timestamptz not null default now()
);

create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid references public.competencies(id) on delete set null,
  question_type public.question_type not null,
  question_text text not null,
  choices jsonb,
  correct_answer text,
  explanation text,
  points numeric(8,2) not null default 1,
  difficulty public.difficulty_level not null default 'average',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid references public.competencies(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes int default 30,
  attempts_allowed int not null default 1,
  randomize_questions boolean not null default false,
  show_score_after_submit boolean not null default true,
  status public.exam_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_id uuid not null references public.question_bank(id) on delete cascade,
  points_override numeric(8,2),
  order_index int not null default 0,
  unique (exam_id, question_id)
);


-- Learner-safe exam question view. It intentionally does not expose correct_answer or explanation.
create or replace view public.exam_question_public as
select
  eq.exam_id,
  eq.order_index,
  eq.points_override,
  qb.id as question_id,
  qb.question_text,
  qb.question_type,
  qb.choices,
  qb.points,
  qb.difficulty
from public.exam_questions eq
join public.question_bank qb on qb.id = eq.question_id
join public.exams e on e.id = eq.exam_id
where e.status = 'published';

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(8,2) not null default 0,
  max_score numeric(8,2) not null default 0,
  status text not null default 'in_progress',
  created_at timestamptz not null default now()
);

create table public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.question_bank(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  score_awarded numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  instructions text,
  due_at timestamptz,
  max_score numeric(8,2) not null default 100,
  rubric jsonb,
  submission_type text not null default 'link_or_text',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  content_text text,
  file_url text,
  submitted_at timestamptz not null default now(),
  score numeric(8,2),
  feedback text,
  status public.submission_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  title text not null,
  score numeric(8,2) not null,
  max_score numeric(8,2) not null,
  component public.grade_component not null,
  created_at timestamptz not null default now(),
  unique (learner_id, source_type, source_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_teacher_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('teacher', 'admin'), false);
$$;

alter table public.sections enable row level security;
alter table public.profiles enable row level security;
alter table public.competencies enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.question_bank enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_logs enable row level security;

-- Profiles
create policy "profiles_select_own_or_teacher" on public.profiles
for select using (id = auth.uid() or public.is_teacher_or_admin());

create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles_update_own_or_teacher" on public.profiles
for update using (id = auth.uid() or public.is_teacher_or_admin())
with check (id = auth.uid() or public.is_teacher_or_admin());

-- Common read tables
create policy "sections_read_public" on public.sections
for select to anon, authenticated using (true);

create policy "sections_write_teacher" on public.sections
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "competencies_read_authenticated" on public.competencies
for select to authenticated using (true);

create policy "competencies_write_teacher" on public.competencies
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "lessons_read_published_or_teacher" on public.lessons
for select to authenticated using (published = true or public.is_teacher_or_admin());

create policy "lessons_write_teacher" on public.lessons
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "lesson_resources_read" on public.lesson_resources
for select to authenticated using (true);

create policy "lesson_resources_write_teacher" on public.lesson_resources
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Question bank and exams
create policy "question_bank_read_teacher" on public.question_bank
for select to authenticated using (public.is_teacher_or_admin());

create policy "question_bank_write_teacher" on public.question_bank
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "exams_read_published_or_teacher" on public.exams
for select to authenticated using (status = 'published' or public.is_teacher_or_admin());

create policy "exams_write_teacher" on public.exams
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "exam_questions_read_authenticated" on public.exam_questions
for select to authenticated using (true);

create policy "exam_questions_write_teacher" on public.exam_questions
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Attempts and answers
create policy "attempts_read_own_or_teacher" on public.exam_attempts
for select to authenticated using (learner_id = auth.uid() or public.is_teacher_or_admin());

create policy "attempts_insert_own" on public.exam_attempts
for insert to authenticated with check (learner_id = auth.uid());

create policy "attempts_update_own_or_teacher" on public.exam_attempts
for update to authenticated using (learner_id = auth.uid() or public.is_teacher_or_admin()) with check (learner_id = auth.uid() or public.is_teacher_or_admin());

create policy "answers_read_own_or_teacher" on public.exam_answers
for select to authenticated using (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and (a.learner_id = auth.uid() or public.is_teacher_or_admin())
  )
);

create policy "answers_insert_own" on public.exam_answers
for insert to authenticated with check (
  exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.learner_id = auth.uid()
  )
);

-- Assignments and submissions
create policy "assignments_read_authenticated" on public.assignments
for select to authenticated using (true);

create policy "assignments_write_teacher" on public.assignments
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "submissions_read_own_or_teacher" on public.submissions
for select to authenticated using (learner_id = auth.uid() or public.is_teacher_or_admin());

create policy "submissions_insert_own" on public.submissions
for insert to authenticated with check (learner_id = auth.uid());

create policy "submissions_update_teacher" on public.submissions
for update to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Grades
create policy "grades_read_own_or_teacher" on public.grades
for select to authenticated using (learner_id = auth.uid() or public.is_teacher_or_admin());

create policy "grades_insert_teacher_or_own_exam" on public.grades
for insert to authenticated with check (learner_id = auth.uid() or public.is_teacher_or_admin());

create policy "grades_update_teacher" on public.grades
for update to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

-- Announcements and logs
create policy "announcements_read_published" on public.announcements
for select to authenticated using (published = true or public.is_teacher_or_admin());

create policy "announcements_write_teacher" on public.announcements
for all to authenticated using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());

create policy "logs_read_teacher" on public.activity_logs
for select to authenticated using (public.is_teacher_or_admin());

create policy "logs_insert_authenticated" on public.activity_logs
for insert to authenticated with check (actor_id = auth.uid() or public.is_teacher_or_admin());

create index profiles_role_idx on public.profiles(role);
create index profiles_section_id_idx on public.profiles(section_id);
create index lessons_competency_id_idx on public.lessons(competency_id);
create index exams_status_idx on public.exams(status);
create index exam_attempts_learner_exam_idx on public.exam_attempts(learner_id, exam_id);
create index submissions_learner_idx on public.submissions(learner_id);
create index grades_learner_idx on public.grades(learner_id);
