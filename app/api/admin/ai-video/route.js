import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// POST /api/admin/ai-video — Gemini watches a testimonial video and returns a
// polished quote + extracted name/company as JSON.
// Body: { videoUrl, instructions? }
// The API key lives in site_settings (Admin → Integrations & AI) and never
// reaches the browser; this route is admin-authenticated.

const MAX_BYTES = 18 * 1024 * 1024; // Gemini inline video limit

function isYouTube(url) {
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(String(url));
}

// Cloudinary videos get a lightweight transformation (first 90s, 480px wide,
// low quality) so the download stays small enough for inline analysis.
function lightenUrl(url) {
  const u = String(url);
  if (u.includes("res.cloudinary.com") && u.includes("/video/upload/") && !u.includes("ai-describe")) {
    return u.replace("/video/upload/", "/video/upload/w_480,q_40,so_0,du_90/");
  }
  return u;
}

async function fetchVideoBytes(url) {
  const fetchUrl = lightenUrl(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  let res;
  try {
    res = await fetch(fetchUrl, { signal: ctrl.signal });
  } catch (e) {
    clearTimeout(timer);
    throw new Error("Could not download the video — check the URL and try again.");
  }
  clearTimeout(timer);
  if (!res.ok) throw new Error("Could not download the video (server returned an error).");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new Error("This video is too large for AI analysis (over 18 MB). Try a shorter clip.");
  }
  if (buf.length < 1024) throw new Error("The downloaded file looks empty — check the video URL.");
  return buf;
}

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
  const videoUrl = String(body.videoUrl || "").trim();
  if (!videoUrl) return Response.json({ error: "No video URL provided." }, { status: 400 });

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

  const instructions =
    String(body.instructions || "").trim() ||
    "You are a testimonial copywriter for Samridhi Films & Television, an Indian wedding and event management company.";

  const promptText =
    `${instructions}\n\n` +
    `Watch this client testimonial video carefully. Then:\n` +
    `1. Write a polished, natural first-person testimonial quote (2-4 sentences) capturing what the speaker says. Fix grammar and flow, keep every fact and name from the video, and never invent praise, events, names or details not present in it. Use the company name "Samridhi Films & Television".\n` +
    `2. Extract the speaker's name if mentioned.\n` +
    `3. Extract their company or organisation if mentioned.\n` +
    `Reply with ONLY a valid JSON object (no code fences, no explanation) with exactly these keys: "quote", "author_name", "company". Use "" for anything not mentioned.`;

  let parts;
  try {
    if (isYouTube(videoUrl)) {
      parts = [{ fileData: { fileUri: videoUrl, mimeType: "video/mp4" } }, { text: promptText }];
    } else {
      const buf = await fetchVideoBytes(videoUrl);
      parts = [
        { inlineData: { mimeType: "video/mp4", data: buf.toString("base64") } },
        { text: promptText },
      ];
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
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

  let obj;
  try {
    obj = JSON.parse(text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, ""));
  } catch {
    return Response.json({ error: "Gemini returned an unreadable response — try again." }, { status: 502 });
  }
  return Response.json({
    quote: String(obj.quote || "").trim(),
    author_name: String(obj.author_name || "").trim(),
    company: String(obj.company || "").trim(),
  });
}
