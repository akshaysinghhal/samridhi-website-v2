import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// GET /api/admin/site-settings -> { settings: { key: value } }
// PUT /api/admin/site-settings { key, value } -> upsert one setting
export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { data, error } = await adminDb().from("site_settings").select("key,value");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const settings = {};
  for (const r of data || []) settings[r.key] = r.value;
  return Response.json({ settings });
}

export async function PUT(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { key, value } = await request.json().catch(() => ({}));
  if (!key || typeof key !== "string") {
    return Response.json({ error: "Missing key" }, { status: 400 });
  }
  // The `value` column is NOT NULL — coerce null/undefined to "" so saving
  // an empty field never violates the constraint.
  const { error } = await adminDb()
    .from("site_settings")
    .upsert({ key, value: value ?? "", updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
  return Response.json({ ok: true });
}
