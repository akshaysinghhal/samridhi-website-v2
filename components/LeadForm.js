"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const EVENT_TYPES = [
  "Wedding / Destination Wedding",
  "Sangeet / Mehendi / Haldi",
  "Corporate Event",
  "Government Event",
  "Celebrity / Artist Booking",
  "Birthday / Private Party",
  "Concert / Live Show",
  "Brand Promotion / Road Show",
  "Exhibition",
  "Other",
];

function cleanPhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  const ten =
    d.length === 12 && d.startsWith("91") ? d.slice(2)
    : d.length === 11 && d.startsWith("0") ? d.slice(1)
    : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

// Shared lead form. POSTs to /api/leads, redirects to /thank-you on success.
// Props: { type: 'quote'|'artist_booking'|'wedding'|'contact', artistId, compact, presetEventType }
export default function LeadForm({ type = "quote", artistId = null, compact = false, presetEventType = "" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", company: "", phone: "", email: "",
    event_type: presetEventType, event_date: "", location: "",
    guests: "", budget: "", message: "",
  });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) { setError("Please enter your name."); return; }
    const phone = cleanPhone(form.phone);
    if (!phone) { setError("Please enter a valid 10-digit Indian mobile number."); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Please enter a valid email address."); return; }

    setSending(true);
    try {
      const utm = {};
      try {
        const q = new URLSearchParams(window.location.search);
        ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
          if (q.get(k)) utm[k] = q.get(k);
        });
      } catch { /* ignore */ }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          phone,
          type,
          artist_id: artistId,
          source_page: typeof window !== "undefined" ? window.location.pathname : "",
          utm,
          company_website: "", // honeypot — bots fill this
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      try {
        const { trackEvent } = await import("../lib/analytics");
        trackEvent("generate_lead", { form_type: type || "quote", event_type: form.event_type || "" });
      } catch { /* analytics must never break the form */ }
      router.push("/thank-you");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const field = (label, key, props = {}) => (
    <div className="field">
      <label>{label}</label>
      <input value={form[key]} onChange={set(key)} {...props} />
    </div>
  );

  return (
    <form className="form-card lead-form" onSubmit={submit} noValidate>
      <h3>{compact ? "Get a Free Quote" : "Tell Us About Your Event"}</h3>
      {error && <div className="form-err" style={{ marginBottom: 16 }}>{error}</div>}

      {/* honeypot — invisible to humans */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off"
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }} aria-hidden="true" />

      <div className="form-row">
        {field("Your Name *", "name", { placeholder: "Full name", required: true })}
        {field("Mobile Number *", "phone", { placeholder: "10-digit mobile", inputMode: "tel", required: true })}
      </div>

      {!compact && (
        <>
          <div className="form-row">
            {field("Company / Organization", "company", { placeholder: "If applicable" })}
            {field("Email", "email", { placeholder: "you@example.com", inputMode: "email" })}
          </div>
          <div className="form-row">
            <div className="field">
              <label>Event Type</label>
              <select value={form.event_type} onChange={set("event_type")}>
                <option value="">Select…</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {field("Event Date", "event_date", { type: "date" })}
          </div>
          <div className="form-row">
            {field("Event Location", "location", { placeholder: "City / venue" })}
            {field("Expected Guests", "guests", { placeholder: "e.g. 200" })}
          </div>
          {field("Estimated Budget", "budget", { placeholder: "e.g. ₹5–10 lakh" })}
        </>
      )}
      {compact && (
        <div className="field">
          <label>Event Type</label>
          <select value={form.event_type} onChange={set("event_type")}>
            <option value="">Select…</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      <div className="field">
        <label>Requirement / Message</label>
        <textarea rows={compact ? 3 : 4} value={form.message} onChange={set("message")}
          placeholder="Tell us about your celebration — dates, venue, artists you love…" />
      </div>

      <button className="btn btn-primary" type="submit" disabled={sending} style={{ width: "100%" }}>
        {sending ? "Sending…" : "Get a Quote"}
      </button>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
        By submitting, you agree to be contacted about your enquiry. We never spam.
      </p>
    </form>
  );
}
