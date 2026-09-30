import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";
import { cloud } from "../../../../lib/cloudinary";

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("media").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ media: data });
}

export async function DELETE(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const db = adminDb();
  const { data } = await db.from("media").select("public_id,kind").eq("id", id).single();
  if (data?.public_id) {
    try { await cloud().uploader.destroy(data.public_id, { resource_type: data.kind === "video" ? "video" : "image" }); } catch { /* ignore */ }
  }
  await db.from("media").delete().eq("id", id);
  return Response.json({ ok: true });
}
