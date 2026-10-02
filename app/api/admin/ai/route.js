import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// POST /api/admin/ai — server-side Gemini proxy for the admin AI writing tools.
// Body: { prompt, lang: "en" | "hi" }
// The API key lives in site_settings (Admin → Integrations & AI) and never
// reaches the browser; this route is admin-authenticated.
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
  const prompt = String(body.prompt || "").trim();
  const lang = body.lang === "hi" ? "hi" : "en";
  const plain = body.plain === true;
  if (!prompt) return Response.json({ error: "Tell the AI what to write first." }, { status: 400 });
  if (prompt.length > 4000) return Response.json({ error: "That prompt is too long — keep it under 4000 characters." }, { status: 400 });

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
      { error: "no_key", message: "No Gemini API key saved yet — add it in Admin → Integrations & AI first." },
      { status: 400 }
    );
  }

  const voice =
    lang === "hi"
      ? "Reply in Hindi (Devanagari script). Warm, professional tone for an Indian event & wedding company's website and social media."
      : "Reply in clear English. Warm, professional tone for an Indian event & wedding company's website and social media.";
  const plainRule = plain
    ? " Write in plain text only: no markdown formatting, no **bold**, no ## headings, no leading - or * bullets and no numbered lists — use simple line breaks between ideas."
    : "";
  const fullPrompt = `${voice}${plainRule}\n\n${prompt}`;

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
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
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
  if (!text) return Response.json({ error: "Gemini returned an empty response — try rephrasing." }, { status: 502 });
  return Response.json({ text });
}
