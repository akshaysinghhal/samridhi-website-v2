# Samridhi Films & Television — Website

Dynamic website + admin panel. **Next.js 14** (public site + admin in one app),
**Supabase** (Postgres database + auth), **Cloudinary** (photo/video hosting),
deployed on **Vercel**.

## What's inside

| Area | URL | Notes |
|---|---|---|
| Public website | `/` | Hero, events, about, team, weddings preview, gallery (photos + videos), services, artists, steps, contact |
| Weddings page | `/weddings` | All weddings from admin, lightbox galleries |
| Artists page | `/artists` | Artist line-up from admin, booking process |
| Blog | `/blog`, `/blog/[slug]` | SEO meta per post, auto sitemap |
| Admin | `/admin` | Login-protected: dashboard, posts, gallery & videos, weddings, artists, media, page content |

### Admin capabilities
- **Blog posts**: title, auto slug, excerpt, Markdown body with live preview, cover image,
  photo gallery, YouTube video, status (draft/published), author.
- **SEO per post**: meta title + description with length meters, keywords, OG share image,
  live Google-result preview.
- **Gallery & Videos**: upload photos, paste YouTube URLs (thumbnail auto-picked) or upload video files —
  shown in the homepage Gallery's Photos/Videos tabs with a lightbox viewer.
- **Weddings**: title, location, date, description, cover + gallery uploads, **pin up to 10**
  to feature on the homepage; full listing on the `/weddings` page.
- **Artists**: name, category, photo, display order — shown on the homepage strip and `/artists` page.
- **Media library**: general-purpose uploads to Cloudinary.
- **Page content**: edit every headline, paragraph and contact detail on the site — including
  the Steps section and the Weddings/Artists page copy.

## Local development

```bash
cp .env.example .env   # fill in your keys
npm install
npm run dev            # http://localhost:3000
```

## Deploy

Follow **DEPLOY.md** — Supabase → Cloudinary → GitHub → Vercel (~30 min, all free tiers).

## Project structure

```
app/                  # pages & routes
  page.js             # home (reads page_content from Supabase, falls back to defaults)
  blog/               # blog index + [slug] posts
  admin/              # login, dashboard, posts editor, media, content editor
  api/
    admin/            # CRUD for posts / content / media (service-role, auth-checked)
    upload/           # file upload → Cloudinary → media table
    revalidate/       # on-demand cache refresh
lib/                  # supabase + cloudinary helpers, content defaults
supabase/schema.sql   # tables, RLS policies, seed content
public/images/        # site photography & brand assets
```
