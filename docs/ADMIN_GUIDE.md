# Samridhi Films & Television — Admin Guide

The admin panel lives at **`/admin`** on your website (e.g. `https://samridhi-films-television.vercel.app/admin`).
Log in with the email + password you created in Supabase. Everything you save goes live within about a minute.

> **Golden rule:** rows marked **PLACEHOLDER** are temporary stand-ins. Replace them with real
> content, then check **Launch → Launch Checklist** — it shows exactly what is still placeholder.
> Keep **Settings → SEO indexing OFF** until every placeholder is replaced.

---

## 1. Dashboard (`/admin`)

- **New leads today** and a pipeline summary — click through to the Leads CRM.
- **Placeholders remaining** — your to-do list before launch.
- Quick links to every module.

## 2. Leads — your mini CRM (`/admin/leads`)

Every quote request, artist booking enquiry, wedding enquiry and contact message lands here.

- **Filter** by status (New / Contacted / Quote Sent / Negotiation / Won / Lost) or search by name/phone.
- Open a lead to see everything the visitor typed, which page they came from, and their UTM source.
- **Advance the status** as you work the lead. Use **Assign to** to note who owns it.
- **Notes + follow-up date** — internal only, never shown on the website.
- One-click **Call**, **WhatsApp**, **Email** buttons.
- **Spam toggle** hides junk without deleting it. **Export CSV** downloads the list for Excel.
- Duplicate phone numbers are highlighted so you don't double-contact someone.

## 3. Homepage (`/admin/homepage`)

- **Hero video / poster / mobile video** — paste a Cloudinary or MP4 URL. If no video, the poster image (or the colourful gradient) shows.
- **Headline, sub-headline, CTA buttons** — via the page-content editor on the same screen.
- **Stats band** — edit the numbers (e.g. *Since 1999*, *1000+ Events*). Keep the three claims separate exactly as worded.
- **Couple Stories heading**, and **section visibility toggles** to hide any homepage section.

## 4. Couple Stories — video testimonials (`/admin/couple-stories`)

1. **Upload a thumbnail** image.
2. Choose the **video source**: Cloudinary (recommended — paste the public ID or URL), YouTube (paste the video ID or full URL), Vimeo, or a direct MP4 link.
3. Fill **couple names**, a title, and optionally link it to a portfolio event.
4. ✅ **Tick "Consent granted"** — the story **cannot be published** until you do. This protects you legally.
5. Tick **Featured on home** to show it on the homepage (max 4 — you'll see a warning).

## 5. Portfolio — events (`/admin/portfolio`)

One entry per event: title, client, location, date, **category** (Government, Corporate, Weddings,
Destination Weddings, Celebrity Shows, Cultural Programs, Brand Promotions, International),
services used, description, **cover photo**, gallery photos, video URL. Tick **Featured** to show it
on the homepage. Status: Draft / Published.

## 6. Services (`/admin/services`)

Each service gets its own page automatically (`/services/<slug>`): title, summary, hero image,
**checklist of what's included**, **FAQ** (also boosts Google results), status. Eight services are
pre-seeded — edit them, don't delete the slugs if the pages are already linked anywhere.

## 7. Artists (`/admin/artists`)

Photo, **bio**, category (Singer, Actor, Comedian, Anchor, DJ…), **videos** (YouTube/Vimeo/Cloudinary),
languages, genres, **Featured** (homepage carousel), **display status** (default: *"Available for
booking through Samridhi Films & Television"* — never imply an endorsement), internal
price/booking notes (never shown publicly), status.

> There's no separate categories screen — categories are managed via the API for now; the
> dropdown on the artist editor lists them.

## 8. Press coverage (`/admin/press`)

- **Bulk upload**: select many photos at once — each becomes a clipping row.
- Per clipping: **type** (single newspaper clipping vs full-page collage), publication name, city,
  date, headline. Mark `is_placeholder` until it's a real clipping.
- The public **Press page** lets visitors filter by publication and year and zoom into images.

## 9. Weddings (`/admin/weddings`) & Gallery (`/admin/gallery`)

- Weddings: title, location, date, description, **cover**, gallery, **Pin to homepage** (max 10),
  status, placeholder flag.
- Gallery: upload photos or paste YouTube URLs; click any thumbnail to preview it; use **Details**
  to edit the title, **category**, caption, status (title no longer edits inline on the card).

## 9a. Media Library (`/admin/media`) — NEW

- Shows **every photo and video in your Cloudinary account**, not just recent uploads.
- **Search** by file name, **filter** by Photos/Videos and by folder.
- **Click any thumbnail** to preview the full image or play the video.
- Top card shows **Cloudinary storage used** (with a progress bar).
- **Copy URL** to paste a file's link anywhere; **Delete** removes it from Cloudinary permanently.
- In any add/edit form, the **📚 Choose from library** button opens this same library as a popup —
  e.g. artist photos, artist performance videos, blog cover images, wedding photos.

## 10. Clients, Testimonials, Team, International shows

- **Clients** — name, logo upload, sector. Website shows elegant name cards until real logos arrive
  (marked placeholder). Only tick *permission to display* when the client has agreed.
- **Testimonials** — written quotes. **Cannot be published until "permission granted" is ticked.**
- **Team** — Sunil Jain, Rajkumari Chouhan and staff: photo, role, bio, Instagram link.
- **International** — shows abroad: country, city, date, summary, photos, video.

## 11. Legal pages (`/admin/legal`)

Privacy Policy, Terms & Conditions, Cookie Policy, Booking & Cancellation Policy — pre-drafted
in simple markdown. ⚠️ **Amber banner: have a qualified lawyer review these before launch.**
The *last updated* date stamps automatically when you save.

## 12. Settings (`/admin/settings`)

- **Company & contact**: phones, WhatsApp number + default message, email.
- **Addresses**: Chittorgarh office + Mumbai office (both show in the footer with map links).
- **Socials**: Instagram, Facebook, YouTube.
- **Hero video**, **Analytics** (GA4 + Meta Pixel IDs — only load after cookie consent),
  **Disclaimer** text, **Cookie banner** text.
- **Legal entity**: legal name, trade name, GSTIN, PAN, address, grievance officer — appears in
  the footer only when filled.
- **Lead notifications**: email address that gets notified of new leads.
- **SEO indexing toggle** — keep **OFF** while placeholders remain (the Launch page warns you
  loudly if it's on too early).

## 13. Navigation (`/admin/navigation`) & SEO (`/admin/seo`)

- Add/reorder/hide header and footer menu links. (The logo, phone and WhatsApp buttons are fixed.)
- **Redirects**: old path → new path with 301/302 — e.g. `/old-page` → `/services/weddings`.
- Sitemap/robots status display.

## 14. Landing pages (`/admin/landing-pages`)

SEO pages like *"event management company in Chittorgarh"*: slug, location, headline, intro,
FAQ, status. They appear at `/<slug>` automatically.

## 15. Launch checklist (`/admin/launch`)

Your pre-launch to-do list: every area still showing placeholders, with **Replace** links.
The page shows a big warning if SEO indexing is switched on while placeholders remain.

---

## Adding your 50+ press photos & 15 videos

**Option A — do it yourself in admin:** open **Press** (photos) or **Couple Stories / Gallery /
Weddings** (videos) and use the upload buttons. Bulk-select works for photos.

**Option B — one-time bulk import by your developer:** share a Google Drive folder
(or three folders: *Press Photos*, *Celebrity Feedback Videos*, *Wedding Photos*). Everything
gets uploaded to Cloudinary and filed into the right modules with proper labels — then you
manage them from admin from then on.

---

## Placeholders — the rules

- Anything with a **PLACEHOLDER** badge is temporary and excluded from your launch readiness.
- Placeholder images are generic/licensed stand-ins — replace before launch.
- The **Launch Checklist** is the single source of truth for what's left.
- **Do not turn on SEO indexing** until the checklist is clear — otherwise Google may index
  unfinished pages.
