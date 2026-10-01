"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/adminApi";

// Reusable media-library picker popup. Shows every file in the Cloudinary
// account (the same data as /admin/media), with search + type filter.
// Props:
//   open        — boolean, show the modal
//   onClose     — close the modal
//   onSelect    — (item) => void, item = { url, kind, public_id, thumb }
//   kind        — "image" | "video" | "all" (default "all")
export default function MediaPicker({ open, onClose, onSelect, kind = "all" }) {
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState(kind === "all" ? "all" : kind);

  useEffect(() => {
    if (!open) return;
    setTab(kind === "all" ? "all" : kind);
    let live = true;
    (async () => {
      setBusy(true); setErr("");
      try {
        const res = await api("/api/admin/media");
        if (live) setMedia(res.media || []);
      } catch (e) { if (live) setErr("Failed to load library: " + e.message); }
      if (live) setBusy(false);
    })();
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => { live = false; window.removeEventListener("keydown", h); };
  }, [open, kind, onClose]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return media.filter((m) => {
      if (tab !== "all" && m.kind !== tab) return false;
      if (needle && !(m.public_id || "").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [media, q, tab]);

  if (!open) return null;

  const pick = (m) => { onSelect({ url: m.url, kind: m.kind, public_id: m.public_id, thumb: m.thumb }); onClose(); };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose from media library"
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(20,12,10,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, width: "min(880px, 96vw)", maxHeight: "86vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, flex: "1 1 auto" }}>Choose from library</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search file name…"
            style={{ maxWidth: 200 }}
            aria-label="Search library"
          />
          <select value={tab} onChange={(e) => setTab(e.target.value)} aria-label="Filter by type">
            {(kind === "all" || kind === "image") && <option value="image">Photos</option>}
            {(kind === "all" || kind === "video") && <option value="video">Videos</option>}
            {kind === "all" && <option value="all">All</option>}
          </select>
          <button className="btn-sm btn-del" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding: 16, overflowY: "auto" }}>
          {err && <div className="login-err">{err}</div>}
          {busy ? <p>Loading library…</p> : filtered.length === 0 ? (
            <p style={{ color: "#7a6a7c" }}>No files match. Upload new ones from the Media Library page.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pick(m)}
                  title={(m.public_id || "").split("/").pop()}
                  style={{ border: "1.5px solid #ecd9e4", borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer", background: "#fff", position: "relative" }}
                >
                  {m.kind === "video"
                    ? <img src={m.thumb} alt="" loading="lazy" style={{ width: "100%", height: 84, objectFit: "cover", display: "block" }} />
                    : <img src={m.url} alt="" loading="lazy" style={{ width: "100%", height: 84, objectFit: "cover", display: "block" }} />}
                  {m.kind === "video" && (
                    <span style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>▶</span>
                  )}
                  <span style={{ display: "block", fontSize: 10.5, color: "#6b5d6e", padding: "6px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {(m.public_id || "").split("/").pop()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid #eee", fontSize: 13, color: "#7a6a7c" }}>
          {filtered.length} file{filtered.length === 1 ? "" : "s"} — click one to use it in this field.
        </div>
      </div>
    </div>
  );
}
