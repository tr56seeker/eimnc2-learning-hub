# Deployment Guide: eimnc2.tabunocnatlhs.com

## 0. Environment variables

| Variable | Where it's used | Public? | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `app/layout.tsx` | Yes | Canonical site URL, used for metadata only. |
| `NEXT_PUBLIC_SUPABASE_URL` | `middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/supabase/admin.ts` | Yes | Safe to expose — it's just the project's API endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/browser.ts` | Yes | Safe to expose — Row-Level Security is what actually protects data, not this key. |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` only | **No — server-only** | Bypasses RLS entirely. Required for account creation/deactivation (`app/teacher/admin/teachers/actions.ts`, `app/teacher/learners/actions.ts`), exam grading that needs to write across learners (`app/learner/exams/actions.ts`), and scheduled lesson publishing (`lib/lesson-scheduling.ts`). Must never be prefixed `NEXT_PUBLIC_` and must never be read from client code — if a change ever needs it in a `"use client"` file, that's a sign the logic belongs in a server action instead. |

Set all four in Vercel (see §4) and in `.env.local` for local dev. Never commit a real `.env.local` — `.gitignore` already excludes `.env*.local`.

## 1. Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## 2. Supabase setup

1. Create a free Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.
4. Run every file in `supabase/migrations/` in order (001 through the highest number present) — the base schema alone is missing everything added since. This repo's working pattern is to run migrations manually in the SQL Editor, one at a time, and confirm each succeeds before running the next.
5. Run `supabase/seed.sql` (development/demo data only — see §2 note below; skip on a real production project).
6. Go to Project Settings → API.
7. Copy:
   - Project URL
   - Anon public key
   - `service_role` secret key (Project Settings → API → Project API keys — keep this out of anything client-facing; see §0)
8. Paste them into `.env.local`.

## 3. Authentication settings

For easier classroom use during pilot testing:

- Supabase → Authentication → Providers → Email
- Enable Email provider
- During testing, you may disable email confirmation.

For actual learner data, use stronger rules:

- Use strong passwords
- Avoid public grade exposure
- Give teacher/admin role manually
- Collect minimum necessary learner information

## 4. Vercel deployment

1. Push the project to GitHub.
2. Import the GitHub repository into Vercel.
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SITE_URL=https://eimnc2.tabunocnatlhs.com`
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...` — add this one for every environment (Production, Preview, Development) it needs to run in, but double-check it's never added with a `NEXT_PUBLIC_` name.
4. Deploy.

## 5. Custom domain

In Vercel:

1. Project → Settings → Domains
2. Add `eimnc2.tabunocnatlhs.com`
3. Copy the DNS instruction shown by Vercel.
4. Add the DNS record in Cloudflare.

Usually, this is a CNAME record:

```txt
Type: CNAME
Name: eimnc2
Target: cname.vercel-dns.com or the specific target shown by Vercel
Proxy: DNS only during verification
```

After verification, you may leave it as DNS only for easiest troubleshooting.

## 6. Related documentation

- [`BACKUP_AND_ROLLBACK.md`](./BACKUP_AND_ROLLBACK.md) — how to back up the database, and how to roll back a bad migration or a bad deploy.
- [`STAGING_AND_UAT_CHECKLIST.md`](./STAGING_AND_UAT_CHECKLIST.md) — the pre-launch checklist to run through on a staging project before pointing production at real learner data.

## 7. Scope decisions worth knowing before you deploy

- **File uploads are link-based on purpose, not by accident.** Learners paste a Google Drive/YouTube/image link rather than uploading through Supabase Storage. This keeps the app inside Supabase's free-tier storage limits. Supabase Storage is entirely unused in this codebase — there is nothing to configure or secure there. If real in-app uploads are ever added, storage bucket RLS policies mirroring each parent table's access rules would need to be designed from scratch at that time.
- **Two hardcoded default passwords exist** (`eimnc2password` for learners, `eimnc2teacher` for teacher/admin accounts created through the admin UI) — both force `must_change_password` on first login. This is a known, accepted tradeoff for a small-school pilot with predictable enrollment; if the school ever needs a stronger onboarding flow (e.g. random per-account temp passwords communicated out-of-band), that's a deliberate follow-up, not a bug.
