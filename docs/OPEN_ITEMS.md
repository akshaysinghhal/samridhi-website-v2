# Open Items — Samridhi Films & Television website

Last updated: September 30, 2026. Owner: Akshay to confirm with the client.

## ✅ Resolved (handled in this build)

- **Experience wording** — the three claims stay separate and literal: "Since 1999", "20+ Years in Event Planning", "1000+ Events". Editable at Admin → Homepage → Stats.
- **Permissions model** — clients, testimonials and Couple Stories only appear publicly when their permission/consent flag is ticked; admin blocks publishing without it.
- **English-only** — no Hindi pages, locale routing, translation fields or language switcher.
- **Deployment target** — Vercel-provided domain for now; no custom domain configured yet (see open items).
- **Legal pages drafted** — Privacy Policy, Terms & Conditions, Cancellation & Refund Policy, Shipping Policy seeded as editable drafts (Admin → Legal Pages). **Lawyer review still required before launch.**
- **GST / legal entity** — editable at Admin → Site Settings → Legal entity & GST (GSTIN, PAN, grievance officer).
- **Search indexing off by default** — `seo_indexing_enabled` is false; the Launch Checklist warns if it is ever turned on while placeholders remain.

## 🔶 Still open (needs client input / action)

1. **"B Praak" spelling** — portfolio brief prints "B. Parekh"; confirm the correct artist name before publishing the artist profile.
2. **Placeholder replacement** — 50+ print-media photos, 15 celebrity-feedback videos and wedding photos from the client still need to be sent, imported and assigned in admin (Press Coverage, Gallery & Videos). Track progress at Admin → Launch Checklist.
3. **Couple consents** — written/video consent must be recorded (tick "Consent granted") for every Couple Story and testimonial before it can go public.
4. **Logo SVG / white version** — only the full-colour PNG is on file; a white/SVG variant is needed for dark backgrounds and print.
5. **Lawyer review** — the four legal drafts must be reviewed by a qualified lawyer before launch.
6. **Custom domain** — decide whether to stay on the Vercel domain or move to samridhifilms.in (or similar); sender `website@samridhifilms.in` for lead emails is unverified.
7. **Lead notification email** — set the address that receives new-lead alerts (Admin → Site Settings → Lead notifications).
8. **Poster dates** — event dates in the portfolio were taken from posters where legible; unverified dates are flagged and need client confirmation.

## ⚙️ Environment / handover notes

- Admin preview & revalidation now use authenticated `/api/admin/*` endpoints — no `NEXT_PUBLIC_*` secret copy is needed in Vercel. (If the variable exists from an older deploy, it can be removed.)
- Run `supabase/migration-003.sql` once in the Supabase SQL Editor (after `schema.sql` and `migration-002.sql`) before using the new modules.
- Scripts: `scripts/import-press-from-pdf.js` (needs poppler + Cloudinary/Supabase env) and `scripts/import-instagram-media.js` (drop files in `~/workspace/seed-media/`).
