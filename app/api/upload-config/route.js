import { adminDb } from "../../../lib/adminAuth";

// Public on purpose: the Cloudinary cloud name is already visible in every
// media URL, and an *unsigned* upload preset is designed to be public — it
// only permits uploads, never reads, deletes or account changes.
export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  if (!uploadPreset) {
    try {
      const { data } = await adminDb()
        .from("site_settings").select("value").eq("key", "cloudinary_upload_preset").single();
      uploadPreset = data?.value || "";
    } catch { /* not configured yet */ }
  }
  return Response.json({ cloudName, uploadPreset });
}
