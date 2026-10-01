# Deployment Runbook — Samridhi Films & Television website (v3)

> **Deployment target (decided Sept 30, 2026):** this version deploys as a **separate**
> website — **new GitHub repo**, **new Vercel project** (new `*.vercel.app` domain), **new
> Supabase project** in the same accounts. The existing v1 site stays live and untouched.
> **Cloudinary: reuse the existing account** (same cloud name / key / secret).

Stack: **Next.js 14 (App Router, JavaScript)** · **Supabase** (Postgres + Auth) · **Cloudinary** (media) · **Vercel** (hosting).

## 0. Preconditions

- The v3 ZIP: `~/workspace/your_files/samridhi-site-v3.zip`.
- Same GitHub / Vercel / Supabase accounts as the v1 site.

## 1. New GitHub repo

1. github.com → **New repository** → name it `samridhi-website-v2` (Private is fine) → Create.
2. Unzip `samridhi-site-v3.zip` on your computer.
3. On the new repo page: **Add file → Upload files** → drag in all the extracted files → **Commit changes**.
4. The old repo stays exactly as it is — v1 keeps running.

## 2. New Supabase project (same account)

1. supabase.com dashboard → **New project** → name `samridhi-website-v2` → set a database
   password (save it somewhere) → region closest to India → Create. Wait ~2 minutes.
2. **SQL Editor → New query** — run these files **in order**, once each
   (copy the whole file contents, paste, Run):
   1. `supabase/schema.sql` (base tables)
   2. `supabase/migration-002.sql` (artists / gallery / weddings tables)
   3. `supabase/migration-003.sql` (all v3 tables, RLS, seed data)
   4. `supabase/migration-004.sql` (SEO slugs for international shows — run once;
      on an **existing** database that already ran 1–3, run only this file)
   5. `supabase/migration-005.sql` (billing: quotations, invoices, payments with
      receipt numbers, event checklists — run once; on an **existing** database,
      run only this file)
   6. `supabase/migration-006.sql` (About Us page content blocks — run once;
      on an **existing** database, run only this file)
3. Verify: `select count(*) from services;` → **8**. `select count(*) from site_settings;` → > 0.
4. **Project Settings → API** → copy: **Project URL**, **anon public key**, **service_role key**
   (service_role stays secret — only goes into Vercel env vars, never in code or chat).
5. **Authentication → Users → Add user → Create new user** → enter the admin email + a password.
   This is the login for `/admin` on the new site.

## 3. New Vercel project (same account)

1. vercel.com dashboard → **Add New → Project** → **Import** the `samridhi-website-v2` GitHub repo.
2. **Environment Variables** → add every variable below → **Deploy**.
3. Vercel gives you a new domain like `samridhi-website-v2.vercel.app`.
   (Optional: Project **Settings → General** → rename the project for a nicer domain.)
4. After the first deploy, set `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy
   (Vercel → Deployments → ⋯ → Redeploy) so the canonical URL is correct.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | NEW Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NEW anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | NEW service_role key |
| `NEXT_PUBLIC_SITE_URL` | NEW vercel.app domain (set after first deploy) |
| `CLOUDINARY_CLOUD_NAME` | same as v1 project (copy from old Vercel project's env vars) |
| `CLOUDINARY_API_KEY` | same as v1 project |
| `CLOUDINARY_API_SECRET` | same as v1 project |
| `REVALIDATE_SECRET` | new random string |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional — bot protection |
| `RESEND_API_KEY` / `LEAD_NOTIFY_EMAIL` | optional — lead email alerts |

To copy Cloudinary values: old Vercel project → Settings → Environment Variables → reveal and copy.

## 4. Post-deploy checks

1. Open the new domain — homepage renders with hero, services, artists band.
2. Submit a test lead at `/contact` → appears in `/admin` → **Leads** as **New**.
3. `/admin` → **Launch** shows the placeholder checklist.
4. `/sitemap.xml` loads; `robots.txt` shows `Disallow: /` (indexing stays off until you enable it).
5. Mobile: bottom Call/WhatsApp/Quote bar; cookie banner on first visit.

## 5. Media bulk import (the 50+ photos / 15 videos)

Handled separately: files are uploaded to the **existing Cloudinary account** (folder
`samridhi/press`, `samridhi/feedback`, …), then a ready-to-run **SQL file** with all the
`INSERT` statements is provided — paste it into the **new** Supabase project's SQL Editor once.
No secrets need to change hands: the upload uses a Cloudinary **unsigned upload preset**
you create in 4 clicks (dashboard → Settings → Upload → Upload presets → Add → Signing Mode:
**Unsigned**), and you only share the preset name.

## 6. Going live (custom domain, when ready)

1. Replace **all** placeholder content via admin (Launch checklist → 0 remaining).
2. Have the lawyer review the 4 legal pages (`/admin/legal`).
3. Add GA4 + Meta Pixel IDs in **Settings** (they load only after cookie consent).
4. Set the lead notification email in **Settings**.
5. Flip **SEO indexing ON** in Settings → verify `robots.txt` allows crawling.
6. Point the domain to the **new** Vercel project; update `NEXT_PUBLIC_SITE_URL` and redeploy.

## 7. Rollback

- Code: redeploy the previous Vercel deployment (one click in the Vercel dashboard).
- Data: admin edits are logged to `revisions` (before-snapshots) and `audit_log` — restore from there.
- The v1 site is fully independent — nothing here can break it.

## 8. Known limitations / follow-ups

- Admin access is a single admin gate (any authenticated Supabase user). Fine for a small team;
  per-user roles (`profiles` table) are a documented follow-up, not in this build.
- `artist-categories` has an API but no admin UI page yet — categories are chosen from a
  dropdown in the artist editor.
- Uploads go **directly from the browser to Cloudinary** (unsigned preset) — no
  serverless size limit, so large videos upload fine. The preset name is set in
  Admin → Integrations → Media uploads (or the `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  env var).
- See `docs/OPEN_ITEMS.md` for content-level open items (B Praak spelling, logo SVG, etc.).
