import { supabasePublic } from "./supabaseServer";

// ---------------------------------------------------------------------------
// Server-side data access for the public site.
// Every function degrades gracefully: if Supabase isn't configured (or a table
// is missing), it returns a safe fallback so pages still render.
// NEVER import this file's supabaseAdmin-based callers from client components.
// ---------------------------------------------------------------------------

function sb() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase.co")) return null;
    return supabasePublic();
  } catch {
    return null;
  }
}

async function safe(promise, fallback) {
  try {
    const { data, error } = await promise;
    if (error) return fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

// --- site settings -----------------------------------------------------------
export async function getSettings() {
  const client = sb();
  if (!client) return {};
  const rows = await safe(client.from("site_settings").select("key,value"), []);
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function setting(settings, key, fallback = "") {
  const v = settings?.[key];
  return v === undefined || v === null ? fallback : v;
}

// --- couple stories ------------------------------------------------------------
export async function getCoupleStories({ home = false, limit = 50 } = {}) {
  const client = sb();
  if (!client) return [];
  // Scheduled publishing: "scheduled" rows with publish_at in the past are public too (RLS mirrors this rule).
  const nowIso = new Date().toISOString();
  let q = client
    .from("couple_stories")
    .select("*")
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
    .eq("consent_granted", true)
    .order("sort")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (home) q = q.eq("featured_on_home", true).limit(4);
  return safe(q, []);
}

// --- services -------------------------------------------------------------------
export async function getServices() {
  const client = sb();
  if (!client) return [];
  return safe(
    client.from("services").select("*").eq("status", "published").order("sort"),
    []
  );
}

export async function getService(slug) {
  const client = sb();
  if (!client) return null;
  const rows = await safe(
    client.from("services").select("*").eq("slug", slug).eq("status", "published").limit(1),
    []
  );
  return rows[0] || null;
}

// --- artists ---------------------------------------------------------------------
export async function getArtistCategories() {
  const client = sb();
  if (!client) return [];
  return safe(client.from("artist_categories").select("*").order("sort"), []);
}

export async function getArtists({ category, featured = false, limit = 100 } = {}) {
  const client = sb();
  if (!client) return [];
  let q = client.from("artists").select("*").eq("status", "published").order("sort").limit(limit);
  if (category) q = q.eq("category", category);
  if (featured) q = q.eq("featured", true);
  return safe(q, []);
}

export async function getArtist(slug) {
  const client = sb();
  if (!client) return null;
  const rows = await safe(
    client.from("artists").select("*").eq("slug", slug).eq("status", "published").limit(1),
    []
  );
  return rows[0] || null;
}

// --- portfolio events --------------------------------------------------------------
export async function getEvents({ category, featured = false, limit = 60 } = {}) {
  const client = sb();
  if (!client) return [];
  let q = client
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("sort")
    .limit(limit);
  if (category) q = q.eq("category", category);
  if (featured) q = q.eq("featured", true);
  return safe(q, []);
}

export async function getEvent(slug) {
  const client = sb();
  if (!client) return null;
  const rows = await safe(
    client.from("events").select("*").eq("slug", slug).eq("status", "published").limit(1),
    []
  );
  return rows[0] || null;
}

// --- weddings (existing table) -------------------------------------------------------
export async function getWeddings({ pinnedOnly = false } = {}) {
  const client = sb();
  if (!client) return [];
  let q = client.from("weddings").select("*").eq("status", "published").order("sort");
  if (pinnedOnly) q = q.eq("pinned", true).limit(10);
  return safe(q, []);
}

// --- gallery ---------------------------------------------------------------------------
export async function getGalleryItems({ category } = {}) {
  const client = sb();
  if (!client) return [];
  let q = client.from("gallery_items").select("*").eq("status", "published").order("sort");
  if (category) q = q.eq("category", category);
  return safe(q, []);
}

// --- press --------------------------------------------------------------------------------
export async function getPressClippings({ publication } = {}) {
  const client = sb();
  if (!client) return [];
  let q = client
    .from("press_clippings")
    .select("*")
    .eq("status", "published")
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("sort");
  if (publication) q = q.eq("publication", publication);
  return safe(q, []);
}

// --- clients -------------------------------------------------------------------------------
export async function getClients() {
  const client = sb();
  if (!client) return [];
  return safe(
    client.from("clients").select("*").eq("permission_to_display", true).order("sort"),
    []
  );
}

// --- testimonials ----------------------------------------------------------------------------
export async function getTestimonials() {
  const client = sb();
  if (!client) return [];
  return safe(
    client
      .from("testimonials")
      .select("*")
      .eq("status", "published")
      .eq("permission_granted", true)
      .order("sort"),
    []
  );
}

// --- team ---------------------------------------------------------------------------------------
export async function getTeam() {
  const client = sb();
  if (!client) return [];
  return safe(client.from("team_members").select("*").eq("status", "published").order("sort"), []);
}

// --- international shows ---------------------------------------------------------------------------
export async function getInternationalShows() {
  const client = sb();
  if (!client) return [];
  return safe(
    client.from("international_shows").select("*").eq("status", "published").order("sort"),
    []
  );
}

// --- legal pages --------------------------------------------------------------------------------------
export async function getLegalPage(slug) {
  const client = sb();
  if (!client) return null;
  const rows = await safe(
    client.from("legal_pages").select("*").eq("slug", slug).eq("status", "published").limit(1),
    []
  );
  return rows[0] || null;
}

// --- navigation ---------------------------------------------------------------------------------------------
export async function getNav(location = "header") {
  const client = sb();
  if (!client) return [];
  return safe(
    client
      .from("nav_items")
      .select("*")
      .eq("location", location)
      .eq("visible", true)
      .order("sort"),
    []
  );
}

// --- landing pages ---------------------------------------------------------------------------------------------------
export async function getLandingPage(slug) {
  const client = sb();
  if (!client) return null;
  const rows = await safe(
    client.from("landing_pages").select("*").eq("slug", slug).eq("status", "published").limit(1),
    []
  );
  return rows[0] || null;
}

export async function getLandingPages() {
  const client = sb();
  if (!client) return [];
  return safe(
    client.from("landing_pages").select("slug,title,updated_at").eq("status", "published").order("sort"),
    []
  );
}

// --- redirects (checked in middleware-adjacent server code) ----------------------------------------------------------------------
export async function getRedirect(path) {
  const client = sb();
  if (!client) return null;
  const rows = await safe(client.from("redirects").select("*").eq("from_path", path).limit(1), []);
  return rows[0] || null;
}

// --- blog posts (published) -------------------------------------------------------------------------------------------------------------
export async function getPublishedPosts(limit = 30) {
  const client = sb();
  if (!client) return [];
  return safe(
    client
      .from("posts")
      .select("slug,title,excerpt,cover_image,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit),
    []
  );
}
