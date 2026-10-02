import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// POST /api/admin/ai-content-image — Gemini looks at a page-content image and
// suggests text for the section's (empty) text fields.
// Body: { imageUrl, fields: [{ label }] }
// Returns: { suggestions: { label: text } } — only fields the image reliably
// informs are included. Never invents names, dates or company facts.
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
  const fields = Array.isArray(body.fields)
    ? body.fields.map((f) => String(f.label || f.key || "").trim()).filter(Boolean)
    : [];
  if (!imageUrl) return Response.json({ error: "Set an image first." }, { status: 400 });
  if (!fields.length) return Response.json({ error: "No text fields to fill." }, { status: 400 });

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
    `You are helping edit website content for Samridhi Films & Television, an Indian wedding and event management company. ` +
    `Look at this image and suggest text for these website fields: ${fields.join(" | ")}. ` +
    `Base each suggestion ONLY on what you can clearly see in the image (objects, setting, mood, any readable text). ` +
    `Keep suggestions short and website-ready. ` +
    `Never invent people names, event names, dates, places, prices, or company facts. ` +
    `If the image gives you nothing reliable for a field, omit that field entirely. ` +
    `Reply with ONLY a valid JSON object (no code fences, no explanation) mapping each field label to its suggested text.`;

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType: mime, data: buf.toString("base64") } }, { text: promptText }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
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

  let suggestions;
  try {
    suggestions = JSON.parse(text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, ""));
  } catch {
    return Response.json({ error: "Gemini returned an unreadable response — try again." }, { status: 502 });
  }
  // Keep only string suggestions for known fields.
  const clean = {};
  for (const f of fields) {
    const v = suggestions[f];
    if (typeof v === "string" && v.trim()) clean[f] = v.trim();
  }
  return Response.json({ suggestions: clean });
}
