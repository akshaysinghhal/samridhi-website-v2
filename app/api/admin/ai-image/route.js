import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// POST /api/admin/ai-image — Gemini looks at a photo and suggests a gallery
// title, caption and category as JSON.
// Body: { imageUrl, categories?: string[] }
// The API key lives in site_settings (Admin → Integrations & AI) and never
// reaches the browser; this route is admin-authenticated.
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const imageUrl = String(body.imageUrl || "").trim();
  if (!imageUrl) return Response.json({ error: "No image URL provided." }, { status: 400 });
  const categories = Array.isArray(body.categories) && body.categories.length
    ? body.categories.map(String)
    : ["Events"];

  const db = adminDb();
  const { data: rows } = await db.from("site_settings").select("key,value").in("key", ["gemini_api_key", "gemini_model"]);
  const get = (k) => {
    const r = (rows || []).find((x) => x.key === k);
    return r ? String(r.value || "").trim() : "";
  };
  const apiKey = get("gemini_api_key");
  const model = get("gemini_model") || "gemini-2.0-flash";
  if (!apiKey) {
    return Response.json(
      { error: "No Gemini API key saved yet — add it in Admin → Integrations & AI first." },
      { status: 400 }
    );
  }

  // Download the image (photos are small; cap just in case).
  let buf;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(imageUrl, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("download failed");
    buf = Buffer.from(await res.arrayBuffer());
  } catch {
    return Response.json({ error: "Could not download the image — check the URL and try again." }, { status: 400 });
  }
  if (buf.length > MAX_BYTES || buf.length < 512) {
    return Response.json({ error: "That image could not be analysed — try another file." }, { status: 400 });
  }
  const mime = imageUrl.match(/\.png(\?|$)/i) ? "image/png" : imageUrl.match(/\.webp(\?|$)/i) ? "image/webp" : "image/jpeg";

  const promptText =
    `You are writing gallery metadata for Samridhi Films & Television, an Indian wedding and event management company. ` +
    `Look at this event photo and write:\n` +
    `1. A short, attractive title (max 8 words) describing what's in the photo.\n` +
    `2. A one-line caption (max 20 words) suitable under the photo on the website gallery.\n` +
    `3. The best category from exactly this list: ${categories.join(" | ")}.\n` +
    `Reply with ONLY a valid JSON object (no code fences, no explanation) with exactly these keys: "title", "caption", "category". ` +
    `Never invent people names, event names or places — describe only what you can see.`;

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType: mime, data: buf.toString("base64") } }, { text: promptText }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );
  } catch (e) {
    return Response.json({ error: "Could not reach Gemini: " + e.message }, { status: 502 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini error ${res.status}`;
    return Response.json({ error: msg }, { status: 502 });
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
  if (!text) return Response.json({ error: "Gemini returned an empty response — try again." }, { status: 502 });

  let obj;
  try {
    obj = JSON.parse(text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, ""));
  } catch {
    return Response.json({ error: "Gemini returned an unreadable response — try again." }, { status: 502 });
  }
  let category = String(obj.category || "").trim();
  if (!categories.includes(category)) category = "Events";
  return Response.json({
    title: String(obj.title || "").trim(),
    caption: String(obj.caption || "").trim(),
    category,
  });
}
