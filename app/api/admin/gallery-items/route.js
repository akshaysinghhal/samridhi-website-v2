import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

const FIELDS = ["kind", "title", "image_url", "video_url", "category", "caption", "sort", "status", "is_placeholder"];

function pick(b) {
  const o = {};
  for (const f of FIELDS) if (b[f] !== undefined) o[f] = b[f];
  delete o.id; delete o.created_at;
  return o;
}

function refresh() {
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
}

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const { data, error } = await adminDb().from("gallery_items").select("*").eq("id", id).single();
    if (error) return Response.json({ error: error.message }, { status: 404 });
    return Response.json({ item: data });
  }
  const { data, error } = await adminDb().from("gallery_items").select("*").order("sort").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data });
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const body = await request.json();
  const row = pick(body);
  if (row.kind !== "video") row.kind = "photo";
  const { data, error } = await adminDb().from("gallery_items").insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  refresh();
  return Response.json({ item: data });
}

export async function PUT(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const body = await request.json();
  const { data, error } = await adminDb().from("gallery_items")
    .update(pick(body))
    .eq("id", body.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  refresh();
  return Response.json({ item: data });
}

export async function DELETE(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const { error } = await adminDb().from("gallery_items").delete().eq("id", searchParams.get("id"));
  if (error) return Response.json({ error: error.message }, { status: 500 });
  refresh();
  return Response.json({ ok: true });
}
