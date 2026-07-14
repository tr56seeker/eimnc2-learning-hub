# EIM NC II Learning Hub — Phase 1 Audit and Stabilization Report

**Date:** 2026-07-14
**Scope:** Read-only audit per `docs/EIM_HUB_REHABILITATION_MASTER_PROMPT.md`, Section 35 (Phase 1) and Section 39.
**Constraints observed:** No production code, database, auth, or deployment config was modified. No `.env*` file, credential, service-role key, learner record, assessment answer, or private upload was opened or exposed. `supabase/seed.sql` was not accessible to the audit tooling under the current sandbox permissions and was not inspected — see §12 and §26.

---

## 1. Executive Summary

The EIM NC II Learning Hub is a working, deployed-shape Next.js 16 / React 19 / TypeScript / Supabase application, not a prototype. It already delivers a real MVP: learner and teacher login, lesson authoring and reading, a question bank, exam building and taking with basic anti-cheating, output submissions and grading, a DepEd-compliant term gradebook with Excel/PDF-style export, section and learner account management, and an item-analysis/mastery report.

The codebase is small (~50 route files), server-first (minimal client JS), type-checks cleanly under TypeScript strict mode, and builds successfully. Row-Level Security is enabled on every table with no gaps. This is a healthier starting point than the master prompt's framing ("rehabilitate a struggling platform") might suggest — most of Sections 7–21 of the master prompt describe **target** functionality (achievements, projects, notifications, integrity monitoring dashboard, admin role, reporting suite) that **does not exist yet**, rather than existing functionality that is broken. Phase work should therefore be read as roughly 30% stabilization/bug-fixing and 70% net-new feature build-out against the master spec.

The most serious concrete problems are not architectural but are correctness bugs with real institutional consequences: (a) essay questions are scored 0 and never regraded, silently deflating exam scores; (b) re-scoring a submission or granting a retake inserts a second `grades` row instead of replacing the first, permanently inflating/corrupting a learner's own average; (c) the exam anti-cheating signal is entirely client-supplied and trivially forgeable; (d) a hardcoded default learner password plus predictable login email is a real credential-guessing risk during the account lifecycle; (e) `npm run lint` itself is dead (references a `next lint` command removed in Next.js 16).

None of these require a rebuild. All are fixable with targeted, reviewable changes consistent with "preserve before replacing."

---

## 2. Current Stack

| Layer | Technology | Version (installed) |
|---|---|---|
| Framework | Next.js App Router (Turbopack) | 16.2.10 |
| UI | React / React DOM | 19.2.7 |
| Language | TypeScript (strict mode on) | 6.0.3 |
| Styling | Tailwind CSS | 4.3.2 |
| Validation | Zod | 4.4.3 |
| Auth + DB | Supabase Auth + Postgres (`@supabase/ssr`, `@supabase/supabase-js`) | 0.12.0 / 2.110.1 |
| Exports | `exceljs` (dynamically imported) | 4.4.0 |
| Lint | ESLint flat config, `eslint-config-next` (core-web-vitals + typescript) | 9.39.4 |
| Hosting target | Vercel + Cloudflare DNS (per `docs/DEPLOYMENT.md`) | — |

No unexpected or contradictory dependencies. No deprecated framework replacement is warranted — the master prompt's "preserve the existing stack" principle is fully satisfiable here.

---

## 3. Folder Structure

```
app/
  account/change-password, account/inactive        — account lifecycle pages
  actions/auth.ts                                    — sign-out action
  api/presence/heartbeat/route.ts                    — presence heartbeat endpoint
  learner/{dashboard,exams,grades,lessons,submissions}
  login/, signup/, signup/profile/
  portal/                                            — post-login role router
  teacher/{dashboard,exams,gradebook,learners,lessons,mastery,question-bank,sections,submissions}
components/
  dashboard/, gradebook/, lessons/, presence/, ExamIntegrityGuard.tsx, ExamTimer.tsx, EmptyState, etc.
lib/
  auth.ts, deped-export.ts, format.ts, gradebook.ts, learner-accounts.ts,
  lesson-blocks.ts, presence.ts, relations.ts, types.ts,
  supabase/{admin,browser,server}.ts
supabase/
  schema.sql, seed.sql, migrations/001–013
docs/
  DEPLOYMENT.md, ROADMAP.md, CLOUDFLARE_SUBDOMAIN.md, EIM_HUB_REHABILITATION_MASTER_PROMPT.md
middleware.ts, next.config.ts, eslint.config.mjs, tsconfig.json
```

**Out-of-scope / non-product directories flagged, not touched:**
- `__template_fix/` — untracked scratch scripts (`.cjs`) and an `.xlsx` backup, leftover from the "Fix corrupted DepEd class record template" commit (`f8b1cc8`). Not part of the Next.js app; it is the source of 8 of 10 ESLint errors found (see §17). Recommend deletion or moving outside the repo in Phase 2, pending your confirmation — not deleted in this phase.
- `.agents/`, `.codex-artifacts/` — tooling directories, not app code, not reviewed in depth.
- `.claude/settings.json` — already encodes a sensible permission policy: allows most read-only commands, gates edits to `lib/supabase/**`, `app/api/**`, `supabase/migrations/**`, `middleware.ts`/`proxy.ts` behind confirmation, and denies access to `.env*`, secrets, private-data, and backup paths. This aligns with the master prompt's safety rules and needs no change.

---

## 4. Current Routes

27 dynamic (server-rendered) + 3 static routes, confirmed by a successful production build. Full table:

| Route | Type | Role |
|---|---|---|
| `/` | Server Component | public |
| `/login` | Server Component + Server Action | public |
| `/signup`, `/signup/profile` | Server Component + Server Action | public (creates learner) |
| `/portal` | Server Component | any authenticated (role router) |
| `/account/change-password` | Server Component + Server Action | learner (forced password change) |
| `/account/inactive` | Server Component | any authenticated (suspended/deleted notice) |
| `/api/presence/heartbeat` | Route Handler (POST) | any authenticated |
| `/learner/dashboard` | Server Component | learner |
| `/learner/lessons`, `/learner/lessons/[id]` | Server Component | learner (+ teacher preview) |
| `/learner/exams`, `/learner/exams/[id]` | Server Component + Server Action | learner |
| `/learner/submissions` | Server Component + Server Action | learner |
| `/learner/grades` | Server Component | learner |
| `/teacher/dashboard` | Server Component | teacher/admin |
| `/teacher/lessons`, `/teacher/lessons/[id]/studio` | Server Component + Server Action | teacher |
| `/teacher/exams`, `/teacher/exams/[id]/builder`, `/teacher/exams/[id]/analysis` | Server Component + Server Action | teacher |
| `/teacher/question-bank` | Server Component + Server Action + Client Component | teacher |
| `/teacher/sections` | Server Component + Server Action + Client Component | teacher |
| `/teacher/learners`, `/teacher/learners/[id]` | Server Component + Server Action + Client Component | teacher |
| `/teacher/submissions` | Server Component + Server Action | teacher |
| `/teacher/gradebook` | Server Component + Server Action | teacher |
| `/teacher/mastery` | Server Component | teacher |

No `/admin/*` route tree exists (see §5).

---

## 5. Existing Roles

The database enum `user_role` supports `learner | teacher | admin`, but **only two roles are functionally distinct**: `learner` and `admin`/`teacher` are gated by the same `requireTeacher()` check everywhere (`lib/auth.ts:126-134`) — `admin` is a cosmetic label with no distinct route, page, or permission. The master prompt's four-role model (Super Administrator, School Administrator, Teacher, Learner — §7 of the master prompt) does not exist yet; this is a **feature gap**, not a bug, and is the single largest structural difference between current state and target state.

---

## 6. Current Database Model

19 tables, all with Row-Level Security enabled (schema.sql + 13 migrations, applied in order — `schema.sql` alone is stale/incomplete and must not be read in isolation):

`sections`, `profiles`, `competencies`, `lessons`, `lesson_resources`, `question_bank`, `exams`, `exam_questions`, `exam_attempts`, `exam_answers`, `assignments`, `submissions`, `grades`, `announcements`, `activity_logs`, `lesson_blocks`, `gradebook_assessments`, `gradebook_scores`, `exam_retake_grants`, plus one security view `exam_question_public`.

Enums: `user_role`, `question_type`, `exam_status`, `submission_status`, `grade_component`, `difficulty_level` — defined once in `schema.sql`, never altered.

None of the master-prompt's proposed target tables for units/lesson-progress/rubrics/projects/achievements/notifications/audit-logs/incidents/support-requests exist yet (see §20).

---

## 7. Current Data Flows

- **Auth:** Supabase Auth (email+password) → `middleware.ts` gates protected prefixes on session presence only → `/portal` reads `profiles.role`/`status`/`must_change_password` and routes to the correct dashboard.
- **Lesson authoring → reading:** Teacher builds `lesson_blocks` in Studio → publish flag flips → learner list/detail pages filter `published = true` (RLS-backed) and render blocks via `LessonBlockRenderer`.
- **Exam:** Teacher builds from `question_bank` into `exam_questions` → learner starts an `exam_attempts` row → answers autosave into `exam_answers` → submit scores MC/T-F/identification server-side, essays as 0 → a `grades` row is inserted.
- **Output submission:** Learner posts to `submissions` (own `learner_id`) → teacher scores → a `grades` row is inserted (always inserted, never upserted — see §9).
- **Gradebook:** Fully parallel, manually re-entered by the teacher into `gradebook_assessments`/`gradebook_scores` — does not read from `grades`, `exam_attempts`, or `submissions` at all (see §9).
- **Presence:** Client heartbeat every 60s → own `profiles.last_seen_at` → teacher views derive online/away/offline badges.

---

## 8. Working Features

Verified by reading the code (not just README claims):

- Supabase Auth login/logout, LRN-based learner login identifiers, role-based post-login routing.
- Lesson Studio: block-based CRUD, 19 content-block types, publish/unpublish, iframe-embed sanitization.
- Lesson reading with objective/safety/activity grouping and a legacy markdown fallback.
- Question bank: CRUD, search/filter, Excel/CSV bulk import with row validation.
- Exam builder: add/remove/reorder questions, per-question point overrides, published-state gating.
- Exam taking: randomization, server-side timer grace period, autosave-style answer capture, auto-scoring of objective question types.
- Output submissions: learner submit (text/link), teacher score + feedback.
- Item analysis / mastery report: per-question and per-competency/section aggregates.
- Term Gradebook: DepEd-formula grade computation, Excel export, and an official DepEd class-record template export — both genuinely functional.
- Sections and learner account management: CRUD, soft-deactivate, credential issuance.
- Exam anti-cheating (client-side): tab-switch/copy/paste/right-click detection with configurable violation threshold and auto-submit.
- Presence heartbeat driving online/away/offline badges on the teacher's learner profile view.

---

## 9. Broken Features

Classified by severity (Critical/High/Medium/Low):

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | Essay questions are always scored 0 at submit time; item analysis excludes them; no teacher UI exists anywhere to regrade an essay answer after the fact. Points are counted toward the exam's ceiling but never awarded. | `app/learner/exams/actions.ts:122-124` | **Critical** |
| 2 | Re-scoring a submission always `insert`s a new `grades` row instead of updating the existing one for that `(source_type, source_id)` — a teacher correcting a score doubles the learner's counted grade. | `app/teacher/submissions/actions.ts:22-30` | **Critical** |
| 3 | Granting an exam retake leaves the original `submitted` attempt and its `grades` row in place, then a second attempt/`grades` row is added on resubmission. Both attempts remain counted forever in mastery reports, item analysis, and the learner's own average. | `app/teacher/learners/actions.ts` (`grantExamRetakeAction`), `app/learner/exams/[id]/page.tsx:74-91`, `app/learner/exams/actions.ts:161-169` | **Critical** |
| 4 | Anti-cheating `violation_count`/`termination_reason` are read directly from client `FormData` with no server-side cross-check — a forged/replayed POST bypasses the guard entirely. | `app/learner/exams/actions.ts:145-157` | **High** |
| 5 | `scoreSubmissionAction` trusts a hidden-field `learner_id` and writes it into `grades` without re-deriving it from the submission row — a forged form post (or a UI bug) can attribute one learner's score to a different learner. | `app/teacher/submissions/actions.ts:8-9,23` | **High** |
| 6 | `requireTeacher()` never checks `profile.status` or `must_change_password` — a deactivated teacher/admin account (schema supports it; no UI creates it yet) retains full write access to all content. | `lib/auth.ts:126-134` | **High** |
| 7 | `app/learner/lessons/[id]/page.tsx` uses `getCurrentUserAndProfile()` instead of `requireLearner()` and never checks `status` — a deactivated learner can still open a lesson directly by URL even though every other learner page correctly bounces them to `/account/inactive`. | `app/learner/lessons/[id]/page.tsx:107-125` | **High** |
| 8 | Hardcoded shared default learner password (`"eimnc2password"`) combined with a predictable login email pattern (`${lrn}@eimnc2.local`), and `login/actions.ts` performs no `status`/`must_change_password` gate at authentication time — the credential works immediately, before forced change. | `app/teacher/learners/actions.ts:37`, `lib/learner-accounts.ts` | **High** |
| 9 | Gradebook toolbar "Export to Excel" and "Print" buttons have `// TODO` comments and no `onClick` handler at all — dead, visibly broken UI sitting next to a working export button. | `components/gradebook/GradebookToolbar.tsx:88-97` | **High** |
| 10 | `npm run lint` is dead — invokes `next lint`, a subcommand removed in Next.js 16; the script silently fails/misparses instead of linting. | `package.json` (`"lint": "next lint"`) | **Medium** |
| 11 | Empty submissions are accepted — neither `file_url` nor `content_text` is required, client- or server-side. | `app/learner/submissions/page.tsx:44-50`, `actions.ts:9-22` | **Medium** |
| 12 | Race condition: concurrent GETs on the exam page can create two `in_progress` attempt rows for the same learner/exam (no unique constraint). | `app/learner/exams/[id]/page.tsx:70-91` | **Medium** |
| 13 | "Delete learner" only flips `status = "deleted"` (fully reversible via "Activate"), but the confirm dialog says "cannot be undone" — inaccurate, unnecessarily alarming copy. | `app/teacher/learners/LearnersManagementClient.tsx:452-455`, `ProfileDangerActions.tsx:30-35` | **Low** |
| 14 | `lesson_blocks.video_url`/`resource_url`/`resource_title`/`resource_type` columns (migrations 003/011) are never read or written anywhere — dead schema. | `supabase/migrations/011_expand_lesson_blocks.sql:5-9` | **Low** |
| 15 | Unreachable `"powerpoint"` blockType branch (not a member of the type). | `components/lessons/EmbeddedResourceViewer.tsx:19` | **Low** |
| 16 | 2 real ESLint errors (not counting `__template_fix/`): `Date.now()` called during render (`react-hooks/purity`), and synchronous `setState` inside `useEffect` in two components (`react-hooks/set-state-in-effect`). | `app/learner/exams/[id]/page.tsx:94`, `LearnersManagementClient.tsx:356`, `ExamIntegrityGuard.tsx:39` | **Medium** |
| 17 | `middleware.ts` uses a convention Next.js 16 has deprecated in favor of `proxy.ts` (build-time warning only, not yet breaking). | `middleware.ts` | **Low** |

---

## 10. Duplicate Features

- **Two parallel, disconnected grading systems**: the learner-facing `grades` table (auto-populated by exam/submission actions) vs. the teacher's official DepEd Term Gradebook (`gradebook_assessments`/`gradebook_scores`, 100% manually re-typed). A teacher must copy every score twice. **High** — structural product gap, not just duplicate code.
- **Three independent Modal implementations** (`QuestionBankClient.tsx`, `SectionsManagementClient.tsx`, `LearnersManagementClient.tsx`) — only one has correct dialog a11y semantics. **Medium.**
- **Duplicated destructive-confirm forms**, **duplicated status/online badge color helpers**, and an **inline flash-message pattern repeated on ~9 pages** instead of shared components. **Medium/Low.**
- **`computeTermGrade`/`computeTermGradeDetail`** near-duplicated server-side, and the same per-category math re-implemented a third time client-side in `TermGradebookMatrix.tsx`. **Low.**
- **`exams.show_score_after_submit`** superseded by but kept in parallel with **`show_result_after_submit`**, manually synced by app code on every write. **Low.**
- **`profiles.middle_initial`** vs. **`profiles.middle_name`** — overlapping, both actively used; an initial is derivable from the name. **Low.**

---

## 11. Security Risks

| # | Risk | Severity |
|---|---|---|
| 1 | Client-forgeable anti-cheating signal (§9.4) | High |
| 2 | Unverified `learner_id` trusted on grade write (§9.5) | High |
| 3 | No status/suspension enforcement for teacher/admin accounts (§9.6) | High |
| 4 | Deactivated learner can still read lesson content directly by URL (§9.7) | High |
| 5 | Shared default password + predictable login email + no login-time status gate (§9.8) | High |
| 6 | No per-teacher ownership scoping on any teacher mutation (exams, lessons, question bank, sections, gradebook) — every teacher account is a co-admin over all school content. Confirmed by design, not a specific exploit, but should be an explicit decision, not an accident, especially once the school scales past one teacher. | Medium |
| 7 | No rate limiting or failed-login lockout visible anywhere in the auth flow. | Medium |
| 8 | 4 moderate (no high/critical) transitive `npm audit` findings: `postcss` (via Next's vendored copy) and `uuid` (via `exceljs`) — both would require a breaking forced downgrade to "fix" today; better resolved by upstream patch releases. | Low |
| 9 | Confirmed **good**: the Supabase service-role/admin client (`lib/supabase/admin.ts`) is only ever imported in two server-action files, both `"use server"`, and the key is never referenced anywhere else in the repo — it does not reach the browser bundle. | — (control, not a risk) |
| 10 | Confirmed **good**: `next.config.ts` already sets a solid security-header baseline (X-Frame-Options: DENY, nosniff, Referrer-Policy, HSTS w/ preload, Permissions-Policy). | — (control, not a risk) |

---

## 12. Privacy Risks

- `supabase/seed.sql` could not be inspected under this session's sandbox permissions (access denied at the tool layer, separate from the audit's own precaution). **This must be manually verified by someone with direct filesystem access** before Phase 2 — confirm it contains only synthetic placeholder data, per master-prompt rule "Do not use real learner records as development seed data."
- No Supabase Storage buckets or bucket-level RLS policies exist anywhere in tracked schema/migrations. `submissions.file_url` and `lesson_blocks.image_url`/`video_url` are plain text URL columns — if any of these currently point at Storage objects, that access-control layer is undocumented/unmanaged in version control and should be located and reviewed before any Storage-based feature (e.g. Phase 5 richer uploads) is built.
- No public grade rankings, no cross-learner data exposure found in any RLS policy or query reviewed — this matches master-prompt requirements well today.
- Raw Postgres error messages are piped straight into user-facing flash messages across nearly every teacher action (e.g. `app/teacher/exams/actions.ts`) — a constraint violation could leak internal schema details (table/column names) to a teacher; low sensitivity but worth cleaning up under "do not expose stack traces / SQL errors."

---

## 13. RLS Risks

- **No table is missing RLS.** All 19 tables have RLS enabled with at least one policy (§6 detail was independently verified against every migration in order).
- **`lesson_blocks` read policy gap**: its sole select policy checks only `is_active = true` and never joins back to the parent `lessons.published` flag. Blocks belonging to an unpublished/draft lesson are readable by any authenticated user (including learners) as long as the block itself is active — inconsistent with `lessons`' own "published or teacher" policy. **Medium**, should be closed in Phase 2/3.
- **`exam_retake_grants`** has no partial-unique constraint preventing multiple simultaneous unused grants for the same `(exam_id, learner_id)` — an RLS-adjacent data-integrity gap, not a leak.
- **No DB-level unique constraint on `profiles.lrn` or `profiles.email`** — only non-unique indexes. A Learner Reference Number should be enforceably unique.
- **`profiles.grade_level` type drift**: created as `int` (migration 002); three later migrations (005/006/007) each try to `add column if not exists grade_level text` — all no-ops since the column already exists as `int`. Application code writes/reads it as a string, relying on implicit Postgres coercion, which will throw at runtime for any non-numeric value. **Medium**, worth a proper migration to resolve the type ambiguity.
- Everything else in §6/§9/§10 of the underlying DB-audit sub-report (missing indexes on several FK columns, free-text status columns without CHECK constraints, `exam_attempts.status` unconstrained) are data-integrity/performance items, not RLS/access-control leaks — captured under §17 Performance and the backlog below.

---

## 14. UX Issues

- Dead Export/Print buttons in the gradebook toolbar (§9.9) — the most visible "looks broken" issue in the app.
- Inaccurate "cannot be undone" copy on a fully reversible soft-delete (§9.13).
- Same banner styling used for both success and error messages on most pages — a teacher can't visually distinguish "Exam created." from an error without reading the text.
- Raw Postgres errors surfaced as user copy (§12).
- Dev-internal phrasing ("For the MVP version...") leaking into learner-facing copy on `app/learner/exams/page.tsx:21`.
- Empty states are otherwise handled well and consistently (`EmptyState` component) — a genuine existing strength to preserve.

---

## 15. Mobile Issues

- Term Gradebook matrix and `TermSummaryTable` are desktop-only by design: fixed pixel column widths, `overflow-x-auto` as the only mobile accommodation, sub-11px text. Functionally acceptable for an official DepEd class-record replica used mainly on desktop, but should be explicitly labeled as such rather than silently degrading on phones.
- Question Bank, Learners, and Sections management tables all use `min-w-[940–980px]` inside `overflow-x-auto` with no stacked/card alternative for small screens.
- Exam-taking page and the landing page are both genuinely responsive — good existing patterns to reuse.

---

## 16. Accessibility Issues

- Two of three Modal implementations have no dialog semantics at all (no `role="dialog"`, `aria-modal`, focus trap, or Escape handling) — `SectionsManagementClient.tsx`, `LearnersManagementClient.tsx`. **Medium-High.**
- Gradebook "over-HPS" warning cell is color-only (no text/icon indicator).
- 10–11px text throughout the gradebook matrix, below common 12px minimum-readable guidance.
- Learners-table "⋯" action menu lacks `role="menu"`/keyboard arrow navigation/focus return.
- Positive patterns already in place worth using as the house style going forward: Question Bank's `sr-only` labels + real `<select>`/`<input>` elements, `alt_text` correctly sourced for lesson images, exam timer using `role="timer" aria-live="polite"`.

---

## 17. Performance Issues

- Unbounded, unpaginated fetches with no date/status filtering: `app/teacher/submissions/page.tsx`, `app/teacher/mastery/page.tsx` (fetches all `exam_attempts` school-wide on every render), `app/teacher/exams/[id]/analysis/page.tsx`.
- No `loading.tsx`/Suspense fallback found anywhere — combined with the above, a slow query renders a fully blank page.
- Several FK columns lack supporting indexes (`submissions.assignment_id`, `exams.competency_id`/`created_by`, `assignments.lesson_id`, `activity_logs.actor_id`/`created_at`, others — full list in the underlying DB sub-report).
- Presence heartbeat fires every 60s per open tab with no visibility-based throttling (minor).
- Positive: `exceljs` is dynamically imported only where needed; nearly every page is a Server Component with narrowly-scoped client islands — this is a good existing pattern, keep it.

---

## 18. Reusable Components

Worth promoting/centralizing in Phase 2 rather than rebuilding:
- `EmptyState` (already consistent and good).
- `ExamTimer` (good `aria-live` pattern).
- Question Bank's Modal and filter-label pattern (best of the three Modal implementations — should become the one shared `<Modal>`).
- `GradebookExportButton` / `DepedClassRecordExportButton` (genuinely functional Excel/PDF export logic, reusable for future report exports per master-prompt §30).
- `LessonBlockRenderer` (extensible block-type system, good foundation for the master prompt's richer module-authoring requirements in §10).

---

## 19. Refactoring Candidates

- Unify the three Modal implementations into one shared, accessible `<Modal>` component.
- Extract the repeated `searchParams.message` banner pattern into one `<FlashMessage>` component with distinct success/error styling.
- Extract `statusBadgeClass`/`onlineBadgeClass` helpers into a shared module instead of duplicating per-page.
- Fix `profiles.grade_level` type ambiguity with one authoritative migration (decide int vs. text, migrate cleanly, update all call sites).
- Add a server-side authoritative event-based anti-cheating log rather than a single client-supplied aggregate.
- Consolidate `grades` writes to `upsert` on `(learner_id, source_type, source_id)` instead of blind `insert`.

---

## 20. Feature Gap Analysis (current app vs. master-prompt target)

The master prompt (Sections 7–21) describes a substantially larger target system. Confirmed **not present today**:

- Super Administrator / School Administrator roles and all associated pages (user management, academic-year/term management, audit logs, storage monitoring, system settings).
- Academic Year / Term / Grade Level / Unit / Competency-as-hierarchy-node structure (competencies exist as a flat tag today, not a hierarchy level).
- Projects, milestones, group submissions, achievements, notifications, announcements-as-a-first-class-feature (an `announcements` table exists but no UI was found consuming it in the reviewed routes).
- Assessment Integrity Monitoring Dashboard with risk labels, incident timeline, and a resolution workflow (today: a single client-trusted violation count + reason string, no per-event log, no teacher review/resolution workflow).
- Rich question types beyond the current 4 (`question_type` enum currently supports far fewer than the master prompt's 13 listed types — matching/sequencing/numerical/practical-checklist etc. are not present).
- Reporting/export suite beyond the gradebook (class progress, missing-requirements, frequency-of-error, intervention, feedback-turnaround reports).
- Audit trail (`activity_logs` exists and is written to in a few places, but no dedicated audit-log viewer/report exists).
- PWA/offline support, resumable lesson reading, bookmarking, table-of-contents/reading-progress UI (module reader is currently a simpler grouped-block view, not the full "editorial reading experience" described in master-prompt §9).
- Rubric-based grading, criterion-level feedback, submission version history (current submissions model has no version history — a resubmission appears to overwrite rather than version, needs confirmation in Phase 5 planning).

This gap analysis should directly drive the Phase 4–9 scope in the master rehabilitation roadmap; Phase 1–3 (this audit, design system, and roles/RLS stabilization) do not require closing these gaps yet.

---

## 21. Prioritized Backlog

**Critical** (fix before or very early in Phase 2/3, correctness/integrity bugs with real institutional impact):
1. Essay questions never graded (§9.1)
2. Duplicate `grades` rows on re-score (§9.2)
3. Duplicate `grades`/attempt rows on retake (§9.3)

**High:**
4. Client-forgeable anti-cheating signal (§9.4)
5. Unverified `learner_id` on grade write (§9.5)
6. `requireTeacher()` ignores account status (§9.6)
7. Deactivated learner can still read lessons by URL (§9.7)
8. Shared default password / no login-time status gate (§9.8)
9. Dead gradebook Export/Print buttons (§9.9)
10. Two disconnected grading systems (§10)
11. Modal accessibility gaps (§16)
12. Unpaginated teacher-facing queries (§17)

**Medium:**
13. `npm run lint` script is dead (§9.10)
14. Empty submissions allowed (§9.11)
15. Exam-attempt race condition (§9.12)
16. `lesson_blocks` RLS doesn't respect parent `published` flag (§13)
17. `profiles.grade_level` type drift (§13)
18. Missing FK indexes (§17)
19. React purity/effect-timing ESLint errors (§9.16)
20. No per-teacher ownership scoping decision made explicit (§11.6)

**Low / Enhancement:**
21. Inaccurate "cannot be undone" copy (§9.13)
22. Dead `lesson_blocks` schema columns (§9.14)
23. Unreachable code branch (§9.15)
24. `middleware.ts` → `proxy.ts` migration (§9.17)
25. Raw Postgres errors as user copy (§12)
26. `__template_fix/` scratch directory cleanup (§3)
27. Full feature-gap backlog from §20 (belongs to Phases 4–9, not Phase 2/3)

---

## 22. Proposed Target Architecture

No framework, database, or hosting replacement is proposed or warranted. The existing Next.js App Router + Supabase architecture is fit for purpose and should be preserved per master-prompt principle #1 and §4. Proposed evolution, staged:

- **Phase 2 (Design System & Shell):** centralize design tokens (color/spacing/typography) and shared primitives (`Modal`, `FlashMessage`, badge helpers) without touching data logic.
- **Phase 3 (Roles & RLS hardening):** close the status/ownership gaps in §9.6/§9.7/§13 with non-destructive migrations; introduce the admin role distinction only if/when the school actually needs a second administrative tier (do not build unused role infrastructure speculatively).
- **Phase 4+ (per master-prompt phases 4–10):** build out the confirmed feature gaps in §20 incrementally, each phase independently testable and rollback-able.

---

## 23. Proposed Design Direction

Not yet started — reserved for Phase 2 per the master prompt's phase gating ("do not mix visual redesign and database restructuring in the same phase"). Recommend basing the Phase 2 design-system proposal on the reusable components already identified in §18 (Question Bank's Modal/filter pattern, `EmptyState`, `ExamTimer`) rather than introducing a new visual language from scratch, consistent with "preserve before replacing."

---

## 24. Exact Phase 2 Proposed Scope and Files

Pending your explicit approval. Proposed Phase 2 (Design System and Application Shell, per master-prompt §35) would touch only presentation-layer files — no data/auth logic:

- New: `components/ui/Modal.tsx` (accessible, replacing the 3 duplicated implementations)
- New: `components/ui/FlashMessage.tsx` (replacing the repeated inline banner pattern)
- New: `components/ui/badges.ts` or similar (centralizing `statusBadgeClass`/`onlineBadgeClass`)
- Modified: `app/globals.css` / Tailwind config (design tokens: color, spacing, radius, shadow, motion) — file name to be confirmed once Phase 2 is scoped in detail
- Modified (consumers only, swap in shared components, no logic change): `app/teacher/question-bank/QuestionBankClient.tsx`, `app/teacher/sections/SectionsManagementClient.tsx`, `app/teacher/learners/LearnersManagementClient.tsx`, `app/teacher/learners/[id]/ProfileDangerActions.tsx`, and the ~9 pages using the inline flash-message pattern

**This list is illustrative for approval purposes — it will be finalized with exact line-level detail at the start of Phase 2, per the master prompt's "Before Editing" workflow (§6).**

---

## 25. Exact Proposed Database Changes

None proposed or made in Phase 1 (audit only, no modification). If Phase 2/3 is approved, the following **non-destructive** migrations would be proposed first (each independently reviewable, each with a rollback):

1. Add `unique` constraint on `profiles.lrn` (after confirming no existing duplicates, following the same defensive pattern migration 008 used for `sections`).
2. Add a partial unique index on `exam_retake_grants (exam_id, learner_id) where used = false`.
3. Resolve `profiles.grade_level` type ambiguity (int vs. text) with an explicit, reviewed migration plus corresponding call-site updates.
4. Update the `lesson_blocks` select RLS policy to also require the parent lesson's `published = true` (or teacher/admin), closing the gap in §13.
5. Add a CHECK constraint or enum for `exam_attempts.status` and `profiles.status` to match their existing TypeScript-level contracts.

**None of these would run without your separate, explicit approval; this section documents what would be proposed, not what has been done.**

---

## 26. Testing Plan

Per master-prompt §6 "After Editing" workflow, to be applied from Phase 2 onward:
- `npm run typecheck` (currently clean) and a corrected `npm run lint` (once §9.10 is fixed) on every change.
- `npm run build` must remain green.
- Manual role-based testing: learner, teacher, and unauthorized/logged-out access to every route in §4, specifically re-testing the gaps in §9.6/§9.7 once fixed.
- Mobile (Android-class), tablet, and desktop viewport testing for any UI change.
- RLS re-verification: attempt cross-learner and cross-class access with a non-admin Supabase client for every table touched by a migration.
- Synthetic data only — **`supabase/seed.sql` must be manually confirmed synthetic before it is used as a testing fixture, per §12.**

---

## 27. Rollback Plan

- All Phase 1 work is read-only; there is nothing to roll back except this new document (`docs/PHASE_1_AUDIT.md`), which can simply be deleted or revised with no downstream impact.
- For Phase 2+ (once approved): every migration will be additive/non-destructive (new columns, new constraints validated against existing data, new indexes) so the rollback for each is a scoped `DROP` of the specific object added, never a restore-from-backup. Every code change will land as a small, separately revertible commit on a dedicated branch, per master-prompt §6 ("Create or recommend a dedicated Git branch").
- No deploy will occur without explicit instruction, per master-prompt §35 and this session's own constraints.

---

## Notes on Audit Limitations

- `supabase/seed.sql` was inaccessible under this session's tool permissions; its synthetic-vs-real status must be confirmed manually before any Phase 2/3 work treats it as a safe fixture.
- This audit did not (and per the master prompt's safety rules, should not) inspect `.env*` contents, Supabase project dashboard settings (e.g. email-confirmation requirements, rate-limiting config), or any Supabase Storage bucket policy that may exist outside version control — these should be confirmed directly by someone with dashboard access before Phase 3/5 work depends on them.
