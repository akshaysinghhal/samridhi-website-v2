"use client";
import { useEffect, useMemo, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { revalidateSite, useBulk, BulkBar, CheckCell } from "../_lib/ui";
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
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [folder, setFolder] = useState("all");
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

  const bulk = useBulk({
    rows: media,
    patchRows: setMedia,
    endpoint: "/api/admin/media",
    deleteOne: (id) => api(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  });

  const folders = useMemo(() => {
    const s = new Set();
    for (const m of media) if (m.folder) s.add(m.folder);
    return ["all", ...[...s].sort()];
  }, [media]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return media.filter((m) => {
      if (type !== "all" && m.kind !== type) return false;
      if (folder !== "all" && m.folder !== folder) return false;
      if (needle && !(m.public_id || "").toLowerCase().includes(needle) && !(m.alt || "").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [media, q, type, folder]);

  const onFiles = async (e) => {
    setUploading(true);
    for (const file of e.target.files) {
      try { await uploadFile(file); } catch { /* ignore */ }
    }
    setUploading(false);
    e.target.value = "";
    await revalidateSite(); load(true);
  };

  const copy = async (url) => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  };

  const remove = async (m) => {
    if (!confirm(`Delete "${(m.public_id || "").split("/").pop()}" from Cloudinary? This cannot be undone.`)) return;
    await api(`/api/admin/media?id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
    await revalidateSite();
    setMedia((xs) => xs.filter((x) => x.id !== m.id));
  };

  const pct = usage && usage.limit_bytes ? Math.min(100, Math.round((usage.used_bytes / usage.limit_bytes) * 100)) : 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div><h1>Media Library</h1><p className="admin-sub">Every photo &amp; video in your Cloudinary account — click any item to preview it.</p></div>
        <label className="btn-sm btn-new" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading…" : "+ Upload"}
          <input type="file" accept="image/*,video/*" multiple hidden onChange={onFiles} />
        </label>
      </div>

      {usage && (
        <div className="editor" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Cloudinary storage</div>
          <div style={{ flex: "1 1 220px", height: 10, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: pct > 85 ? "#c62828" : "var(--brand)" }} />
          </div>
          <div style={{ fontSize: 14, color: "#6b5d6e" }}>
            <strong style={{ color: "#3d3140" }}>{fmtMB(usage.used_bytes)}</strong> used
            {usage.limit_bytes > 0 && <> of <strong style={{ color: "#3d3140" }}>{fmtMB(usage.limit_bytes)}</strong> ({pct}%)</>}
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
        <span style={{ fontSize: 13, color: "#6b5d6e", marginLeft: "auto" }}>{filtered.length} of {media.length} files</span>
      </div>

      {err && <div className="login-err" style={{ marginTop: 16 }}>{err}</div>}
      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}

      {busy ? <p style={{ marginTop: 20 }}>Loading Cloudinary library…</p> : filtered.length === 0 ? (
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
                  <button className="btn-sm btn-del" onClick={() => remove(m)}>Delete</button>
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
