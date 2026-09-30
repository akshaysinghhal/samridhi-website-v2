import { verifyAdmin, authedJson, adminDb } from "../../../lib/adminAuth";
import { cloud } from "../../../lib/cloudinary";

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user); if (denied) return denied;

  const form = await request.formData();
  const file = form.get("file");
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isVideo = (file.type || "").startsWith("video");

  const result = await new Promise((resolve, reject) => {
    cloud().uploader.upload_stream(
      { resource_type: isVideo ? "video" : "image", folder: "samridhi" },
      (err, res) => (err ? reject(err) : resolve(res))
    ).end(buffer);
  });

  const { data } = await adminDb().from("media").insert({
    url: result.secure_url, public_id: result.public_id,
    kind: isVideo ? "video" : "image", alt: file.name || "",
  }).select().single();

  return Response.json({ media: data });
}
