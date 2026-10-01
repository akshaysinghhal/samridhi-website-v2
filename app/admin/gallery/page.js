"use client";
import { useEffect, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { ytThumb } from "../../../lib/video";
import { revalidateSite, PhBadge, StatusBadge, STATUS_OPTIONS, useBulk, BulkBar, CheckCell, SaveButton } from "../_lib/ui";
import PreviewModal from "../_lib/PreviewModal";

const CATEGORIES = ["Events", "Weddings", "Corporate", "Celebrity Shows", "Cultural", "Press", "Highlight Videos", "Other"];

export default function GalleryAdmin() {
  const [tab, setTab] = useState("photos");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = async () => {
    setBusy(true);
    try { setItems((await api("/api/admin/gallery-items")).items); } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const photos = items.filter((i) => i.kind === "photo");
  const videos = items.filter((i) => i.kind === "video");

  const bulk = useBulk({
    rows: items,
    patchRows: setItems,
    endpoint: "/api/admin/gallery-items",
    updateOne: (id, body) => api("/api/admin/gallery-items", { method: "PUT", body: { id, ...body } }),
    deleteOne: (id) => api(`/api/admin/gallery-items?id=${id}`, { method: "DELETE" }),
  });

  const refresh = async (silent) => {
    try { setItems((await api("/api/admin/gallery-items")).items); } catch { /* ignore */ }
    if (!silent) setBusy(false);
  };

  const update = (id, patch) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addPhotos = async (e) => {
    setUploading(true); setMsg("");
    for (const file of e.target.files) {
      try {
        const m = await uploadFile(file);
        await api("/api/admin/gallery-items", { method: "POST", body: { kind: "photo", title: file.name.replace(/\.[^.]+$/, ""), image_url: m.url, category: "Events", status: "published" } });
      } catch (err) { setMsg("Upload failed: " + err.message); }
    }
    setUploading(false); e.target.value = ""; await revalidateSite(); refresh();
  };

  const addYouTube = async () => {
    if (!ytUrl.trim()) { setMsg("Paste a YouTube URL first."); return; }
    setMsg("");
    try {
      await api("/api/admin/gallery-items", {
        method: "POST",
        body: { kind: "video", title: ytTitle || "Event video", video_url: ytUrl.trim(), image_url: ytThumb(ytUrl.trim()), category: "Events", status: "published" },
      });
      setYtTitle(""); setYtUrl(""); await revalidateSite(); refresh();
    } catch (err) { setMsg("Failed: " + err.message); }
  };

  const addVideoFile = async (e) => {
    setUploading(true); setMsg("");
    for (const file of e.target.files) {
      try {
        const m = await uploadFile(file);
        await api("/api/admin/gallery-items", { method: "POST", body: { kind: "video", title: file.name.replace(/\.[^.]+$/, ""), video_url: m.url, image_url: "", category: "Events", status: "published" } });
      } catch (err) { setMsg("Upload failed: " + err.message); }
    }
    setUploading(false); e.target.value = ""; await revalidateSite(); refresh();
  };

  const saveItem = async (item) => {
    try {
      await api("/api/admin/gallery-items", {
        method: "PUT",
        body: { id: item.id, title: item.title, caption: item.caption || "", category: item.category || "Events", status: item.status || "published", is_placeholder: !!item.is_placeholder, sort: item.sort || 0 },
      });
      // The card already holds the edited values — just close the editor, no reload flash.
      setEditing(null); await revalidateSite();
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this item from the gallery?")) return;
    await api(`/api/admin/gallery-items?id=${id}`, { method: "DELETE" });
    await revalidateSite();
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  const card = (item) => (
    <div className="media-item" key={item.id} style={bulk.selected.has(item.id) ? { outline: "3px solid var(--brand)" } : undefined}>
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 4 }}>
        <CheckCell checked={bulk.selected.has(item.id)} onChange={() => bulk.toggleOne(item.id)} label={`Select ${item.title}`} />
      </div>
      <div onClick={() => setPreview({ url: item.kind === "photo" ? item.image_url : (item.video_url || item.image_url), kind: item.kind })} style={{ cursor: "zoom-in" }} title="Click to preview">
        {item.kind === "photo"
          ? <img src={item.image_url} alt={item.title} loading="lazy" />
          : (item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" /> : <video src={item.video_url} preload="metadata" muted />)}
        {item.kind === "video" && (
          <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 999 }}>▶</span>
        )}
      </div>
      {item.is_placeholder && <div style={{ position: "absolute", top: 8, left: item.kind === "video" ? 62 : 8 }}><PhBadge /></div>}
      <div className="meta" style={{ flexDirection: "column" }}>
        {/* Title shows as text on the card; editing happens inside Details below. */}
        <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.title}>
          {item.title || "Untitled"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <StatusBadge status={item.status} />
          <span className="seo-hint" style={{ margin: 0 }}>{item.category || "Events"}</span>
        </div>
        {editing === item.id ? (
          <div style={{ marginTop: 10 }}>
            <div className="field" style={{ marginBottom: 8 }}><label>Title</label>
              <input value={item.title || ""} onChange={(e) => update(item.id, { title: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 8 }}><label>Category</label>
              <select value={item.category || "Events"} onChange={(e) => update(item.id, { category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 8 }}><label>Caption</label>
              <input value={item.caption || ""} onChange={(e) => update(item.id, { caption: e.target.value })} placeholder="Shown under the photo on the website" />
            </div>
            <div className="field" style={{ marginBottom: 8 }}><label>Status</label>
              <select value={item.status || "published"} onChange={(e) => update(item.id, { status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <label className="check-row" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={!!item.is_placeholder} onChange={(e) => update(item.id, { is_placeholder: e.target.checked })} /> Placeholder
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <SaveButton onClick={() => saveItem(item)} className="btn-sm btn-new">Save</SaveButton>
              <button className="btn-sm btn-edit" onClick={() => { setEditing(null); refresh(); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <a className="btn-sm btn-view" href="/gallery" target="_blank" rel="noreferrer">Preview</a>
            <button className="btn-sm btn-edit" onClick={() => setEditing(item.id)}>Details</button>
            <button className="btn-sm btn-del" onClick={() => remove(item.id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <h1>Gallery</h1>
      <p className="admin-sub">Photos and videos shown in the homepage Gallery tabs. Use <b>Details</b> to set category, caption, status and placeholder flags.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}

      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}

      <div className="tabs" style={{ justifyContent: "flex-start", margin: "0 0 20px" }}>
        <button className={`tab-btn ${tab === "photos" ? "active" : ""}`} onClick={() => setTab("photos")}>📷 Photos ({photos.length})</button>
        <button className={`tab-btn ${tab === "videos" ? "active" : ""}`} onClick={() => setTab("videos")}>🎬 Videos ({videos.length})</button>
      </div>

      {tab === "photos" && (
        <>
          <label className="btn btn-primary" style={{ cursor: "pointer" }}>
            {uploading ? "Uploading…" : "+ Upload Photos"}
            <input type="file" accept="image/*" multiple hidden onChange={addPhotos} />
          </label>
          {busy ? <p>Loading…</p> : <div className="media-grid">{photos.map(card)}</div>}
        </>
      )}

      {tab === "videos" && (
        <>
          <div className="editor" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>Add YouTube video</h2>
            <div className="form-row">
              <div className="field"><label>Title</label><input value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} placeholder="e.g. Sangeet night highlights" /></div>
              <div className="field"><label>YouTube URL</label><input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" /></div>
            </div>
            <SaveButton onClick={addYouTube}>+ Add Video</SaveButton>
            <p className="seo-hint" style={{ marginTop: 10 }}>The thumbnail is picked up automatically from YouTube.</p>
          </div>
          <div className="editor" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>Or upload a video file</h2>
            <label className="btn btn-dark" style={{ cursor: "pointer" }}>
              {uploading ? "Uploading…" : "+ Upload Video"}
              <input type="file" accept="video/*" multiple hidden onChange={addVideoFile} />
            </label>
          </div>
          {busy ? <p>Loading…</p> : <div className="media-grid">{videos.map(card)}</div>}
        </>
      )}
      {preview && (
        <PreviewModal url={preview.url} kind={preview.kind} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
