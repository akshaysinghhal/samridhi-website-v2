import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../../lib/adminAuth";

// PUT /api/admin/legal-pages/[slug] { title, body } — auto-stamps last_updated_at
export async function PUT(request, { params }) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));
  const { data, error } = await adminDb()
    .from("legal_pages")
    .update({
      title: b.title,
      body: b.body ?? "",
      status: b.status || "published",
      last_updated_at: new Date().toISOString(),
    })
    .eq("slug", params.slug)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
  return Response.json({ page: data });
}
