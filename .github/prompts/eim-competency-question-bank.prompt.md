# Refine EIM Competency Map and Question Bank

Refine and centralize the EIM NC II competency/topic list across the entire Learning Hub.

Update:
- Lesson Manager
- Lesson Studio
- Question Bank
- Exam Manager
- Exam Builder
- Learner Lessons
- Learner Exams
- Dashboard competency displays

Also add bulk question upload using Excel/CSV.

Follow repository instructions in `.github/copilot-instructions.md`.

Important:
- Do not modify `.env.local`
- Do not expose service role keys
- Use safe Supabase migrations
- Run `npm run build`
- Fix all TypeScript errors

Before editing:
1. Scan lesson, question bank, exam, and competency-related files.
2. Identify existing tables/actions/components.
3. Reuse existing actions if possible.
4. Avoid duplicate routes or duplicate dropdown logic.

Implement:
1. Central competency map in `lib/eim-competency-map.ts`
2. Competency helpers in `lib/competency-options.ts`
3. Shared `components/competencies/CompetencySelect.tsx`
4. Migration for competency metadata
5. Question Bank dropdown and filters update
6. Bulk upload modal/drawer for questions
7. Excel/CSV template download
8. Import preview with validation
9. Safe duplicate handling
10. Build validation

After implementation, summarize:
- files changed
- migration created
- pages updated
- build result