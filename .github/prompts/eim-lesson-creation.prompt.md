# Create an EIM Lesson (Content + Activity + Quiz)

Build one complete, book-blog-style lesson topic from a lesson plan: reading content, interactive blocks, an optional performance-task activity, and a topic-scoped quiz — all linked so it shows up correctly on `/learner/progress`.

Trigger: the user says something like "create a lesson for **[topic]** under **[competency]**" and supplies (or points to) source material — a lesson plan, TESDA competency standard excerpt, or existing notes. Do not invent technical content from nothing; ask for source material first if none was given.

Update:
- New row(s) in `competencies` (only if the competency doesn't already exist)
- New row in `lessons`
- New rows in `lesson_blocks` (the reading content, blog-style)
- New row in `assignments` (only if the lesson plan includes a performance task/output)
- New rows in `question_bank` + `exams` + `exam_questions` (the topic's formative assessment)

Important:
- Deliver as a single reviewable SQL script at `supabase/sample_content_<slug>.sql`, following the exact pattern in `supabase/sample_content_duplex_outlet.sql` (a `do $$ ... end $$` block with `declare`d uuid variables, reuse-if-exists lookup for the competency, `returning id into ...` chaining). Do not run it — Claude has no DB credentials. The user runs it themselves in the Supabase SQL Editor and reports back whether it succeeded.
- Do not modify `.env*` or expose service-role keys.
- `lessons.published` should be `true` so it's immediately visible to learners, unless the user says to leave it as a draft.
- `exams.lesson_id` must be set to the new lesson's id (this is what scopes the quiz to this one topic instead of the whole competency — see `supabase/migrations/029_lesson_topic_progress.sql`). Confirm with the user that migration `029` has been applied before relying on this column existing.
- `assignments.lesson_id` likewise scopes the activity/output to this lesson (pre-existing column, no migration needed).
- `block_type` must be one of the 20 values allowed by the `lesson_blocks_block_type_check` constraint (`supabase/migrations/011_expand_lesson_blocks.sql`): `heading, paragraph, objectives, image, video, definition, safety, procedure, tools_materials, formula, embed, module, module_pdf, activity, checklist, quick_question, reflection, glossary, references, resources`.
- The four types `activity`, `checklist`, `quick_question`, `reflection` are the ones learners actually interact with (tracked in `lesson_block_progress`) — every lesson should include at least one so the "Activities" checklist item on `/learner/progress` isn't stuck at "no activity in this topic".

Before editing:
1. Ask for or confirm the source material (lesson plan section, competency code/title) if not already provided.
2. Check `competencies` for an existing row with the same `code` — reuse it rather than duplicating.
3. Check `lessons` for a title/slug collision under that competency.
4. Skim the two existing samples (`supabase/sample_content_duplex_outlet.sql`, `supabase/sample_content_multimeter_skills.sql`) for tone/level if unfamiliar with the established voice.

Implement:
1. Competency lookup-or-insert (reuse if `code` already exists).
2. Lesson insert — `title`, `slug` (kebab-case + short random suffix like the samples), `summary`, `estimated_minutes`, `order_index`, `published = true`.
3. Lesson blocks, `display_order` in steps of 10, grouped in this reading order (skip any group the source material doesn't support):
   - **Learning Goals** — `objectives`
   - **Preparation** — `safety`, `tools_materials`
   - **Core Lesson** — `heading`, `paragraph`, `procedure`, `definition`, `formula`, `image`/`video`/`embed` as relevant
   - **Interactive Resources** — `checklist` and/or `activity` tied to hands-on steps
   - **Guided Practice** — `quick_question` (a quick self-check, ungraded)
   - **Knowledge Check** — pointer text only; the real assessment is the linked exam, not a block
   - **Reflection** — `reflection`
4. If the lesson plan includes a performance task/output: insert into `assignments` with `lesson_id` set, a clear `instructions` field, and `expected_filename_pattern` matching the `{LRN}_{LASTNAME}_...` convention used in the samples.
5. Question bank: write questions that test the actual lesson content (mix of `multiple_choice`, `true_false`, `identification`, `essay` — match what the samples do, don't force all four if the topic doesn't warrant it).
6. Exam: insert into `exams` with `lesson_id` set to the new lesson, `status = 'published'`, then link every question via `exam_questions`.
7. `raise notice` at the end reporting the created lesson/assignment/exam ids, matching the existing samples' style.

After implementation, summarize:
- competency reused or created (code)
- lesson title + slug
- number of lesson blocks and which interactive types were included
- whether an activity/output was created
- number of quiz questions and the exam title
- the exact file path to run, and a reminder: run it in the Supabase SQL Editor, then report back success/failure so the loop closes (see the migration-review workflow this project already follows)
