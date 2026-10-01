"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, SaveButton } from "../_lib/ui";

const EMPTY_LEGAL = { legal_name: "", trade_name: "Samridhi Films & Television", gstin: "", pan: "", address: "", state: "Rajasthan", email: "", phone: "", grievance_officer: { name: "", email: "", phone: "" } };

// Website theme defaults — the luxury editorial palette. Changing these in
// Admin → Settings → Website theme re-skins the whole public site.
const THEME_DEFAULTS = { theme_primary: "#B9553A", theme_deep: "#8F3F2D", theme_gold: "#C9A15A" };
const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(String(v || "").trim());

export default function SettingsAdmin() {
  const [s, setS] = useState({});
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [launchTotal, setLaunchTotal] = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const [r, l] = await Promise.all([api("/api/admin/site-settings"), api("/api/admin/launch")]);
      setS(r.settings || {});
      setLaunchTotal(l.total ?? null);
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const legal = (s.legal_entity && typeof s.legal_entity === "object") ? { ...EMPTY_LEGAL, ...s.legal_entity } : { ...EMPTY_LEGAL };
  const setLegal = (k, v) => set("legal_entity", { ...legal, [k]: v });
  const setGrievance = (k, v) => set("legal_entity", { ...legal, grievance_officer: { ...(legal.grievance_officer || {}), [k]: v } });

  const save = async (keys, label) => {
    setMsg(""); setOkMsg("");
    try {
      for (const k of keys) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: s[k] ?? null } });
      await revalidateSite(["/"]);
      setOkMsg((label || "Settings") + " saved.");
    } catch (e) { setMsg("Failed: " + e.message); }
  };

// Field components live at module level (not inside the page component) so their
// identity is stable across renders. Defining them inside would remount every
// input on each keystroke — losing text-field focus and instantly closing the
// native colour-picker popup while dragging.
function TextField({ k, s, set, label, hint }) {
  return (
    <div className="field"><label>{label}</label>
      <input value={s[k] || ""} onChange={(e) => set(k, e.target.value)} />
      {hint && <div className="seo-hint">{hint}</div>}
    </div>
  );
}

function ColorField({ k, s, set, label, hint }) {
  const valid = isHex(s[k]) ? String(s[k]).trim() : THEME_DEFAULTS[k];
  const setHex = (raw) => {
    let h = String(raw || "").trim();
    if (/^[0-9a-fA-F]{6}$/.test(h)) h = "#" + h;
    set(k, h);
  };
  return (
    <div className="field"><label>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="color"
          value={valid}
          onChange={(e) => set(k, e.target.value)}
          aria-label={label + " colour picker"}
          style={{ width: 52, height: 42, padding: 4, border: "1.5px solid #ecd9e4", borderRadius: 10, cursor: "pointer", background: "#fff" }}
        />
        <input
          value={s[k] ?? ""}
          onChange={(e) => setHex(e.target.value)}
          placeholder={THEME_DEFAULTS[k]}
          spellCheck={false}
          style={{ maxWidth: 130, fontFamily: "ui-monospace, monospace" }}
          aria-label={label + " hex value"}
        />
      </div>
      {hint && <div className="seo-hint">{hint}</div>}
    </div>
  );
}

  const saveTheme = async () => {
    setMsg(""); setOkMsg("");
    try {
      for (const k of Object.keys(THEME_DEFAULTS)) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: s[k] ?? null } });
      // Theme lives in the shared layout — revalidate it, not just one page.
      await revalidateSite(["/"], "layout");
      setOkMsg("Theme saved — the whole website now uses your colours.");
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const resetTheme = async () => {
    setMsg(""); setOkMsg("");
    try {
      const next = { ...s, ...THEME_DEFAULTS };
      setS(next);
      for (const [k, v] of Object.entries(THEME_DEFAULTS)) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: v } });
      await revalidateSite(["/"], "layout");
      setOkMsg("Theme reset to the default terracotta palette.");
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const indexingOn = s.seo_indexing_enabled === true;

  if (busy) return (<><h1>Settings</h1><p>Loading…</p></>);

  return (
    <>
      <h1>Settings</h1>
      <p className="admin-sub">Global site settings — company info, contact details, socials, analytics and legal. Each section saves separately.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      <div className="content-group">
        <div className="sec">Company</div><h2>Company</h2>
        <TextField s={s} set={set} k="company_name" label="Company name" />
        <TextField s={s} set={set} k="tagline1" label="Tagline 1" />
        <TextField s={s} set={set} k="tagline2" label="Tagline 2" />
        <TextField s={s} set={set} k="since" label="Serving since (year)" />
        <SaveButton onClick={() => save(["company_name", "tagline1", "tagline2", "since"], "Company")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Theme</div><h2>Website theme</h2>
        <p className="seo-hint" style={{ marginTop: 0 }}>One place to re-skin the whole website — buttons, links, headings, badges and highlights everywhere update to your colours.</p>
        <div className="theme-row">
          <ColorField s={s} set={set} k="theme_primary" label="Primary" hint="Buttons, links, main accents" />
          <ColorField s={s} set={set} k="theme_deep" label="Deep shade" hint="Hover states, dark sections" />
          <ColorField s={s} set={set} k="theme_gold" label="Gold accent" hint="Badges, dividers, highlights" />
        </div>
        <div className="theme-preview" aria-hidden="true">
          <span className="tp-btn" style={{ background: isHex(s.theme_primary) ? s.theme_primary.trim() : THEME_DEFAULTS.theme_primary }}>Book Now</span>
          <span className="tp-text" style={{ color: isHex(s.theme_deep) ? s.theme_deep.trim() : THEME_DEFAULTS.theme_deep }}>Creating Experiences. Delivering Excellence.</span>
          <span className="tp-badge" style={{ background: isHex(s.theme_gold) ? s.theme_gold.trim() : THEME_DEFAULTS.theme_gold }}>Since 1999</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <SaveButton onClick={saveTheme}>Save Theme</SaveButton>
          <button className="btn btn-dark" onClick={resetTheme}>Reset to defaults</button>
        </div>
      </div>

      <div className="content-group">
        <div className="sec">Contact</div><h2>Contact</h2>
        <div className="form-row">
          <TextField s={s} set={set} k="phone1" label="Phone 1" />
          <TextField s={s} set={set} k="phone2" label="Phone 2" />
        </div>
        <div className="form-row">
          <TextField s={s} set={set} k="whatsapp" label="WhatsApp number" hint="Digits only, with country code: 919602228846" />
          <TextField s={s} set={set} k="whatsapp_msg" label="Default WhatsApp message" />
        </div>
        <TextField s={s} set={set} k="email" label="Email" />
        <SaveButton onClick={() => save(["phone1", "phone2", "whatsapp", "whatsapp_msg", "email"], "Contact")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Addresses</div><h2>Addresses</h2>
        <div className="field"><label>Chittorgarh office</label><textarea rows={2} value={s.address_chittorgarh || ""} onChange={(e) => set("address_chittorgarh", e.target.value)} /></div>
        <div className="field"><label>Mumbai office</label><textarea rows={2} value={s.address_mumbai || ""} onChange={(e) => set("address_mumbai", e.target.value)} /></div>
        <SaveButton onClick={() => save(["address_chittorgarh", "address_mumbai"], "Addresses")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Socials</div><h2>Social media</h2>
        <TextField s={s} set={set} k="instagram" label="Instagram URL" />
        <TextField s={s} set={set} k="facebook" label="Facebook URL" />
        <TextField s={s} set={set} k="youtube" label="YouTube URL" />
        <SaveButton onClick={() => save(["instagram", "facebook", "youtube"], "Socials")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Hero</div><h2>Hero video</h2>
        <p className="seo-hint">Managed in detail at <a href="/admin/homepage">Homepage → Hero video</a>.</p>
        <TextField s={s} set={set} k="hero_video" label="Desktop video URL" />
        <TextField s={s} set={set} k="hero_video_mobile" label="Mobile video URL" />
        <TextField s={s} set={set} k="hero_poster" label="Poster image URL" />
        <SaveButton onClick={() => save(["hero_video", "hero_video_mobile", "hero_poster"], "Hero video")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Analytics</div><h2>Analytics</h2>
        <TextField s={s} set={set} k="ga4_id" label="GA4 Measurement ID" hint="e.g. G-XXXXXXXXXX" />
        <TextField s={s} set={set} k="meta_pixel_id" label="Meta Pixel ID" />
        <SaveButton onClick={() => save(["ga4_id", "meta_pixel_id"], "Analytics")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Artist disclaimer</div><h2>Artist disclaimer</h2>
        <div className="field"><label>Disclaimer text (shown near artist listings)</label>
          <textarea rows={3} value={s.disclaimer || ""} onChange={(e) => set("disclaimer", e.target.value)} />
        </div>
        <SaveButton onClick={() => save(["disclaimer"], "Disclaimer")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Legal entity</div><h2>Legal entity & GST</h2>
        <div className="form-row">
          <div className="field"><label>Legal name</label><input value={legal.legal_name} onChange={(e) => setLegal("legal_name", e.target.value)} /></div>
          <div className="field"><label>Trade name</label><input value={legal.trade_name} onChange={(e) => setLegal("trade_name", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>GSTIN</label><input value={legal.gstin} onChange={(e) => setLegal("gstin", e.target.value)} /></div>
          <div className="field"><label>PAN</label><input value={legal.pan} onChange={(e) => setLegal("pan", e.target.value)} /></div>
        </div>
        <div className="field"><label>Registered address</label><textarea rows={2} value={legal.address} onChange={(e) => setLegal("address", e.target.value)} /></div>
        <div className="form-row">
          <div className="field"><label>State</label><input value={legal.state} onChange={(e) => setLegal("state", e.target.value)} /></div>
          <div className="field"><label>Email</label><input value={legal.email} onChange={(e) => setLegal("email", e.target.value)} /></div>
          <div className="field"><label>Phone</label><input value={legal.phone} onChange={(e) => setLegal("phone", e.target.value)} /></div>
        </div>
        <h3 style={{ marginTop: 8 }}>Grievance officer</h3>
        <div className="form-row">
          <div className="field"><label>Name</label><input value={legal.grievance_officer?.name || ""} onChange={(e) => setGrievance("name", e.target.value)} /></div>
          <div className="field"><label>Email</label><input value={legal.grievance_officer?.email || ""} onChange={(e) => setGrievance("email", e.target.value)} /></div>
          <div className="field"><label>Phone</label><input value={legal.grievance_officer?.phone || ""} onChange={(e) => setGrievance("phone", e.target.value)} /></div>
        </div>
        <SaveButton onClick={() => save(["legal_entity"], "Legal entity")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Leads</div><h2>Lead notifications</h2>
        <TextField s={s} set={set} k="lead_notify_email" label="Notification email for new leads" hint="Comma-separate multiple addresses." />
        <SaveButton onClick={() => save(["lead_notify_email"], "Lead notifications")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Privacy</div><h2>Cookie banner</h2>
        <div className="field"><label>Cookie banner text</label><textarea rows={2} value={s.cookie_banner_text || ""} onChange={(e) => set("cookie_banner_text", e.target.value)} /></div>
        <SaveButton onClick={() => save(["cookie_banner_text"], "Cookie banner")}>Save</SaveButton>
      </div>

      <div className="content-group" style={indexingOn && launchTotal > 0 ? { border: "2px solid #e65100" } : undefined}>
        <div className="sec">SEO</div><h2>Search indexing</h2>
        <label className="check-row">
          <input type="checkbox" checked={indexingOn} onChange={(e) => set("seo_indexing_enabled", e.target.checked)} />
          <b>Allow search engines to index the site</b>
        </label>
        {indexingOn && launchTotal !== null && launchTotal > 0 && (
          <div className="admin-warn" style={{ marginTop: 12 }}>
            ⚠️ Indexing is ON but <b>{launchTotal} placeholder/draft items</b> still remain. Replace placeholders first (see <a href="/admin/launch">Launch Checklist</a>).
          </div>
        )}
        <SaveButton style={{ marginTop: 12 }} onClick={() => save(["seo_indexing_enabled"], "Indexing")}>Save</SaveButton>
      </div>
    </>
  );
}
