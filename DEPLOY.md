# Deploy Guide — Samridhi Films & Television website

Everything is free on starter plans. Total time: ~30 minutes.

---

## Step 1 — Supabase (database + admin login)

1. Go to **https://supabase.com** → sign up → **New Project**.
   - Name: `samridhi-films`, pick a region near you (Mumbai / Singapore), set a database password (save it somewhere safe).
2. Wait ~2 minutes for the project to be ready.
3. Open **SQL Editor** → **New query** → paste the entire contents of `supabase/schema.sql` → **Run**.
   - This creates the `posts`, `page_content`, `media`, `gallery_items`, `weddings` and `artists` tables and seeds your default website text.
   - Already ran it before? Just run `supabase/migration-002.sql` instead — it adds only the new tables.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
5. Create your admin login: **Authentication → Users → Add user → Create new user**.
   - Email: your email. Password: choose one. ✅ Check **Auto Confirm User**.

## Step 2 — Cloudinary (photos & videos)

1. Go to **https://cloudinary.com** → **Sign up free**.
2. Open the **Dashboard** and copy:
   - `Cloud name` → `CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET` (keep secret!)

## Step 3 — Put the code on GitHub

1. Create a free account at **https://github.com** (if you don't have one).
2. Create a **new repository** called `samridhi-films-website` (public or private, either works).
3. Upload the contents of the `samridhi-site` folder to it (GitHub web → *Add file → Upload files*, or `git push`).

## Step 4 — Deploy on Vercel (free hosting)

1. Go to **https://vercel.com** → sign up with your GitHub account.
2. **Add New → Project** → import `samridhi-films-website`.
3. Before deploying, open **Environment Variables** and add all 8 values:

   | Name | Value (from) |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Step 1.4 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Step 1.4 |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Step 1.4 |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary Step 2 |
   | `CLOUDINARY_API_KEY` | Cloudinary Step 2 |
   | `CLOUDINARY_API_SECRET` | Cloudinary Step 2 |
   | `NEXT_PUBLIC_SITE_URL` | Your Vercel URL, e.g. `https://samridhi-films.vercel.app` |
   | `REVALIDATE_SECRET` | Any long random string you invent |

4. Press **Deploy**. In ~2 minutes your site is live at `https://<your-project>.vercel.app`.
5. After the first deploy, go back to **Settings → Environment Variables**, set `NEXT_PUBLIC_SITE_URL` to your exact Vercel URL, then **Deployments → Redeploy** (so SEO tags and sitemap use the right domain).

## Step 5 — Try the admin panel

1. Open `https://<your-project>.vercel.app/admin` → sign in with the user from Step 1.5.
2. **Blog Posts → New Post** → write, add a cover photo, fill the SEO fields, hit **Publish**.
3. Open your website — the post appears within about a minute. ✨

## How the "dynamic" part works

- Public pages re-check Supabase **at most once every 60 seconds** (`revalidate = 60`), so edits appear quickly without slowing the site.
- Every blog post gets its own URL (`/blog/your-slug`) with proper meta title, description, keywords and social-share image, and is added to `sitemap.xml` automatically.
- Only signed-in admins can add/edit/delete — the public can only read.

## Custom domain (optional, later)

Buy a domain (e.g. `samridhifilms.in`) → Vercel **Settings → Domains → Add** → follow the DNS instructions → update `NEXT_PUBLIC_SITE_URL` and redeploy.
