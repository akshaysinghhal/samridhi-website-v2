"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, uploadOne, SaveButton, AdminLoader, toast } from "../_lib/ui";
import MediaPicker from "../_lib/MediaPicker";

const SECTION_LABELS = {
  stats: "Hero stats",
  services: "Services",
  artists: "Artist management",
  portfolio: "Portfolio",
  couples: "Couple Stories",
  approach: "How It Works",
  clients: "Client logos",
  international: "International shows",
  press: "Press coverage",
  testimonials: "Testimonials",
  cta: "Call-to-action banner",
};

export default function HomepageAdmin() {
  const [settings, setSettings] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState([]);
  const [picker, setPicker] = useState(null); // "hero_video" | "hero_video_mobile" | "hero_poster"

  const load = async () => {
    setBusy(true);
    try {
      const [s, c] = await Promise.all([api("/api/admin/site-settings"), api("/api/admin/content")]);
      setSettings(s.settings || {});
      setBlocks((c.blocks || []).filter((b) => b.page === "home"));
      const st = s.settings?.stats;
      setStats(Array.isArray(st) ? st : [{ value: "1000+", label: "Events delivered" }, { value: "20+", label: "Years of experience" }, { value: "1999", label: "Serving since" }]);
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const heroBlocks = blocks.filter((b) => b.section === "hero");
  const coupleBlocks = blocks.filter((b) => b.section === "couples");
  const setBlock = (id, value) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, value } : b)));
  const setSetting = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const saveSettingsKeys = async (keys) => {
    setMsg(""); setOkMsg("");
    try {
      for (const k of keys) await api("/api/admin/site-settings", { method: "PUT", body: { key: k, value: settings[k] ?? null } });
      await revalidateSite(["/"]);
      setOkMsg("Saved — homepage updated.");
      toast("Saved — homepage updated.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const saveBlocks = async (ids) => {
    setMsg(""); setOkMsg("");
    try {
      await api("/api/admin/content", {
        method: "PUT",
        body: { blocks: ids.map((id) => { const b = blocks.find((x) => x.id === id); return { id, value: b.value, image_url: b.image_url || null }; }) },
      });
      await revalidateSite(["/"]);
      setOkMsg("Saved — homepage updated.");
      toast("Saved — homepage updated.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const saveStats = () => { setSetting("stats", stats); saveSettingsKeys(["stats"]); };
  const saveSections = () => saveSettingsKeys(["home_sections"]);

  const sections = settings.home_sections && typeof settings.home_sections === "object" ? settings.home_sections : {};
  const setSection = (k, v) => setSetting("home_sections", { ...sections, [k]: v });

  if (busy) return (<><h1>Homepage</h1><AdminLoader /></>);

  return (
    <>
      <h1>Homepage</h1>
      <p className="admin-sub">Everything on the homepage is editable here. Each section saves separately.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      <div className="content-group">
        <div className="sec">Hero</div>
        <h2>Hero video</h2>
        <div className="form-row">
          <div className="field"><label>Desktop video URL</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1 }} value={settings.hero_video || ""} onChange={(e) => setSetting("hero_video", e.target.value)} placeholder="Cloudinary / mp4 URL" />
              <button type="button" className="btn-sm btn-edit" onClick={() => setPicker("hero_video")} style={{ whiteSpace: "nowrap" }}>📚 Library</button>
            </div>
          </div>
          <div className="field"><label>Mobile video URL (optional)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1 }} value={settings.hero_video_mobile || ""} onChange={(e) => setSetting("hero_video_mobile", e.target.value)} placeholder="Smaller file for phones" />
              <button type="button" className="btn-sm btn-edit" onClick={() => setPicker("hero_video_mobile")} style={{ whiteSpace: "nowrap" }}>📚 Library</button>
            </div>
          </div>
        </div>
        <div className="field"><label>Poster image (shown while the video loads)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn-sm btn-edit" onClick={() => setPicker("hero_poster")}>📚 Choose from library</button>
            <span className="seo-hint" style={{ margin: 0 }}>or upload:</span>
            <input type="file" accept="image/*" onChange={async (e) => { const u = await uploadOne(e.target.files[0], setUploading, setMsg); if (u) setSetting("hero_poster", u); e.target.value = ""; }} />
          </div>
          {uploading && <div className="seo-hint">Uploading…</div>}
          {settings.hero_poster && <div className="img-preview"><img src={settings.hero_poster} alt="" /></div>}
        </div>
        <SaveButton onClick={() => saveSettingsKeys(["hero_video", "hero_video_mobile", "hero_poster"])}>Save Hero Media</SaveButton>
      </div>
      <MediaPicker
        open={!!picker}
        kind={picker === "hero_poster" ? "image" : "video"}
        onClose={() => setPicker(null)}
        onSelect={(m) => { if (picker && m?.url) setSetting(picker, m.url); }}
      />

      <div className="content-group">
        <div className="sec">Hero</div>
        <h2>Hero copy</h2>
        {heroBlocks.map((b) => (
          <div className="field" key={b.id}><label>{b.label || b.key}</label>
            <input value={b.value} onChange={(e) => setBlock(b.id, e.target.value)} />
          </div>
        ))}
        <SaveButton onClick={() => saveBlocks(heroBlocks.map((b) => b.id))}>Save Hero Copy</SaveButton>
      </div>

      <div className="content-group">
        <div className="sec">Stats</div>
        <h2>Hero stats</h2>
        <p className="seo-hint" style={{ marginTop: 0 }}>Shown once, overlaid at the bottom of the homepage hero (first 3 used).</p>
        {stats.map((s, i) => (
          <div key={i} className="form-row" style={{ alignItems: "flex-end" }}>
            <div className="field"><label>Value</label><input value={s.value || ""} onChange={(e) => { const n = [...stats]; n[i] = { ...n[i], value: e.target.value }; setStats(n); }} /></div>
            <div className="field"><label>Label</label><input value={s.label || ""} onChange={(e) => { const n = [...stats]; n[i] = { ...n[i], label: e.target.value }; setStats(n); }} /></div>
            <div className="field" style={{ flex: "0 0 auto" }}><button className="btn-sm btn-del" onClick={() => setStats(stats.filter((_, j) => j !== i))}>Remove</button></div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-sm btn-edit" onClick={() => setStats([...stats, { value: "", label: "" }])}>+ Add stat</button>
          <SaveButton onClick={saveStats}>Save Stats</SaveButton>
        </div>
      </div>

      <div className="content-group">
        <div className="sec">Couple Stories</div>
        <h2>Couple Stories heading</h2>
        {coupleBlocks.length === 0 && <p className="seo-hint">No couple-heading blocks yet — add them in Content → home → couples.</p>}
        {coupleBlocks.map((b) => (
          <div className="field" key={b.id}><label>{b.label || b.key}</label>
            <input value={b.value} onChange={(e) => setBlock(b.id, e.target.value)} />
          </div>
        ))}
        {coupleBlocks.length > 0 && <SaveButton onClick={() => saveBlocks(coupleBlocks.map((b) => b.id))}>Save Heading</SaveButton>}
      </div>

      <div className="content-group">
        <div className="sec">Layout</div>
        <h2>Section visibility</h2>
        <p className="admin-sub">Hide a homepage section without deleting its content.</p>
        <div className="toggle-grid">
          {Object.entries(SECTION_LABELS).map(([k, label]) => (
            <label key={k} className="check-row">
              <input type="checkbox" checked={sections[k] !== false} onChange={(e) => setSection(k, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
        <SaveButton style={{ marginTop: 12 }} onClick={saveSections}>Save Visibility</SaveButton>
      </div>
    </>
  );
}
