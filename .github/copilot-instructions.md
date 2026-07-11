# EIM NC II Learning Hub — Copilot Instructions

This project is the EIM NC II Learning Hub for Tabunoc National High School.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, RLS
- Teacher and Learner portals
- Segoe UI / Apple-inspired clean interface

## Important rules
- Do not modify `.env.local`.
- Do not expose Supabase service role keys to client components.
- Keep service role usage server-side only.
- Run `npm run build` after changes and fix all TypeScript errors.
- Preserve existing routes and data.
- Do not create duplicate navbar/menu items if a route already exists.
- Use safe Supabase migrations: `create table if not exists`, `add column if not exists`.
- Do not drop existing tables or columns.
- Use existing RLS helpers such as `public.is_teacher_or_admin(auth.uid())` when available.

## UI standards
- Use Segoe UI and existing Apple-inspired design.
- Prefer compact repository/table layouts for lists.
- Avoid oversized cards unless needed for dashboards.
- Use clean badges, subtle borders, readable spacing.
- Teacher pages should feel like professional school management tools.
- Learner pages should feel like module-blog learning pages.

## Existing main routes
- `/teacher/dashboard`
- `/teacher/learners`
- `/teacher/sections`
- `/teacher/lessons`
- `/teacher/lessons/[id]/studio`
- `/teacher/question-bank`
- `/teacher/exams`
- `/teacher/exams/[id]/builder`
- `/teacher/gradebook`
- `/teacher/submissions`
- `/learner/dashboard`
- `/learner/lessons`
- `/learner/lessons/[id]`
- `/learner/exams`
- `/learner/grades`
- `/learner/submissions`

## Learner rules
- Learners are teacher-managed accounts.
- Default temporary password is `eimnc2password`.
- Learners may have:
  - first_name
  - middle_name
  - last_name
  - suffix
  - sex
  - birthdate
  - last_seen_at
  - lrn
  - grade_level
  - section_id
  - status
- Learners page complete name format:
  `LASTNAME, FIRSTNAME MIDDLENAME SUFFIX`
- Gradebook name format:
  `LASTNAME, FIRSTNAME M. SUFFIX`
- Email/Login ID should not appear in the main learners table; show it in profile/edit views only.

## Sections
- Store section name cleanly, for example `Apollo`, not `Grade 11 - Apollo`.
- Display section as `Grade 11 - Apollo` using grade_level + section name.
- Add/Edit/Remove sections should happen in `/teacher/sections`.
- Inactive sections should not appear in Add Learner dropdown by default.

## Lessons
- Lesson Manager should look like a compact repository.
- Lesson Studio should clearly show:
  - Back to Lessons
  - Preview as Learner
  - Publish Lesson / Unpublish Lesson
  - Add content block
  - Existing content blocks
- Lesson blocks must support:
  - Heading
  - Paragraph
  - Objectives
  - Safety Note
  - Image
  - Video
  - Embed
  - PowerPoint
  - Module PDF
  - Activity
  - Checklist
  - Quick Question
  - Reflection
  - Resources
- Embed/PowerPoint blocks should accept iframe code or URL.
- Extract only iframe `src`; never render raw iframe HTML.
- Embedded viewers should include fullscreen and Open in New Tab fallback.

## Question Bank
- Question Bank should behave like a compact repository.
- Use central EIM competency map.
- Support Add Question, Edit Question, View Question, Delete.
- Add bulk upload using Excel/CSV template.
- Bulk upload columns:
  competency_code, question_type, difficulty, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, points, explanation, is_active

## Competency map
Use a centralized EIM competency/topic map:
- Grade Level
- Term
- Cluster
- Unit Code
- Week
- Topic
- Suggested Lesson Title
- Suggested Objectives
- Suggested Activities
- Suggested Assessment

Do not hard-code different competency lists per page.
Use shared helpers/components when possible.

## Build validation
Always run:
`npm run build`

If database schema changes are needed, create a safe migration in:
`supabase/migrations/`