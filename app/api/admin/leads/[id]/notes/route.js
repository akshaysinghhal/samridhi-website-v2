import { verifyAdmin, authedJson, adminDb } from "../../../../../../lib/adminAuth";

// GET /api/admin/leads/[id]/notes -> { notes: [...] }
// POST /api/admin/leads/[id]/notes { body, follow_up_at, author } -> { note }
export async function GET(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { data, error } = await adminDb()
    .from("lead_notes")
    .select("*")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ notes: data });
}

export async function POST(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));
  if (!String(b.body || "").trim()) {
    return Response.json({ error: "Note text is required" }, { status: 400 });
  }
  const { data, error } = await adminDb()
    .from("lead_notes")
    .insert({
      lead_id: params.id,
      author: String(b.author || user.email || "").slice(0, 200),
      body: String(b.body).slice(0, 5000),
      follow_up_at: b.follow_up_at || null,
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ note: data });
}
