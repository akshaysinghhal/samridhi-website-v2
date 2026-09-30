import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";

export async function GET(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("posts").select("*").eq("id", params.id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ post: data });
}

export async function PUT(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const body = await request.json();
  const row = {
    title: body.title, slug: body.slug, excerpt: body.excerpt || "", content: body.content || "",
    cover_image: body.cover_image || null, gallery: body.gallery || [],
    video_url: body.video_url || null, meta_title: body.meta_title || "",
    meta_description: body.meta_description || "", keywords: body.keywords || "",
    og_image: body.og_image || null, status: body.status || "draft",
    author: body.author || "Samridhi Films & Television",
    published_at: body.status === "published" ? (body.published_at || new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await adminDb().from("posts").update(row).eq("id", params.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}

export async function DELETE(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { error } = await adminDb().from("posts").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
