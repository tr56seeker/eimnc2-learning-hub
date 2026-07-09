# Deployment Guide: eimnc2.tabunocnatlhs.com

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
4. Run `supabase/seed.sql`.
5. Go to Project Settings → API.
6. Copy:
   - Project URL
   - Anon public key
7. Paste them into `.env.local`.

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
