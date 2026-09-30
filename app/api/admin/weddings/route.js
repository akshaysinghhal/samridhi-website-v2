import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("weddings").select("*")
    .order("pinned", { ascending: false }).order("sort").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ weddings: data });
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const b = await request.json();
  const { data, error } = await adminDb().from("weddings").insert({
    title: b.title, location: b.location || "", event_date: b.event_date || null,
    description: b.description || "", cover_image: b.cover_image || null,
    gallery: b.gallery || [], pinned: !!b.pinned, sort: b.sort || 0,
    status: b.status || "published", is_placeholder: !!b.is_placeholder,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ wedding: data });
}
