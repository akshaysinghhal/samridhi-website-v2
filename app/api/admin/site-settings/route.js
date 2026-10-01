import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// Keys whose values must never be sent back to the browser. The admin UI
// treats them as write-only: saving an empty value leaves the stored one
// untouched.
const SECRET_KEYS = new Set(["gemini_api_key"]);

// GET /api/admin/site-settings -> { settings: { key: value }, masked: [keys with a stored secret] }
// PUT /api/admin/site-settings { key, value } -> upsert one setting
export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { data, error } = await adminDb().from("site_settings").select("key,value");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const settings = {};
  const masked = [];
  for (const r of data || []) {
    if (SECRET_KEYS.has(r.key)) {
      settings[r.key] = "";
      if (r.value) masked.push(r.key);
    } else {
      settings[r.key] = r.value;
    }
  }
  return Response.json({ settings, masked });
}

export async function PUT(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { key, value } = await request.json().catch(() => ({}));
  if (!key || typeof key !== "string") {
    return Response.json({ error: "Missing key" }, { status: 400 });
  }
  // Never blank a stored secret: an empty write-only field means "keep it".
  if (SECRET_KEYS.has(key) && (value === "" || value == null)) {
    return Response.json({ ok: true, unchanged: true });
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
