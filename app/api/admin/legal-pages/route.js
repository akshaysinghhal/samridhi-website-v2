import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// GET /api/admin/legal-pages -> { pages: [...] }
export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { data, error } = await adminDb().from("legal_pages").select("*").order("slug");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ pages: data });
}
