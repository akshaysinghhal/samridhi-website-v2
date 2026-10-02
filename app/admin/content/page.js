"use client";
import { useEffect, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { AdminLoader, toast } from "../_lib/ui";
import MediaPicker from "../_lib/MediaPicker";

const PAGE_LABELS = {
  home: "Home",
  about: "About Us",
  artists: "Artists",
  contact: "Contact",
  weddings: "Weddings",
  gallery: "Gallery",
  portfolio: "Portfolio",
  clients: "Clients",
  press: "Press",
  services: "Services",
  testimonials: "Testimonials",
  "couple-stories": "Couple Stories",
  "international-shows": "International Shows",
};
const pageLabel = (p) => PAGE_LABELS[p] || (p ? p.charAt(0).toUpperCase() + p.slice(1) : p);

// Sections in the order they appear on the public website, per page.
// The admin lists them in this order so editing follows the page top-to-bottom.
// Sections not listed here (unused/legacy) fall back to alphabetical at the end.
const SECTION_ORDER = {
  home: ["hero", "steps", "cta", "about", "stats"],
  about: ["hero", "story", "vision", "team", "approach", "why", "brands"],
  artists: ["hero", "list", "cta", "process"],
  contact: ["info", "hero"],
  weddings: ["hero"],
  gallery: ["hero"],
  portfolio: ["hero"],
  clients: ["hero"],
  press: ["hero"],
  services: ["hero"],
  testimonials: ["hero"],
  "couple-stories": ["hero"],
  "international-shows": ["hero"],
};
const sectionRank = (page, section) => {
  const order = SECTION_ORDER[page];
  const i = order ? order.indexOf(section) : -1;
  return i === -1 ? 999 : i;
};

export default function ContentEditor() {
  const [blocks, setBlocks] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState(null);
  const [pickerFor, setPickerFor] = useState(null); // block id whose image is being chosen
  const [aiBusyFor, setAiBusyFor] = useState(null); // image block id currently being AI-read

  useEffect(() => {
    (async () => {
      try { setBlocks((await api("/api/admin/content")).blocks); } catch { /* ignore */ }
      setBusy(false);
    })();
  }, []);

  const setVal = (id, v) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, value: v } : b)));
  const setImg = (id, url) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, image_url: url } : b)));

  // AI reads the section image and fills the section's EMPTY text fields.
  // Never overwrites existing content — review, then Save All.
  const aiFillFromImage = async (imgBlock, groupBlocks) => {
    if (aiBusyFor) return;
    if (!imgBlock.image_url) { toast("Set an image first.", "error"); return; }
    const emptyFields = groupBlocks.filter((x) => x.key !== "image" && !String(x.value || "").trim());
    if (!emptyFields.length) { toast("No empty text fields in this section.", "error"); return; }
    setAiBusyFor(imgBlock.id); setMsg("");
    try {
      const r = await api("/api/admin/ai-content-image", {
        method: "POST",
        body: { imageUrl: imgBlock.image_url, fields: emptyFields.map((x) => ({ label: x.label || x.key })) },
      });
      const sugg = r.suggestions || {};
      const filled = [];
      setBlocks((prev) => prev.map((x) => {
        const t = emptyFields.find((tb) => tb.id === x.id);
        if (t) {
          const v = sugg[t.label || t.key];
          if (v) { filled.push(t.label || t.key); return { ...x, value: v }; }
        }
        return x;
      }));
      if (filled.length) toast(`AI filled: ${filled.join(", ")} — review, then Save All.`);
      else { setMsg("AI found nothing reliable in that image to fill."); toast("AI found nothing reliable in that image to fill.", "error"); }
    } catch (e) { setMsg("AI failed: " + (e.message || "try again")); toast("AI failed: " + (e.message || "try again"), "error"); }
    setAiBusyFor(null);
  };

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api("/api/admin/content", { method: "PUT", body: { blocks: blocks.map((b) => ({ id: b.id, value: b.value, image_url: b.image_url })) } });
      setMsg("Saved ✓ — the website will refresh within a minute.");
      toast("Saved ✓ — the website will refresh within a minute.");
    } catch (e) { setMsg("Save failed: " + e.message); toast("Save failed: " + e.message, "error"); }
    setSaving(false);
  };

  if (busy) return <AdminLoader />;

  // Pages in first-appearance order, with field counts.
  const pages = [];
  const counts = {};
  for (const b of blocks) {
    if (!pages.includes(b.page)) pages.push(b.page);
    counts[b.page] = (counts[b.page] || 0) + 1;
  }
  const active = tab && pages.includes(tab) ? tab : pages[0];

  const groups = {};
  for (const b of blocks) {
    if (b.page !== active) continue;
    const g = `${b.page} · ${b.section}`;
    (groups[g] = groups[g] || []).push(b);
  }
  // Same order as the sections appear on the website.
  const groupList = Object.entries(groups).sort(([ga], [gb]) => {
    const sa = ga.split("·")[1]?.trim() || "";
    const sb = gb.split("·")[1]?.trim() || "";
    return sectionRank(active, sa) - sectionRank(active, sb) || sa.localeCompare(sb);
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1>Page Content</h1><p className="admin-sub">Edit headlines, text, contact details and page banner images across the website.</p></div>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save All"}</button>
      </div>
      {msg && <div className="login-err" style={{ background: "#e8f5e9", color: "#2e7d32", marginBottom: 20 }}>{msg}</div>}
      {pages.length > 1 && (
        <div className="pc-tabs" role="tablist" aria-label="Filter by page">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === active}
              className={"pc-tab" + (p === active ? " active" : "")}
              onClick={() => setTab(p)}
            >
              <b>{pageLabel(p)}</b>
              <span>{counts[p]} field{counts[p] === 1 ? "" : "s"}</span>
            </button>
          ))}
        </div>
      )}
      {groupList.map(([g, bs]) => (
        <div className="content-group" key={g}>
          <div className="sec">{g.split("·")[0].trim()}</div>
          <h2>{g.split("·")[1]?.trim()}</h2>
          {bs.map((b) => (
            b.key === "image" ? (
              <div className="field" key={b.id}>
                <label>{b.label || b.key}</label>
                {b.image_url ? (
                  <img src={b.image_url} alt="" style={{ width: "100%", maxWidth: 420, borderRadius: 12, display: "block", marginBottom: 10 }} />
                ) : (
                  <p className="admin-sub" style={{ margin: "0 0 10px" }}>No banner set — the page falls back to its default image.</p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="ai-chip" onClick={() => setPickerFor(b.id)}>🖼 Choose from library</button>
                  <button type="button" className="ai-chip" disabled={aiBusyFor === b.id || !b.image_url} onClick={() => aiFillFromImage(b, bs)}>
                    {aiBusyFor === b.id ? "✨ AI is looking…" : "✨ Fill fields with AI"}
                  </button>
                  <label className="ai-chip" style={{ cursor: "pointer" }}>
                    ⬆ Upload
                    <input type="file" accept="image/*" hidden onChange={async (e) => {
                      const fl = e.target.files?.[0];
                      e.target.value = "";
                      if (!fl) return;
                      try {
                        const m = await uploadFile(fl);
                        setImg(b.id, m.url);
                        toast("Banner image uploaded.");
                      } catch (err) { toast("Upload failed: " + err.message, "error"); }
                    }} />
                  </label>
                  {b.image_url && (
                    <button type="button" className="ai-chip" onClick={() => setImg(b.id, "")}>✕ Remove</button>
                  )}
                </div>
                <span className="seo-hint">{b.section === "hero" ? `This banner shows at the top of the ${pageLabel(b.page)} page.` : "This image shows in its section on the website."} AI reads the image and fills this section's empty text fields — review before Save All.</span>
              </div>
            ) : (
              <div className="field" key={b.id}>
                <label>{b.label || b.key}</label>
                {b.value.length > 120 ? (
                  <textarea rows={4} value={b.value} onChange={(e) => setVal(b.id, e.target.value)} />
                ) : (
                  <input value={b.value} onChange={(e) => setVal(b.id, e.target.value)} />
                )}
              </div>
            )
          ))}
        </div>
      ))}
      {pages.length === 0 && (
        <div className="content-group"><p className="admin-sub" style={{ margin: 0 }}>No content blocks found yet.</p></div>
      )}
      <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save All"}</button>
      <MediaPicker open={!!pickerFor} kind="image" onClose={() => setPickerFor(null)}
        onSelect={(items) => {
          const a = Array.isArray(items) ? items : [items];
          if (a[0] && pickerFor) setImg(pickerFor, a[0].url);
          setPickerFor(null);
        }} />
    </>
  );
}
