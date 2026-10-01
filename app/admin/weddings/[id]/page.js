"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, uploadFile } from "../../../../lib/adminApi";
import MediaPicker from "../../_lib/MediaPicker";
import PreviewModal from "../../_lib/PreviewModal";

const empty = { title: "", location: "", event_date: "", description: "", cover_image: "", gallery: [], pinned: false, sort: 0, status: "published", is_placeholder: false };

export default function WeddingEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [picker, setPicker] = useState(null); // { kind, multi, target }
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isNew) api(`/api/admin/weddings/${id}`).then(({ wedding }) => setF({ ...empty, ...wedding, gallery: wedding.gallery || [] })).catch(() => {});
  }, [id, isNew]);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
  };

  const upload = async (file, kind) => {
    setUploading(kind);
    try {
      const m = await uploadFile(file);
      setF((p) => kind === "cover" ? { ...p, cover_image: m.url } : { ...p, gallery: [...p.gallery, m.url] });
    } catch (e) { setMsg("Upload failed: " + e.message); }
    setUploading("");
  };

  const applyPick = (item) => {
    if (!picker) return;
    if (picker.target === "gallery") setF((p) => ({ ...p, gallery: [...p.gallery, item.url] }));
    else setF((p) => ({ ...p, cover_image: item.url }));
  };

  const save = async () => {
    if (!f.title.trim()) { setMsg("Please add a title."); return; }
    setBusy(true); setMsg("");
    try {
      if (isNew) {
        const { wedding } = await api("/api/admin/weddings", { method: "POST", body: f });
        router.push(`/admin/weddings/${wedding.id}`);
      } else {
        await api(`/api/admin/weddings/${id}`, { method: "PUT", body: f });
        setMsg("Saved ✓ — the website will refresh within a minute.");
      }
    } catch (e) { setMsg("Save failed: " + e.message); }
    setBusy(false);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1>{isNew ? "New Wedding" : "Edit Wedding"}</h1></div>
        <Link className="btn-sm btn-edit" href="/admin/weddings">← Back</Link>
      </div>
      {msg && <div className="login-err" style={{ background: msg.startsWith("Saved") ? "#e8f5e9" : "#fce4ec", color: msg.startsWith("Saved") ? "#2e7d32" : "#c62828", marginBottom: 16 }}>{msg}</div>}

      <div className="editor" style={{ marginBottom: 20 }}>
        <div className="field"><label>Title *</label><input value={f.title} onChange={set("title")} placeholder="e.g. Aarav & Diya — Udaipur Palace Wedding" /></div>
        <div className="form-row">
          <div className="field"><label>Location</label><input value={f.location} onChange={set("location")} placeholder="e.g. Udaipur" /></div>
          <div className="field"><label>Date</label><input type="date" value={f.event_date || ""} onChange={set("event_date")} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows={4} value={f.description} onChange={set("description")} placeholder="A few lines about this celebration…" /></div>
        <label className="check-row"><input type="checkbox" checked={!!f.pinned} onChange={set("pinned")} /> ★ Pin to homepage (max 10 shown)</label>
        <div className="form-row">
          <div className="field"><label>Status</label>
            <select value={f.status || "published"} onChange={set("status")}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <label className="check-row"><input type="checkbox" checked={!!f.is_placeholder} onChange={set("is_placeholder")} /> Mark as placeholder</label>
          </div>
        </div>
      </div>

      <div className="editor" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Photos</h2>
        <div className="field"><label>Cover photo</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && upload(e.target.files[0], "cover")} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => setPicker({ kind: "image", target: "cover" })}>📚 Choose from library</button>
          </div>
          {uploading === "cover" && <div className="seo-hint">Uploading…</div>}
          <div className="seo-hint">📐 Suggested: 1600 × 900 px (16:9)</div>
          {f.cover_image && <div className="img-preview"><div className="img-thumb"><img src={f.cover_image} alt="cover" onClick={() => setPreview({ url: f.cover_image, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" /><button onClick={() => setF((p) => ({ ...p, cover_image: "" }))}>×</button></div></div>}
        </div>
        <div className="field"><label>Photo gallery</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="image/*" multiple onChange={(e) => { for (const file of e.target.files) upload(file, "gallery"); }} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => setPicker({ kind: "image", target: "gallery" })}>📚 Choose from library</button>
          </div>
          {uploading === "gallery" && <div className="seo-hint">Uploading…</div>}
          <div className="img-preview">{f.gallery.map((g) => (
            <span className="img-thumb" key={g}><img src={g} alt="" onClick={() => setPreview({ url: g, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" /><button onClick={() => setF((p) => ({ ...p, gallery: p.gallery.filter((x) => x !== g) }))}>×</button></span>
          ))}</div>
        </div>
      </div>

      <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "💾 Save Wedding"}</button>
      {picker && <MediaPicker open={!!picker} kind={picker.kind} onClose={() => setPicker(null)} onSelect={applyPick} />}
      {preview && <PreviewModal url={preview.url} kind={preview.kind} onClose={() => setPreview(null)} />}
    </>
  );
}
