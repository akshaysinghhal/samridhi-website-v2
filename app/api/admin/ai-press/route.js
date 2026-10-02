import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// POST /api/admin/ai-press — Gemini reads a newspaper clipping image and
// returns press-form fields as JSON.
// Body: { imageUrl }
// Returns: { publication, city, published_on (YYYY-MM-DD), headline, type }.
// Only fields the image reliably shows are included; never invents.
const MAX_BYTES = 10 * 1024 * 1024;
const PUBS = ["Dainik Bhaskar", "Rajasthan Patrika", "Patrika", "Pratahkal", "Other"];

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
  if (!imageUrl) return Response.json({ error: "No image provided." }, { status: 400 });

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
  const mime = /\.png(\?|$)/i.test(imageUrl) ? "image/png" : /\.webp(\?|$)/i.test(imageUrl) ? "image/webp" : "image/jpeg";

  const promptText =
    `You are cataloguing an Indian newspaper clipping for a press-coverage archive. Look at this clipping image and extract:\n` +
    `1. "publication": the newspaper masthead name. Pick exactly one of: ${PUBS.join(" | ")}. Use "Other" if none matches.\n` +
    `2. "city": the edition city printed on the clipping (e.g. Chittorgarh, Udaipur). Omit if not visible.\n` +
    `3. "published_on": the publication date printed on the clipping, as YYYY-MM-DD. Omit if not clearly readable.\n` +
    `4. "headline": the main headline text of the clipping, transcribed as printed (keep the original language, Hindi or English). Omit if not readable.\n` +
    `5. "type": "page_collage" if this looks like a full scanned newspaper page, otherwise "single_clipping".\n` +
    `Transcribe — never invent or guess. Omit any field you cannot reliably read. ` +
    `Reply with ONLY a valid JSON object (no code fences, no explanation) with any of these keys: "publication", "city", "published_on", "headline", "type".`;

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType: mime, data: buf.toString("base64") } }, { text: promptText }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
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

  const out = {};
  const pub = String(obj.publication || "").trim();
  if (PUBS.includes(pub)) out.publication = pub;
  else if (pub) out.publication = "Other";
  const city = String(obj.city || "").trim();
  if (city) out.city = city;
  const dt = String(obj.published_on || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) out.published_on = dt;
  const hl = String(obj.headline || "").trim();
  if (hl) out.headline = hl;
  const ty = String(obj.type || "").trim();
  if (ty === "page_collage" || ty === "single_clipping") out.type = ty;
  return Response.json(out);
}
