import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";
import { cloud } from "../../../../../lib/cloudinary";

// POST /api/admin/gallery-items/rename — renames the Cloudinary image file
// from the gallery item's title (slugified, capped at 80 chars), then updates
// the stored image_url. Body: { id }.
const MAX_SLUG = 80;

function slugify(title) {
  let s = String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > MAX_SLUG) s = s.slice(0, MAX_SLUG).replace(/-+$/g, "");
  return s || "photo";
}

// Extract the Cloudinary public_id (with folder) from a delivery URL.
function publicIdFromUrl(url) {
  const m = String(url).match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.+)$/);
  if (!m) return null;
  let rest = m[1].split("?")[0];
  // Drop the version segment (v123456) and any transformation segments.
  const parts = rest.split("/").filter(Boolean);
  const cleaned = [];
  for (const p of parts) {
    if (/^v\d+$/.test(p)) continue;
    cleaned.push(p);
  }
  let joined = cleaned.join("/");
  joined = joined.replace(/\.[a-z0-9]+$/i, ""); // strip extension
  return joined || null;
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();
  const { data: item, error: fetchErr } = await db
    .from("gallery_items")
    .select("id,title,image_url,kind")
    .eq("id", body.id)
    .single();
  if (fetchErr || !item) return Response.json({ error: "Gallery item not found." }, { status: 404 });
  if (!item.title || !item.title.trim()) {
    return Response.json({ error: "Add a title first — the file is renamed from the title." }, { status: 400 });
  }

  const oldId = publicIdFromUrl(item.image_url || "");
  if (!oldId) {
    return Response.json({ error: "Renaming only works for images hosted on Cloudinary." }, { status: 400 });
  }

  const slug = slugify(item.title);
  const folder = oldId.includes("/") ? oldId.slice(0, oldId.lastIndexOf("/")) : "";
  const base = folder ? `${folder}/${slug}` : slug;

  // Avoid collisions: photo, photo-2, photo-3…
  let newId = base;
  let n = 1;
  for (;;) {
    if (newId === oldId) break; // already named correctly
    try {
      await cloud().api.resource(newId, { resource_type: "image" });
      n += 1;
      newId = `${base}-${n}`;
    } catch {
      break; // not found → free to use
    }
    if (n > 50) return Response.json({ error: "Could not find a free file name — try a different title." }, { status: 400 });
  }

  if (newId === oldId) {
    return Response.json({ ok: true, image_url: item.image_url, renamed: false });
  }

  try {
    const r = await cloud().uploader.rename(oldId, newId, { resource_type: "image" });
    const newUrl = r.secure_url || r.url;
    const { error: updErr } = await db.from("gallery_items").update({ image_url: newUrl }).eq("id", item.id);
    if (updErr) return Response.json({ error: "Renamed on Cloudinary, but the gallery record could not be updated: " + updErr.message }, { status: 500 });
    return Response.json({ ok: true, image_url: newUrl, renamed: true, file_name: newId.split("/").pop() });
  } catch (e) {
    return Response.json({ error: "Rename failed: " + (e.message || "unknown error") }, { status: 502 });
  }
}
