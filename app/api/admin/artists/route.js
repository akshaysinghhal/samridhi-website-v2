import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

const FIELDS = ["name", "slug", "category", "image_url", "bio", "videos", "featured", "display_status", "price_note", "booking_notes", "languages", "genres", "sort", "status", "is_placeholder"];

function pick(b) {
  const o = {};
  for (const f of FIELDS) if (b[f] !== undefined) o[f] = b[f];
  if (o.slug === "") o.slug = null;
  return o;
}

function refresh() {
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
}

export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const { data, error } = await adminDb().from("artists").select("*").order("sort").order("created_at");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ artists: data });
}

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;
  const b = await request.json();
  const { data, error } = await adminDb().from("artists").insert(pick(b)).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  refresh();
  return Response.json({ artist: data });
}
