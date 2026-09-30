import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";

export async function GET(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("weddings").select("*").eq("id", params.id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ wedding: data });
}

export async function PUT(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const b = await request.json();
  const { data, error } = await adminDb().from("weddings").update({
    title: b.title, location: b.location || "", event_date: b.event_date || null,
    description: b.description || "", cover_image: b.cover_image || null,
    gallery: b.gallery || [], pinned: !!b.pinned, sort: b.sort || 0,
    status: b.status || "published", is_placeholder: !!b.is_placeholder,
    created_at: undefined,
  }).eq("id", params.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ wedding: data });
}

export async function DELETE(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { error } = await adminDb().from("weddings").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
