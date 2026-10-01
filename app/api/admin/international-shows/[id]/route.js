import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";
import { pickFields, refresh, logWrite } from "../../_lib/crud";

const FIELDS = ["title","slug","country","city","show_date","summary","cover_image","gallery","video_url","sort","status","is_placeholder"];

function slugify(t) {
  return String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "show";
}

async function uniqueSlug(base, excludeId) {
  const db = adminDb();
  let slug = base;
  for (let n = 1; n <= 60; n++) {
    const { data } = await db.from("international_shows").select("id").eq("slug", slug).neq("id", excludeId).limit(1);
    if (!data || data.length === 0) return slug;
    slug = `${base}-${n + 1}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function PUT(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));
  const row = pickFields(b, FIELDS);
  delete row.id;
  delete row.created_at;
  // Keep existing slugs stable: only fill when empty.
  if (!row.slug && row.title) row.slug = await uniqueSlug(slugify(row.title), params.id);
  else if (row.slug) row.slug = await uniqueSlug(slugify(row.slug), params.id);

  const { data: before } = await adminDb().from("international_shows").select("*").eq("id", params.id).single();
  let res = await adminDb().from("international_shows").update(row).eq("id", params.id).select().single();
  // Graceful fallback if migration-004 (slug column) hasn't been run yet.
  if (res.error && /slug/i.test(res.error.message)) {
    delete row.slug;
    res = await adminDb().from("international_shows").update(row).eq("id", params.id).select().single();
  }
  if (res.error) return Response.json({ error: res.error.message }, { status: 500 });
  await logWrite({ table: "international_shows", entityId: params.id, action: "update", actor: user.email, before, after: res.data });
  refresh();
  return Response.json({ item: res.data });
}

export async function DELETE(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { data: before } = await adminDb().from("international_shows").select("*").eq("id", params.id).single();
  const { error } = await adminDb().from("international_shows").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await logWrite({ table: "international_shows", entityId: params.id, action: "delete", actor: user.email, before, after: null });
  refresh();
  return Response.json({ ok: true });
}
