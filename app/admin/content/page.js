"use client";
import { useEffect, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { AdminLoader, toast } from "../_lib/ui";

const PAGE_LABELS = {
  home: "Home",
  about: "About Us",
  artists: "Artists",
  contact: "Contact",
  weddings: "Weddings",
};
const pageLabel = (p) => PAGE_LABELS[p] || (p ? p.charAt(0).toUpperCase() + p.slice(1) : p);

export default function ContentEditor() {
  const [blocks, setBlocks] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState(null);

  useEffect(() => {
    (async () => {
      try { setBlocks((await api("/api/admin/content")).blocks); } catch { /* ignore */ }
      setBusy(false);
    })();
  }, []);

  const setVal = (id, v) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, value: v } : b)));

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

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1>Page Content</h1><p className="admin-sub">Edit headlines, text and contact details across the website.</p></div>
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
      {Object.entries(groups).map(([g, bs]) => (
        <div className="content-group" key={g}>
          <div className="sec">{g.split("·")[0].trim()}</div>
          <h2>{g.split("·")[1]?.trim()}</h2>
          {bs.map((b) => (
            <div className="field" key={b.id}>
              <label>{b.label || b.key}</label>
              {b.value.length > 120 ? (
                <textarea rows={4} value={b.value} onChange={(e) => setVal(b.id, e.target.value)} />
              ) : (
                <input value={b.value} onChange={(e) => setVal(b.id, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      ))}
      {pages.length === 0 && (
        <div className="content-group"><p className="admin-sub" style={{ margin: 0 }}>No content blocks found yet.</p></div>
      )}
      <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save All"}</button>
    </>
  );
}
