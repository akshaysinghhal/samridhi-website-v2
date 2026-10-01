"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, SaveButton, AdminLoader, toast } from "../_lib/ui";
import { TextField, PasswordField } from "../_lib/settingsFields";

const EMPTY_LEGAL = { legal_name: "", trade_name: "Samridhi Films & Television", gstin: "", pan: "", address: "", state: "Rajasthan", email: "", phone: "", grievance_officer: { name: "", email: "", phone: "" } };

export default function IntegrationsAdmin() {
  const [s, setS] = useState({});
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [launchTotal, setLaunchTotal] = useState(null);
  const [keySaved, setKeySaved] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [r, l] = await Promise.all([api("/api/admin/site-settings"), api("/api/admin/launch")]);
      setS(r.settings || {});
      setKeySaved(Array.isArray(r.masked) && r.masked.includes("gemini_api_key"));
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
      for (const k of keys) {
        // Write-only secrets: skip when the field is empty so the stored key is kept.
        if (k === "gemini_api_key" && !s[k]) continue;
        await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: s[k] ?? null } });
      }
      if (s.gemini_api_key) { setKeySaved(true); set("gemini_api_key", ""); }
      await revalidateSite(["/"]);
      setOkMsg((label || "Settings") + " saved.");
      toast((label || "Settings") + " saved.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const indexingOn = s.seo_indexing_enabled === true;

  if (busy) return (<><h1>Integrations &amp; AI</h1><AdminLoader /></>);

  return (
    <>
      <h1>Integrations &amp; AI</h1>
      <p className="admin-sub">Third-party connections and business setup — analytics, the AI writing assistant, lead alerts, legal details and search indexing. Each section saves separately.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      <div className="content-group">
        <div className="sec">AI</div><h2>✨ AI writing assistant</h2>
        <p className="seo-hint" style={{ marginTop: 0 }}>
          Powers the ✨ AI buttons in the blog editor, event &amp; artist forms, the Creative Studio and the floating AI helper.
          Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and paste it below.
          The key is stored server-side and never shown to website visitors.
        </p>
        <PasswordField s={s} set={set} k="gemini_api_key" label="Gemini API key" hint={keySaved ? "✓ Key saved on the server. Leave blank to keep it, or paste a new key to replace it." : "Starts with AIza… — keep it private."} />
        <TextField s={s} set={set} k="gemini_model" label="Model" hint="Default: gemini-2.0-flash. Change only if Google renames models." mono />
        <SaveButton onClick={() => save(["gemini_api_key", "gemini_model"], "AI")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Analytics</div><h2>Analytics</h2>
        <TextField s={s} set={set} k="ga4_id" label="GA4 Measurement ID" hint="e.g. G-XXXXXXXXXX" />
        <TextField s={s} set={set} k="meta_pixel_id" label="Meta Pixel ID" />
        <SaveButton onClick={() => save(["ga4_id", "meta_pixel_id"], "Analytics")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Media</div><h2>Media uploads</h2>
        <p className="seo-hint" style={{ marginTop: 0 }}>
          Photos and videos upload <b>directly from your browser to Cloudinary</b> (no file-size limit),
          using an <b>unsigned upload preset</b> from your Cloudinary dashboard
          (Settings → Upload → Upload presets → create one with Signing Mode <i>Unsigned</i>).
          Files land in the folder your preset points to.
        </p>
        <TextField s={s} set={set} k="cloudinary_upload_preset" label="Cloudinary unsigned upload preset" hint="Paste the preset name here. Uploads are disabled until this is set." mono />
        <SaveButton onClick={() => save(["cloudinary_upload_preset"], "Media uploads")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Leads</div><h2>Lead notifications</h2>
        <TextField s={s} set={set} k="lead_notify_email" label="Notification email for new leads" hint="Comma-separate multiple addresses." />
        <SaveButton onClick={() => save(["lead_notify_email"], "Lead notifications")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Billing</div><h2>Document numbering</h2>
        <p className="seo-hint" style={{ marginTop: 0 }}>Optional prefixes for new quotations and invoices. Leave blank for plain financial-year numbers (e.g. 2026-27/004).</p>
        <TextField s={s} set={set} k="quote_prefix" label="Quotation prefix" hint="e.g. your own series code — nothing is assumed." />
        <TextField s={s} set={set} k="invoice_prefix" label="Invoice prefix" />
        <TextField s={s} set={set} k="receipt_prefix" label="Receipt prefix" />
        <SaveButton onClick={() => save(["quote_prefix", "invoice_prefix", "receipt_prefix"], "Document numbering")}>Save</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Legal entity</div><h2>Legal entity &amp; GST</h2>
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
