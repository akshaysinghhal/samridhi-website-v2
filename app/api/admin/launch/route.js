import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// GET /api/admin/launch -> placeholder counts per area for the Launch Checklist.
export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const db = adminDb();

  async function count(table, filter) {
    let q = db.from(table).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: n, error } = await q;
    return error ? 0 : n || 0;
  }

  const ph = (q) => q.eq("is_placeholder", true);

  const [
    couple_stories,
    wedding_photos,
    client_logos,
    press,
    instagram_photos,
    artist_photos,
    draft_events,
    draft_testimonials,
  ] = await Promise.all([
    count("couple_stories", ph),
    count("gallery_items", (q) => ph(q).ilike("category", "%wedding%")),
    count("clients", ph),
    count("press_clippings", ph),
    count("media", (q) => ph(q).in("source", ["instagram", "facebook"])),
    count("artists", ph),
    count("events", (q) => q.eq("status", "draft")),
    count("testimonials", (q) => q.eq("status", "draft")),
  ]);

  const { data: settings } = await db.from("site_settings").select("key,value").in("key", ["hero_video", "seo_indexing_enabled"]);
  const map = {};
  for (const r of settings || []) map[r.key] = r.value;
  const hero_video_missing = !map.hero_video;
  const indexing_enabled = map.seo_indexing_enabled === true;

  const areas = [
    { key: "hero_video", label: "Hero wedding video", count: hero_video_missing ? 1 : 0, href: "/admin/homepage" },
    { key: "couple_stories", label: "Couple Stories placeholders", count: couple_stories, href: "/admin/couple-stories" },
    { key: "wedding_photos", label: "Wedding gallery placeholders", count: wedding_photos, href: "/admin/gallery" },
    { key: "client_logos", label: "Client logo placeholders", count: client_logos, href: "/admin/clients" },
    { key: "press", label: "Press clipping placeholders", count: press, href: "/admin/press" },
    { key: "instagram_photos", label: "Instagram/Facebook-sourced photos", count: instagram_photos, href: "/admin/media" },
    { key: "artist_photos", label: "Artist photo placeholders", count: artist_photos, href: "/admin/artists" },
    { key: "draft_events", label: "Unpublished portfolio drafts", count: draft_events, href: "/admin/portfolio" },
    { key: "draft_testimonials", label: "Unpublished testimonial drafts", count: draft_testimonials, href: "/admin/testimonials" },
  ];
  const total = areas.reduce((n, a) => n + a.count, 0);

  return Response.json({ areas, total, indexing_enabled });
}
