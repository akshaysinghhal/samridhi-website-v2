import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

function slugify(t) {
  return (t || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("posts").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ posts: data });
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const body = await request.json();
  const slug = body.slug?.trim() || slugify(body.title);
  const row = {
    title: body.title, slug, excerpt: body.excerpt || "", content: body.content || "",
    cover_image: body.cover_image || null, gallery: body.gallery || [],
    video_url: body.video_url || null, meta_title: body.meta_title || "",
    meta_description: body.meta_description || "", keywords: body.keywords || "",
    og_image: body.og_image || null, status: body.status || "draft",
    author: body.author || "Samridhi Films & Television",
    published_at: body.status === "published" ? (body.published_at || new Date().toISOString()) : null,
  };
  const { data, error } = await adminDb().from("posts").insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}
