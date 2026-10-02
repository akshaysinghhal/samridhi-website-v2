"use client";
import { useEffect, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { ytThumb } from "../../../lib/video";
import { revalidateSite, PhBadge, StatusBadge, STATUS_OPTIONS, useBulk, BulkBar, CheckCell, SaveButton, StatusFilter, AdminLoader, toast, CircleProgress } from "../_lib/ui";
import PreviewModal from "../_lib/PreviewModal";

const CATEGORIES = ["Venue Entry", "Stage & Decor", "Events", "Weddings", "Corporate", "Government", "Celebrity Shows", "Cultural", "Behind the Scenes", "Press", "Highlight Videos", "Other"];

export default function GalleryAdmin() {
  const [tab, setTab] = useState("photos");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState([]); // [{ id, name, progress, error }]
  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setBusy(true);
    try { setItems((await api("/api/admin/gallery-items")).items); } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const matchesFilter = (i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (catFilter && (i.category || "Events") !== catFilter) return false;
    const needle = q.trim().toLowerCase();
    if (needle && !`${i.title || ""} ${i.caption || ""} ${i.category || ""}`.toLowerCase().includes(needle)) return false;
    return true;
  };
  const allPhotos = items.filter((i) => i.kind === "photo");
  const allVideos = items.filter((i) => i.kind === "video");
  const usedCats = [...new Set(items.map((i) => i.category || "Events"))].sort();
  const photos = allPhotos.filter(matchesFilter);
  const videos = allVideos.filter(matchesFilter);
  const tabItems = tab === "photos" ? photos : videos;

  // Bulk selection is scoped to the active tab, so "Select all" only
  // selects the photos (or videos) currently on screen.
  const bulk = useBulk({
    rows: tabItems,
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

  // Shared upload runner with circular progress. `makeItem(m, file)` builds the
  // gallery-item body from the uploaded Cloudinary file.
  const runUploads = async (files, makeItem) => {
    const list = [...files];
    if (!list.length) return;
    const jobs = list.map((file, i) => ({ id: `${Date.now()}-${i}`, name: file.name, progress: 0, error: "" }));
    setUploads((xs) => [...xs, ...jobs]);
    const setJob = (id, patch) => setUploads((xs) => xs.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    setUploading(true); setMsg("");
    let okCount = 0;
    for (let i = 0; i < list.length; i++) {
      const job = jobs[i];
      try {
        const m = await uploadFile(list[i], (p) => setJob(job.id, { progress: p }));
        setJob(job.id, { progress: 1 });
        await api("/api/admin/gallery-items", { method: "POST", body: makeItem(m, list[i]) });
        okCount++;
      } catch (err) {
        const msg = err.message || "Upload failed";
        job.error = msg;
        setJob(job.id, { error: msg });
      }
    }
    setUploading(false);
    if (okCount) {
      toast(okCount === 1 ? "Upload complete." : `${okCount} uploads complete.`);
      await revalidateSite(); refresh();
    } else {
      setMsg("Upload failed: " + (jobs.find((j) => j.error)?.error || "unknown error"));
    }
    setTimeout(() => setUploads((xs) => xs.filter((j) => j.error)), 4000);
  };

  const addPhotos = async (e) => {
    const files = e.target.files; e.target.value = "";
    await runUploads(files, (m, file) => ({
      kind: "photo", title: file.name.replace(/\.[^.]+$/, ""),
      image_url: m.url, category: "Events", status: "published",
    }));
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
    const files = e.target.files; e.target.value = "";
    await runUploads(files, (m, file) => ({
      kind: "video", title: file.name.replace(/\.[^.]+$/, ""),
      video_url: m.url, image_url: "", category: "Events", status: "published",
    }));
  };

  const saveItem = async (item) => {
    try {
      await api("/api/admin/gallery-items", {
        method: "PUT",
        body: { id: item.id, title: item.title, caption: item.caption || "", category: item.category || "Events", status: item.status || "published", is_placeholder: !!item.is_placeholder, sort: item.sort || 0 },
      });
      // The card already holds the edited values — just close the editor, no reload flash.
      setEditing(null); await revalidateSite();
      toast("Gallery item saved.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this item from the gallery?")) return;
    await api(`/api/admin/gallery-items?id=${id}`, { method: "DELETE" });
    await revalidateSite();
    setItems((xs) => xs.filter((x) => x.id !== id));
    toast("Deleted from gallery.");
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
        {item.caption ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }} title={item.caption}>
            {item.caption}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <StatusBadge status={item.status} />
          <span className="seo-hint" style={{ margin: 0 }}>{item.category || "Events"}</span>
        </div>
        {editing === item.id ? (
          <div className="g-details">
            <div className="g-details-head">Edit details</div>
            <div className="field"><label>Title</label>
              <input value={item.title || ""} onChange={(e) => update(item.id, { title: e.target.value })} placeholder="e.g. Sangeet night highlights" />
            </div>
            <div className="g-details-row">
              <div className="field"><label>Category</label>
                <select value={item.category || "Events"} onChange={(e) => update(item.id, { category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field"><label>Status</label>
                <select value={item.status || "published"} onChange={(e) => update(item.id, { status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Caption</label>
              <textarea value={item.caption || ""} onChange={(e) => update(item.id, { caption: e.target.value })} placeholder="Shown under the photo on the website" rows={2} />
              <span className="seo-hint">Shows under the title on the website gallery.</span>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={!!item.is_placeholder} onChange={(e) => update(item.id, { is_placeholder: e.target.checked })} /> Placeholder
            </label>
            <div className="g-details-actions">
              <SaveButton onClick={() => saveItem(item)} className="btn-sm btn-new">Save</SaveButton>
              <button className="btn-sm btn-edit" onClick={() => { setEditing(null); refresh(); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mi-actions">
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
      <p className="admin-sub">Photos and videos on the website's <b>Gallery</b> page. Use <b>Details</b> to set the title, category, caption and status.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="tabs" style={{ justifyContent: "flex-start", margin: "0 0 20px" }}>
        <button className={`tab-btn ${tab === "photos" ? "active" : ""}`} onClick={() => setTab("photos")}>📷 Photos ({allPhotos.length})</button>
        <button className={`tab-btn ${tab === "videos" ? "active" : ""}`} onClick={() => setTab("videos")}>🎬 Videos ({allVideos.length})</button>
      </div>

      <div className="list-bar">
        <input
          className="list-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${tab === "photos" ? "photos" : "videos"} by title, caption or category…`}
          aria-label="Search gallery"
          style={{ flex: 1, minWidth: 180 }}
        />
        <select
          className="list-filter"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          aria-label="Filter by category"
          style={{ maxWidth: 190 }}
        >
          <option value="">All categories</option>
          {usedCats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        {(q.trim() || statusFilter || catFilter) && (
          <span className="seo-hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
            {tabItems.length} of {tab === "photos" ? allPhotos.length : allVideos.length}
          </span>
        )}
      </div>

      {/* The bulk bar sits right above the grid (sticky) so it stays with the
          selection instead of floating at the top of the page. */}
      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}

      {uploads.length > 0 && (
        <div className="editor" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Uploading…</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {uploads.map((j) => (
              <div key={j.id} style={{ textAlign: "center" }}>
                {j.error ? (
                  <div style={{ width: 92 }}>
                    <div style={{ fontSize: 28 }}>⚠️</div>
                    <div style={{ fontSize: 11, color: "#c62828", fontWeight: 700, marginTop: 6, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }} title={j.error}>{j.name}</div>
                    <div style={{ fontSize: 11, color: "#c62828" }}>{j.error}</div>
                    <button className="btn-sm btn-del" style={{ marginTop: 6 }} onClick={() => setUploads((xs) => xs.filter((x) => x.id !== j.id))}>Dismiss</button>
                  </div>
                ) : (
                  <CircleProgress value={j.progress} label={j.name} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "photos" && (
        <>
          <label className="btn btn-primary" style={{ cursor: "pointer" }}>
            + Upload Photos
            <input type="file" accept="image/*" multiple hidden onChange={addPhotos} />
          </label>
          {busy ? <AdminLoader /> : <div className="media-grid">{photos.map(card)}</div>}
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
              + Upload Video
              <input type="file" accept="video/*" multiple hidden onChange={addVideoFile} />
            </label>
          </div>
          {busy ? <AdminLoader /> : <div className="media-grid">{videos.map(card)}</div>}
        </>
      )}
      {preview && (
        <PreviewModal url={preview.url} kind={preview.kind} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
