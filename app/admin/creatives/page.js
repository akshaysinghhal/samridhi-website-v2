"use client";
import { useEffect, useRef, useState } from "react";
import MediaPicker from "../_lib/MediaPicker";
import { AiAssistModal } from "../_lib/AiAssist";
import { toast } from "../_lib/ui";
import { api } from "../../../lib/adminApi";
import { waLink } from "../../../lib/billing";
import { TEMPLATES } from "./templates";

// Creative Studio — design premium 1080×1080 social graphics (Instagram /
// Facebook) with the company logo, photos and AI-written copy, then download
// as PNG. Nothing here touches the public website.

const EMPTY = {
  eyebrow: "Samridhi Films & Television Presents",
  title: "",
  subtitle: "",
  photo: "",
  plannerPhoto: "",
  plannerName: "Sunil Jain",
  date: "",
  venue: "",
  showLogo: true,
  showEyebrow: true,
  palette: "peach",
};

const PASTEL_SWATCHES = [
  { id: "peach", label: "Peach", bg: "#FDEFE4", deep: "#B9553A" },
  { id: "mint", label: "Mint", bg: "#EAF4EC", deep: "#2F6B4F" },
  { id: "lavender", label: "Lavender", bg: "#F0EAF7", deep: "#6B4A8F" },
];

function useScaled() {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.35);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.1, el.clientWidth / 1080));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, scale];
}

// Fluid template thumbnail: the 1080px artwork scales to whatever width the
// grid column gives it, so cards fill their column on any screen size.
function Thumb({ Mini, data }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.14);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.05, el.clientWidth / 1080));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="creative-thumb">
      <div style={{ width: 1080, height: 1080, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
        <Mini d={data} />
      </div>
    </div>
  );
}

// Parse AI output shaped as labelled lines into the graphic fields.
// Falls back to using the whole text as the message.
function fillFromAi(text, apply) {
  const out = {};
  for (const line of String(text).split("\n")) {
    const m = line.match(/^\s*(eyebrow|title|headline|message|description|subtitle|venue|location|date)\s*[:\-–]\s*(.+?)\s*$/i);
    if (!m) continue;
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    if (!v) continue;
    if (k === "title" || k === "headline") out.title = v;
    else if (k === "eyebrow") out.eyebrow = v;
    else if (k === "venue" || k === "location") out.venue = v;
    else if (k === "date") out.date = v;
    else out.subtitle = out.subtitle ? out.subtitle + " " + v : v;
  }
  if (Object.keys(out).length === 0) out.subtitle = String(text).trim();
  apply(out);
  return out;
}

export default function CreativesAdmin() {
  const [templateId, setTemplateId] = useState("star");
  const [f, setF] = useState(EMPTY);
  const [picker, setPicker] = useState(null); // "photo" | "plannerPhoto" | null
  const [aiOpen, setAiOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState("");
  const [previewRef, previewScale] = useScaled();
  const exportRef = useRef(null);
  const [siteLogo, setSiteLogo] = useState("");

  // Website logo (Admin → Settings → Company) for the "Show company logo" pill.
  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/admin/site-settings");
        const u = String(r.settings?.logo_url || "").trim();
        if (u) setSiteLogo(u);
      } catch { /* default logo */ }
    })();
  }, []);

  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const Tpl = tpl.render;
  const data = { ...f, logoUrl: siteLogo || undefined };

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const onPick = (items) => {
    const arr = Array.isArray(items) ? items : [items];
    if (arr[0] && picker) set(picker, arr[0].url);
    setPicker(null);
  };

  const download = async () => {
    if (!exportRef.current || downloading) return;
    setDownloading(true); setMsg("");
    try {
      const mod = await import("html2canvas");
      const canvas = await mod.default(exportRef.current, {
        backgroundColor: null, useCORS: true, scale: 1, width: 1080, height: 1080,
      });
      const a = document.createElement("a");
      a.download = `samridhi-${templateId}-1080x1080.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      setMsg("PNG downloaded — ready to share on Instagram / Facebook.");
      toast("PNG downloaded — ready to share.");
    } catch (e) {
      setMsg("Export failed: " + (e.message || "please try again."));
    }
    setDownloading(false);
  };

  const aiSeed = `Write poster text for "${f.title || "our upcoming event"}"${f.venue ? ` in ${f.venue}` : ""}. Reply with ONLY these labelled lines, nothing else:\nEyebrow: (small line above the title)\nTitle: (big headline, max 5 words)\nMessage: (one warm line for the poster)\nDate: (event date)\nVenue: (event venue)`;

  const field = (label, key, ph, textarea) => (
    <div className="field"><label>{label}</label>
      {textarea
        ? <textarea rows={3} value={f[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} />
        : <input value={f[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} />}
    </div>
  );

  const photoField = (label, key) => (
    <div className="field"><label>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn-sm btn-edit" onClick={() => setPicker(key)}>📚 Choose photo</button>
        {f[key] && <button type="button" className="btn-sm btn-del" onClick={() => set(key, "")}>Remove</button>}
      </div>
      {f[key] && <div className="img-preview" style={{ marginTop: 8 }}><div className="img-thumb"><img src={f[key]} alt="" style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 10 }} /></div></div>}
    </div>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <h1>Creative Studio</h1>
      <p className="admin-sub">Design premium 1080 × 1080 graphics for Instagram &amp; Facebook — artist announcements, festival greetings, planner spotlights. Pick a template, add your photo &amp; words, download the PNG and share.</p>
      {msg && <div className="admin-ok" style={{ marginBottom: 16 }}>{msg}</div>}

      <h2 style={{ marginTop: 6 }}>1 · Choose a template</h2>
      <div className="creative-tpls">
        {TEMPLATES.map((t) => {
          const Mini = t.render;
          const active = t.id === templateId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={"creative-tpl" + (active ? " active" : "")}
              aria-pressed={active}
            >
              <Thumb Mini={Mini} data={data} />
              <div className="creative-tpl-name">{t.name}</div>
              <div className="creative-tpl-desc">{t.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="creative-grid">
        <div>
          <h2 style={{ marginTop: 0 }}>2 · Add your content</h2>
          <button type="button" className="ai-gen" style={{ marginBottom: 16 }} onClick={() => setAiOpen(true)}>✨ Write with AI — auto-fills the fields</button>
          <div className="field">
            <label>Pastel colourway</label>
            <div style={{ display: "flex", gap: 10 }}>
              {PASTEL_SWATCHES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set("palette", p.id)}
                  title={p.label}
                  aria-label={`Pastel colourway: ${p.label}`}
                  style={{
                    width: 52, height: 52, borderRadius: "50%", cursor: "pointer",
                    background: `linear-gradient(135deg, ${p.bg} 50%, ${p.deep} 50%)`,
                    border: f.palette === p.id ? "3px solid #8F3F2D" : "2px solid #e3d5c0",
                  }}
                />
              ))}
              <span className="seo-hint" style={{ margin: 0, alignSelf: "center" }}>
                {PASTEL_SWATCHES.find((p) => p.id === f.palette)?.label}
              </span>
            </div>
          </div>
          {field("Top line (eyebrow)", "eyebrow", "Samridhi Films & Television Presents")}
          {field("Headline", "title", tpl.id === "greeting" ? "Happy Diwali" : "Govinda")}
          {field("Message", "subtitle", "One warm line for the graphic", true)}
          <div className="form-row">
            {field("Date", "date", "25 Oct 2026")}
            {field("Venue", "venue", "Bhilwara, Rajasthan")}
          </div>
          {photoField("Main photo", "photo")}
          {(tpl.id === "spotlight" || tpl.fields.includes("planner")) && (
            <>
              {photoField("Event planner photo", "plannerPhoto")}
              {field("Event planner name", "plannerName", "Sunil Jain")}
            </>
          )}
          <label className="check-row">
            <input type="checkbox" checked={f.showLogo} onChange={(e) => set("showLogo", e.target.checked)} />
            <b>Show company logo</b>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={f.showEyebrow} onChange={(e) => set("showEyebrow", e.target.checked)} />
            <b>Show top line (eyebrow)</b>
          </label>
          <div className="seo-hint" style={{ marginTop: 10 }}>Photos come from your Media Library — upload there first, or pick any image already uploaded.</div>
        </div>

        <div>
          <h2 style={{ marginTop: 0 }}>3 · Preview &amp; download</h2>
          <div ref={previewRef} style={{ width: "100%", maxWidth: 560, border: "1px solid #ecd9c8", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
            <div style={{ height: 1080 * previewScale }}>
              <div style={{ width: 1080, height: 1080, transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                <Tpl d={data} />
              </div>
            </div>
          </div>
          <div className="creative-actions">
            <button type="button" className="btn btn-primary creative-dl" onClick={download} disabled={downloading} style={{ padding: "13px 30px", fontSize: 15 }}>
              {downloading ? "Preparing PNG…" : "⬇ Download PNG (1080 × 1080)"}
            </button>
            <button type="button" className="btn btn-dark" style={{ padding: "13px 24px", fontSize: 15 }}
              onClick={() => {
                const msg = `Sharing a creative from Samridhi Films & Television${f.title ? ` — "${f.title}"` : ""}.\n\nAttaching the image right after this message.`;
                window.open(waLink("", msg), "_blank");
              }}>
              💬 Share on WhatsApp
            </button>
          </div>
          <div className="seo-hint" style={{ marginTop: 8 }}>Square 1080 × 1080 — perfect for Instagram posts and Facebook. Download, then share straight from your phone.</div>
        </div>
      </div>

      {/* Hidden natural-size node used only for the PNG export */}
      <div aria-hidden="true" className="creative-export-node">
        <div ref={exportRef} style={{ width: 1080, height: 1080 }}>
          <Tpl d={data} />
        </div>
      </div>

      <MediaPicker open={!!picker} kind="image" onClose={() => setPicker(null)} onSelect={onPick} />
      <AiAssistModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Write graphic text with AI"
        seedPrompt={aiSeed}
        onInsert={(text) => { fillFromAi(text, (out) => setF((x) => ({ ...x, ...out }))); setAiOpen(false); }}
      />
    </>
  );
}
