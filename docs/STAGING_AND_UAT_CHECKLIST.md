# Staging Deployment and UAT Checklist

Run through this before pointing production at real learner data. This is a checklist to execute manually against a real Supabase + Vercel project — nothing here runs itself.

## 1. Set up a staging project

Staging must be a **separate Supabase project** from production, not a schema or branch inside the same one — RLS mistakes, bad test data, or a bad migration during UAT should never be able to touch real learner records.

1. Create a second Supabase project (`eimnc2-staging` or similar).
2. Follow `DEPLOYMENT.md` §2 against it: run `schema.sql`, then every file in `supabase/migrations/` in order, then `seed.sql` for realistic-but-synthetic test data. **Never use real learner names or records here** — see the master prompt's rule against real data as dev/test seed data.
3. Create a second Vercel project (or a Vercel Preview deployment pointed at a `staging` branch) with its own env vars (`DEPLOYMENT.md` §0) pointing at the staging Supabase project — never share credentials between staging and production.

## 2. Migration validation (run once per new migration, on staging first)

1. Apply the migration to staging via the SQL Editor.
2. Confirm it applied without error.
3. Re-run the same migration a second time — it should succeed silently (idempotency check) or clearly no-op.
4. Spot-check the affected table(s)/policies with a read as each affected role (learner, teacher, admin) before promoting the same migration to production.

## 3. Role-access / RLS testing

For each role (learner, teacher, admin), while signed in as a real staging account of that role:

- [ ] Can only see their own submissions, attempts, grades, feedback, achievements, notifications (learner).
- [ ] Can only see assigned classes/sections (teacher) — confirm a teacher NOT assigned to a section cannot see its learners' data.
- [ ] Cannot reach another learner's profile, grades, or submissions by guessing a URL/ID.
- [ ] Admin-only routes (`/teacher/admin/*`) redirect non-admins.
- [ ] A suspended/deleted test account cannot sign in at all (Phase 10 login-hardening gate).
- [ ] 5 failed logins in a row on the same identifier trigger the lockout message; wait 15 minutes (or manually clear via `select public.clear_login_attempts('...')` in the SQL editor) and confirm it clears.

## 4. Storage-policy testing

**Not applicable currently** — this app has no file-upload layer; submissions are link-based (see `DEPLOYMENT.md` §7). Revisit this section only if real Supabase Storage uploads are added later.

## 5. Functional walkthrough (one pass per role)

- [ ] Teacher: publish a lesson, create an activity with an expected filename pattern, create a quiz, grade a submission, review an integrity incident, run each report in `/teacher/reports`, export one report as CSV.
- [ ] Learner: read a lesson to completion, submit an activity (confirm the expected filename shows correctly), take a timed quiz (kill the connection mid-attempt and confirm the answer autosaves/resumes), view grades/achievements/projects.
- [ ] Admin: create a teacher account, create an academic year/term, view the audit log, confirm the actions above actually appear in it.

## 6. Mobile / device testing

- [ ] Android phone, real device if possible (not just browser dev tools) — Chrome.
- [ ] Tablet — check gradebook/report tables don't force horizontal scrolling on essential columns.
- [ ] Slow/throttled connection (Chrome DevTools → Network → Slow 4G) — confirm loading states appear and nothing silently fails.
- [ ] Simulate a mid-quiz disconnect (DevTools → Network → Offline) — confirm the "connection interrupted" messaging appears and answers are preserved on reconnect.

## 7. Accessibility spot-check

No automated a11y tooling is wired into this repo yet (no axe/Lighthouse CI). Manually check the pages touched by the current change with:

- [ ] Keyboard only (Tab/Shift+Tab/Enter/Space) — can you complete the primary flow without a mouse?
- [ ] Browser zoom to 200% — does anything overlap or get cut off?
- [ ] A screen reader pass (NVDA on Windows, or VoiceOver) on at least the login page, one dashboard, and one form.

## 8. Performance sanity check

- [ ] `npm run build` completes without warnings about oversized bundles.
- [ ] Reports/list pages (`/teacher/submissions`, `/teacher/learners`, `/teacher/question-bank`, `/teacher/admin/audit-logs`) load in a reasonable time with staging's seeded data volume.

## 9. Go/no-go for production rollout

Only proceed to production once every checked box above is actually checked, AND:

- [ ] A fresh backup of the current production database exists (`BACKUP_AND_ROLLBACK.md` §1) if production already has real data.
- [ ] Whoever is deploying knows the rollback procedure (`BACKUP_AND_ROLLBACK.md` §3) without needing to look it up mid-incident.
- [ ] The school/stakeholder who requested the change has actually seen and approved it — UAT means a real user tried it, not just that the code compiles.

Production rollout itself (pushing the Vercel env vars live, running the migration against the production Supabase project) is a deliberate, manual, confirmed action — never automatic, and never done without a fresh backup in hand.
