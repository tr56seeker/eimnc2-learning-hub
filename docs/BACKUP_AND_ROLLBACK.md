# Backup and Rollback

This project has no automated backup job of its own — it relies on Supabase's built-in backups plus the practices below. Read this before running a migration against a production project, and before any Vercel deploy that a teacher or learner will actually depend on.

## 1. Database backups

**Free-tier Supabase projects do not include Point-in-Time Recovery (PITR) or automatic daily backups.** If this project is still on the free tier when real learner data goes in, you are responsible for taking backups yourself:

1. Supabase Dashboard → Project Settings → Database → **Backups** — check what your plan actually includes before assuming anything is automatic.
2. Manual backup via `pg_dump` (requires the Postgres connection string from Project Settings → Database → Connection string):
   ```bash
   pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" --schema=public --no-owner --no-privileges -f backup-$(date +%Y%m%d).sql
   ```
3. Store the dump somewhere outside Supabase (a private repo, encrypted cloud storage) — never commit it to this repo. It will contain real learner data once the school is using the system for real.
4. Take a manual backup:
   - Before running any migration against the production project.
   - Before any bulk operation (bulk enrollment, bulk account status change).
   - On a regular cadence once real data exists — weekly at minimum during a school term.

If the project is upgraded to a paid Supabase plan, enable PITR and daily backups in Database → Backups and this manual step becomes a supplement, not the only line of defense.

## 2. Rolling back a bad migration

All migrations in `supabase/migrations/` are written to be idempotent (`create table if not exists`, `drop policy if exists` before `create policy`, guarded `do $$ ... end $$` blocks) and additive — no migration drops a column or table without a guard. This means:

- **Re-running a migration is always safe.** If a migration partially applied because of an error partway through, you can usually just fix the SQL and run the same file again.
- **There is no separate "down" migration file for each "up" file.** Rolling back an additive change (a new table, a new column, a new policy) means manually writing and running the inverse SQL — there's deliberately no tooling that does this automatically, since an automatic destructive rollback is exactly the kind of thing that can delete real learner data by accident.

If a migration causes a problem after it's live:

1. **Don't panic-drop anything.** Confirm what's actually broken first — check the Supabase logs (Database → Logs) and, if it's an RLS issue, test the specific query as the affected role.
2. If the migration only added a column, table, index, or policy (this describes nearly every migration in this repo), the safest rollback is usually to leave the schema change in place and revert the application code that depends on it — the extra column/table sitting unused causes no harm.
3. If a policy change genuinely broke access for a role, write a new migration that restores the previous policy (via `drop policy if exists` + `create policy` with the old definition) rather than trying to hand-edit history. Migrations are additive on purpose — the fix is always the next migration, never editing an already-applied one.
4. If data was actually corrupted (not just a broken policy), restore from the most recent backup (§1) into a new Supabase project, verify it, then plan a cutover — don't restore over the live project without a tested copy first.

## 3. Rolling back a bad deploy

Vercel keeps every deployment. To roll back the running production deployment:

1. Vercel Dashboard → Project → Deployments.
2. Find the last known-good deployment.
3. Click the "..." menu → **Promote to Production**.

This reverts the app instantly without touching the database. Combine with §2 if the bad deploy also shipped a migration that needs its own follow-up.

## 4. What "rollback" does NOT cover

- Learner-entered data (submissions, exam attempts, grades) is never automatically rolled back by a code or schema rollback — those are separate concerns. A code rollback undoes what the app does; it does not undo what users have already done through it.
- `SUPABASE_SERVICE_ROLE_KEY` rotation: if this key is ever suspected to be exposed, rotate it immediately in Supabase (Project Settings → API) and update it in Vercel — this is not a "rollback," it's an incident response step, and it invalidates the old key immediately.
