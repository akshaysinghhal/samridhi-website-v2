"use client";
import { useEffect, useMemo, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { revalidateSite, useBulk, BulkBar, CheckCell, AdminLoader, toast, CircleProgress } from "../_lib/ui";
import PreviewModal from "../_lib/PreviewModal";

function fmtMB(bytes) {
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [usage, setUsage] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [uploads, setUploads] = useState([]); // [{ id, name, progress, error }]
  const [copied, setCopied] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [folder, setFolder] = useState("all");
  const [sort, setSort] = useState("newest");
  const [preview, setPreview] = useState(null);

  const load = async (silent) => {
    if (!silent) setBusy(true);
    setErr("");
    try {
      const res = await api("/api/admin/media");
      setMedia(res.media || []);
      setUsage(res.usage || null);
    } catch (e) { setErr("Failed to load Cloudinary library: " + e.message); }
    if (!silent) setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const folders = useMemo(() => {
    const s = new Set();
    for (const m of media) if (m.folder) s.add(m.folder);
    return ["all", ...[...s].sort()];
  }, [media]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = media.filter((m) => {
      if (type !== "all" && m.kind !== type) return false;
      if (folder !== "all" && m.folder !== folder) return false;
      if (needle && !(m.public_id || "").toLowerCase().includes(needle) && !(m.alt || "").toLowerCase().includes(needle)) return false;
      return true;
    });
    const byName = (a, b) => (a.public_id || "").localeCompare(b.public_id || "");
    switch (sort) {
      case "oldest": return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case "name-asc": return list.sort(byName);
      case "name-desc": return list.sort((a, b) => byName(b, a));
      case "largest": return list.sort((a, b) => (b.bytes || 0) - (a.bytes || 0));
      case "smallest": return list.sort((a, b) => (a.bytes || 0) - (b.bytes || 0));
      case "newest":
      default: return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [media, q, type, folder, sort]);

  // Bulk selection is scoped to the FILTERED list, so "select all" only
  // touches what you can see — never the whole account behind a filter.
  const bulk = useBulk({
    rows: filtered,
    patchRows: setMedia,
    endpoint: "/api/admin/media",
    deleteOne: (id) => api(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  });

  const onFiles = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    e.target.value = "";
    const jobs = files.map((file, i) => ({ id: `${Date.now()}-${i}`, name: file.name, progress: 0, error: "" }));
    setUploads((xs) => [...xs, ...jobs]);
    const setJob = (id, patch) => setUploads((xs) => xs.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    let okCount = 0;
    for (let i = 0; i < files.length; i++) {
      const job = jobs[i];
      try {
        await uploadFile(files[i], (p) => setJob(job.id, { progress: p }));
        setJob(job.id, { progress: 1 });
        okCount++;
      } catch (err) {
        const msg = err.message || "Upload failed";
        job.error = msg;
        setJob(job.id, { error: msg });
      }
    }
    if (okCount) {
      toast(okCount === 1 ? "Upload complete." : `${okCount} uploads complete.`);
      await revalidateSite(); load(true);
    } else if (jobs.length) {
      const firstErr = jobs.find((j) => j.error)?.error || "unknown error";
      setErr("Upload failed: " + firstErr);
    }
    // Clear finished jobs after a moment; keep failed ones visible.
    setTimeout(() => {
      setUploads((xs) => xs.filter((j) => j.error));
    }, 4000);
  };

  const copy = async (url) => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  };

  const remove = async (m) => {
    const name = (m.public_id || "").split("/").pop();
    if (!confirm(`Delete "${name}" from Cloudinary? This cannot be undone.`)) return;
    setErr(""); setNotice(""); setDeletingId(m.id);
    try {
      await api(`/api/admin/media?id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
      setMedia((xs) => xs.filter((x) => x.id !== m.id));
      setNotice(`Deleted "${name}".`);
      setTimeout(() => setNotice(""), 5000);
      toast(`Deleted "${name}".`);
      load(true); // refresh the list + storage usage silently
      await revalidateSite();
    } catch (e) {
      setErr("Delete failed: " + e.message);
        toast("Delete failed: " + e.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const pct = usage && usage.limit_bytes ? Math.min(100, Math.round((usage.used_bytes / usage.limit_bytes) * 100)) : 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div><h1>Media Library</h1><p className="admin-sub">Every photo &amp; video in your Cloudinary account — click any item to preview it.</p></div>
        <label className="btn-sm btn-new" style={{ cursor: "pointer" }}>
          + Upload
          <input type="file" accept="image/*,video/*" multiple hidden onChange={onFiles} />
        </label>
      </div>

      {uploads.length > 0 && (
        <div className="editor" style={{ marginTop: 16 }}>
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

      {usage && (
        <div className="editor" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Cloudinary storage</div>
          <div style={{ flex: "1 1 220px", height: 10, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: pct > 85 ? "#c62828" : "var(--brand)" }} />
          </div>
          <div style={{ fontSize: 14, color: "#6b5d6e" }}>
            <strong style={{ color: "#3d3140" }}>{fmtMB(usage.used_bytes)}</strong> used
            {usage.limit_bytes > 0 && (
              <> · <strong style={{ color: "#2e7d32" }}>{fmtMB(usage.available_bytes)}</strong> available of <strong style={{ color: "#3d3140" }}>{fmtMB(usage.limit_bytes)}</strong> ({pct}%)</>
            )}
          </div>
        </div>
      )}

      <div className="editor" style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by file name…"
          style={{ flex: "1 1 200px", maxWidth: 320 }}
          aria-label="Search media"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="image">Photos only</option>
          <option value="video">Videos only</option>
        </select>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Filter by folder">
          {folders.map((f) => <option key={f} value={f}>{f === "all" ? "All folders" : f}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort media">
          <option value="newest">Latest added first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="largest">Largest file first</option>
          <option value="smallest">Smallest file first</option>
        </select>
        <span style={{ fontSize: 13, color: "#6b5d6e", marginLeft: "auto" }}>{filtered.length} of {media.length} files</span>
      </div>

      {err && <div className="login-err" style={{ marginTop: 16 }}>{err}</div>}
      {notice && <div className="admin-ok" style={{ marginTop: 16 }}>{notice}</div>}
      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} scopeCount={filtered.length} />}

      {busy ? <AdminLoader /> : filtered.length === 0 ? (
        <div className="editor" style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ color: "#7a6a7c" }}>{media.length === 0 ? "Nothing here yet — upload your first photo or video." : "No files match these filters."}</p>
        </div>
      ) : (
        <div className="media-grid">
          {filtered.map((m) => (
            <div className="media-item" key={m.id} style={bulk.selected.has(m.id) ? { outline: "3px solid var(--brand)" } : undefined}>
              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 4 }}>
                <CheckCell checked={bulk.selected.has(m.id)} onChange={() => bulk.toggleOne(m.id)} label="Select media" />
              </div>
              <div onClick={() => setPreview(m)} style={{ cursor: "zoom-in" }} title="Click to preview">
                {m.kind === "video" ? (
                  <img src={m.thumb} alt={m.alt || "Video"} loading="lazy" />
                ) : (
                  <img src={m.url} alt={m.alt || ""} loading="lazy" />
                )}
                {m.kind === "video" && (
                  <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 999 }}>▶ VIDEO</span>
                )}
              </div>
              <div className="meta" style={{ flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, color: "#6b5d6e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.public_id}>
                  {(m.public_id || "").split("/").pop()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-sm btn-edit" onClick={() => copy(m.url)}>{copied === m.url ? "Copied ✓" : "Copy URL"}</button>
                  <button
                    className="btn-sm btn-del"
                    onClick={() => remove(m)}
                    disabled={deletingId === m.id}
                    style={deletingId === m.id ? { opacity: 0.6, cursor: "wait" } : undefined}
                  >
                    {deletingId === m.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {preview && (
        <PreviewModal url={preview.url} kind={preview.kind} title={(preview.public_id || "").split("/").pop()} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
