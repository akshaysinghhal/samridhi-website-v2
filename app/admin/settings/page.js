"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, SaveButton, AdminLoader, toast } from "../_lib/ui";
import MediaPicker from "../_lib/MediaPicker";
import { TextField, ColorField, AddressListField, THEME_DEFAULTS, isHex } from "../_lib/settingsFields";

// Website theme defaults — the luxury editorial palette. Changing these in
// Admin → Settings → Website theme re-skins the whole public site.

export default function SettingsAdmin() {
  const [s, setS] = useState({});
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [logoPicker, setLogoPicker] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const r = await api("/api/admin/site-settings");
      setS(r.settings || {});
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));

  const save = async (keys, label) => {
    setMsg(""); setOkMsg("");
    try {
      for (const k of keys) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: s[k] ?? null } });
      await revalidateSite(["/"]);
      setOkMsg((label || "Settings") + " saved.");
      toast((label || "Settings") + " saved.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const saveTheme = async () => {
    setMsg(""); setOkMsg("");
    try {
      for (const k of Object.keys(THEME_DEFAULTS)) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: s[k] ?? null } });
      // Theme lives in the shared layout — revalidate it, not just one page.
      await revalidateSite(["/"], "layout");
      setOkMsg("Theme saved — the whole website now uses your colours.");
      toast("Theme saved — the whole website now uses your colours.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const resetTheme = async () => {
    setMsg(""); setOkMsg("");
    try {
      const next = { ...s, ...THEME_DEFAULTS };
      setS(next);
      for (const [k, v] of Object.entries(THEME_DEFAULTS)) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: v } });
      await revalidateSite(["/"], "layout");
      setOkMsg("Theme reset to the default terracotta palette.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  if (busy) return (<><h1>Settings</h1><AdminLoader /></>);

  return (
    <>
      <h1>Settings</h1>
      <p className="admin-sub">Website content &amp; appearance — company info, theme, contact, addresses, socials and media. Integrations (analytics, AI, legal, indexing) live under <a href="/admin/integrations">Integrations &amp; AI</a>. Each section saves separately.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      <div className="content-group">
        <div className="sec">Company</div><h2>Company</h2>
        <TextField s={s} set={set} k="company_name" label="Company name" />
        <TextField s={s} set={set} k="tagline1" label="Tagline 1" />
        <TextField s={s} set={set} k="tagline2" label="Tagline 2" />
        <TextField s={s} set={set} k="since" label="Serving since (year)" />
        <div className="field">
          <label>Website logo <span className="seo-hint" style={{ fontWeight: 400 }}>— header, footer, share cards &amp; PDFs use this (leave empty for the default logo)</span></label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn-sm btn-edit" onClick={() => setLogoPicker(true)}>📚 Choose from library</button>
            {s.logo_url && <button type="button" className="btn-sm btn-del" onClick={() => set("logo_url", "")}>Remove</button>}
          </div>
          {s.logo_url && (
            <div className="img-preview" style={{ marginTop: 8, background: "#fff" }}>
              <img src={s.logo_url} alt="Website logo" style={{ maxHeight: 64 }} />
            </div>
          )}
        </div>
        <SaveButton onClick={() => save(["company_name", "tagline1", "tagline2", "since", "logo_url"], "Company")}>Save</SaveButton>
      </div>
      <MediaPicker
        open={logoPicker}
        kind="image"
        onClose={() => setLogoPicker(false)}
        onSelect={(m) => { if (m?.url) set("logo_url", m.url); setLogoPicker(false); }}
      />

      <div className="content-group">
        <div className="sec">Theme</div><h2>Website theme</h2>
        <p className="seo-hint" style={{ marginTop: 0 }}>One place to re-skin the whole website — buttons, links, headings, badges and highlights everywhere update to your colours.</p>
        <div className="theme-row">
          <ColorField s={s} set={set} k="theme_primary" label="Primary" hint="Buttons, links, main accents" />
          <ColorField s={s} set={set} k="theme_deep" label="Deep shade" hint="Hover states, dark sections" />
          <ColorField s={s} set={set} k="theme_gold" label="Gold accent" hint="Badges, dividers, highlights" />
          <ColorField s={s} set={set} k="theme_brown" label="Brown shade" hint="Dark bands, buttons, bottom bar" />
          <ColorField s={s} set={set} k="theme_footer" label="Footer background" hint="Bottom footer band (leave same as brown to match)" />
        </div>
        <div className="theme-preview" aria-hidden="true">
          <span className="tp-btn" style={{ background: isHex(s.theme_primary) ? s.theme_primary.trim() : THEME_DEFAULTS.theme_primary }}>Book Now</span>
          <span className="tp-text" style={{ color: isHex(s.theme_deep) ? s.theme_deep.trim() : THEME_DEFAULTS.theme_deep }}>Creating Experiences. Delivering Excellence.</span>
          <span className="tp-badge" style={{ background: isHex(s.theme_gold) ? s.theme_gold.trim() : THEME_DEFAULTS.theme_gold }}>Since 1999</span>
          <span className="tp-footer" style={{ background: isHex(s.theme_brown) ? s.theme_brown.trim() : THEME_DEFAULTS.theme_brown }}>Brown</span>
          <span className="tp-footer" style={{ background: isHex(s.theme_footer) ? s.theme_footer.trim() : THEME_DEFAULTS.theme_footer }}>Footer</span>
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
        <AddressListField s={s} set={set} />
        <SaveButton onClick={() => save(["addresses"], "Addresses")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Announcement</div><h2>Announcement bar</h2>
        <p className="admin-sub" style={{ marginTop: 0 }}>Show a slim announcement strip above the header on every page — for upcoming events, season bookings, or any news.</p>
        <label className="check-row">
          <input type="checkbox" checked={s.announcement_enabled === true} onChange={(e) => set("announcement_enabled", e.target.checked)} />
          <b>Show announcement bar on the website</b>
        </label>
        <TextField s={s} set={set} k="announcement_text" label="Announcement text" hint="e.g. Now booking for the 2026–27 wedding season across Rajasthan." />
        <TextField s={s} set={set} k="announcement_link_label" label="Link label (optional)" hint="e.g. Enquire now" />
        <TextField s={s} set={set} k="announcement_link_url" label="Link URL (optional)" hint="A page like /contact or a full https:// link." />
        <SaveButton onClick={() => save(["announcement_enabled", "announcement_text", "announcement_link_label", "announcement_link_url"], "Announcement")}>Save</SaveButton>
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
        <div className="sec">Media</div><h2>Media storage</h2>
        <TextField s={s} set={set} k="cloudinary_storage_limit_gb" label="Cloudinary storage limit (GB)" hint="Used to show available space in the Media Library. Free plan = 25 GB — change this only if your plan is different." />
        <SaveButton onClick={() => save(["cloudinary_storage_limit_gb"], "Media storage")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Artist disclaimer</div><h2>Artist disclaimer</h2>
        <div className="field"><label>Disclaimer text (shown near artist listings)</label>
          <textarea rows={3} value={s.disclaimer || ""} onChange={(e) => set("disclaimer", e.target.value)} />
        </div>
        <SaveButton onClick={() => save(["disclaimer"], "Disclaimer")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Privacy</div><h2>Cookie banner</h2>
        <div className="field"><label>Cookie banner text</label><textarea rows={2} value={s.cookie_banner_text || ""} onChange={(e) => set("cookie_banner_text", e.target.value)} /></div>
        <SaveButton onClick={() => save(["cookie_banner_text"], "Cookie banner")}>Save</SaveButton>
      </div>
    </>
  );
}
