import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";
import { pickFields, refresh, logWrite } from "../_lib/crud";

const FIELDS = ["title","slug","country","city","show_date","summary","cover_image","gallery","video_url","sort","status","is_placeholder"];

function slugify(t) {
  return String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "show";
}

// Ensure the slug is unique, appending -2, -3… on collision.
async function uniqueSlug(base, excludeId) {
  const db = adminDb();
  let slug = base;
  for (let n = 1; n <= 60; n++) {
    let q = db.from("international_shows").select("id").eq("slug", slug).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q;
    if (!data || data.length === 0) return slug;
    slug = `${base}-${n + 1}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { data, error } = await adminDb()
    .from("international_shows")
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ shows: data });
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));
  const row = pickFields(b, FIELDS);
  if (!row.title || !String(row.title).trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }
  row.slug = await uniqueSlug(slugify(row.slug?.trim?.() || row.title));

  let { data, error } = await adminDb().from("international_shows").insert(row).select().single();
  // Graceful fallback if migration-004 (slug column) hasn't been run yet.
  if (error && /slug/i.test(error.message)) {
    delete row.slug;
    ({ data, error } = await adminDb().from("international_shows").insert(row).select().single());
  }
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await logWrite({ table: "international_shows", entityId: data.id, action: "create", actor: user.email, before: null, after: data });
  refresh();
  return Response.json({ item: data });
}
