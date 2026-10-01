"use client";
import { useEffect, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { AdminLoader, toast } from "../_lib/ui";

export default function ContentEditor() {
  const [blocks, setBlocks] = useState([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  const groups = {};
  for (const b of blocks) {
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
      <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save All"}</button>
    </>
  );
}
