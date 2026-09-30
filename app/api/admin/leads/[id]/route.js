import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";

const STATUSES = ["New", "Contacted", "Quote Sent", "Negotiation", "Won", "Lost"];

// PUT /api/admin/leads/[id] { status, assigned_to, spam }
export async function PUT(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));
  const patch = { updated_at: new Date().toISOString() };
  if (b.status && STATUSES.includes(b.status)) patch.status = b.status;
  if (b.assigned_to !== undefined) patch.assigned_to = String(b.assigned_to).slice(0, 200);
  if (b.spam !== undefined) patch.spam = !!b.spam;
  const { data, error } = await adminDb().from("leads").update(patch).eq("id", params.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ lead: data });
}

export async function DELETE(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { error } = await adminDb().from("leads").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
