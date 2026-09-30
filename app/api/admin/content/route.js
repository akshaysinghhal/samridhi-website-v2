import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("page_content").select("*").order("page").order("section").order("sort");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ blocks: data });
}

export async function PUT(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { blocks } = await request.json(); // [{id, value, image_url}]
  const db = adminDb();
  for (const b of blocks || []) {
    await db.from("page_content").update({
      value: b.value ?? "", image_url: b.image_url || null, updated_at: new Date().toISOString(),
    }).eq("id", b.id);
  }
  return Response.json({ ok: true });
}
