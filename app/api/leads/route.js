import { supabaseAdmin } from "../../../lib/supabaseServer";

// POST /api/leads — public lead intake (quote / artist booking / wedding / contact).
// Protection: honeypot field, in-memory per-IP rate limit, basic validation.
// Turnstile verification runs too when TURNSTILE_SECRET_KEY is configured.

const hits = new Map(); // ip -> [timestamps]

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8; // max 8 submissions / minute / IP
}

function cleanPhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured -> skip
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip || "" }),
    });
    const json = await res.json();
    return !!json.success;
  } catch {
    return false;
  }
}

async function notifyEmail(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  let to = process.env.LEAD_NOTIFY_EMAIL;
  if (!to) {
    // Fall back to the address configured in Admin → Settings.
    try {
      const { getSettings } = await import("../../../lib/db");
      to = (await getSettings()).lead_notify_email || "";
    } catch { /* ignore */ }
  }
  if (!apiKey || !to) return; // not configured -> skip silently
  const lines = [
    `New ${lead.type} enquiry — ${lead.name}`,
    ``,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || "-"}`,
    `Company: ${lead.company || "-"}`,
    `Event type: ${lead.event_type || "-"}`,
    `Event date: ${lead.event_date || "-"}`,
    `Location: ${lead.location || "-"}`,
    `Guests: ${lead.guests || "-"}`,
    `Budget: ${lead.budget || "-"}`,
    `Source page: ${lead.source_page || "-"}`,
    ``,
    `Message:`,
    lead.message || "-",
    ``,
    `Call: https://wa.me/91${lead.phone}`,
  ].join("\n");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Samridhi Website <website@samridhifilms.in>",
        to: [to],
        subject: `New enquiry: ${lead.name} — ${lead.event_type || lead.type}`,
        text: lines,
      }),
    });
  } catch {
    /* email is best-effort; the lead is already saved */
  }
}

export async function POST(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return Response.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const b = await request.json().catch(() => ({}));

  // Honeypot: invisible field that bots fill in.
  if (b.company_website) {
    return Response.json({ ok: true }); // pretend success
  }

  const turnstileOk = await verifyTurnstile(b.turnstile_token, ip);
  if (!turnstileOk) {
    return Response.json({ error: "Bot check failed. Please try again." }, { status: 400 });
  }

  const name = String(b.name || "").trim();
  const phone = cleanPhone(b.phone);
  if (!name || name.length < 2) {
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!phone) {
    return Response.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }

  const allowedTypes = ["quote", "artist_booking", "wedding", "contact"];
  const type = allowedTypes.includes(b.type) ? b.type : "quote";

  const lead = {
    type,
    name,
    company: String(b.company || "").slice(0, 200),
    phone,
    email: String(b.email || "").slice(0, 200),
    event_type: String(b.event_type || "").slice(0, 200),
    event_date: b.event_date || null,
    location: String(b.location || "").slice(0, 300),
    guests: String(b.guests || "").slice(0, 100),
    budget: String(b.budget || "").slice(0, 100),
    message: String(b.message || "").slice(0, 5000),
    artist_id: b.artist_id || null,
    source_page: String(b.source_page || "").slice(0, 300),
    utm: b.utm && typeof b.utm === "object" ? b.utm : {},
    ip_hash: ip === "unknown" ? "" : Buffer.from(ip).toString("base64").slice(0, 24),
  };

  try {
    const { error } = await supabaseAdmin().from("leads").insert(lead);
    if (error) throw error;
  } catch (e) {
    return Response.json({ error: "Could not save your enquiry. Please call us directly." }, { status: 500 });
  }

  try { await notifyEmail(lead); } catch { /* email must never fail the submission */ }
  return Response.json({ ok: true });
}
