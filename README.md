# EIM NC II Learning Hub

A free-first LMS-lite starter for Electrical Installation and Maintenance NC II learners.

Production domain target:

```txt
eimnc2.tabunocnatlhs.com
```

## Core features included

- Learner and teacher login using Supabase Auth
- Role-based dashboard structure
- Competency-based lessons
- Exam list and auto-scored quiz submission
- Learner output submission using text and external file/video links
- Learner grades dashboard
- Teacher dashboard, submissions checking view, and gradebook view
- Supabase SQL schema, RLS policies, and sample seed data
- Mobile-first Tailwind interface

## Free stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Vercel hosting
- Cloudflare DNS for the custom subdomain

## Setup overview

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy `.env.example` to `.env.local` and add Supabase keys.
6. Run the app locally.

```bash
npm install
npm run dev
```

7. Deploy to Vercel.
8. Add the custom domain `eimnc2.tabunocnatlhs.com` in Vercel.
9. Add the required CNAME record in Cloudflare.

See `docs/DEPLOYMENT.md` and `docs/CLOUDFLARE_SUBDOMAIN.md`.

## First teacher account

Supabase Auth users cannot be safely inserted using the public anon key. Create your teacher account through the app sign-up page or Supabase Authentication dashboard, then run this SQL after the user exists:

```sql
update public.profiles
set role = 'teacher', full_name = 'RICHIE RYAN C. MABUNAY'
where id = 'PASTE_AUTH_USER_ID_HERE';
```

## Recommended next upgrades

- Question import from Excel/CSV
- Rubric-based performance task checker
- Item analysis and mastery level report
- Section-based grade exports
- PWA/offline lesson caching
- Supabase Storage for small attachments only
- Google Drive links for large outputs/videos
