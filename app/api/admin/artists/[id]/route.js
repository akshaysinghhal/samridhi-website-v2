import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";

const FIELDS = ["name", "slug", "category", "image_url", "bio", "videos", "featured", "display_status", "price_note", "booking_notes", "languages", "genres", "sort", "status", "is_placeholder"];

function pick(b) {
  const o = {};
  for (const f of FIELDS) if (b[f] !== undefined) o[f] = b[f];
  delete o.id; delete o.created_at;
  if (o.slug === "") o.slug = null;
  return o;
}

export async function GET(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("artists").select("*").eq("id", params.id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ artist: data });
}

export async function PUT(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const b = await request.json();
  const { data, error } = await adminDb().from("artists").update(pick(b)).eq("id", params.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
  return Response.json({ artist: data });
}

export async function DELETE(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { error } = await adminDb().from("artists").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
  return Response.json({ ok: true });
}
