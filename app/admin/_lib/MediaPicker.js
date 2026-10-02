"use client";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../lib/adminApi";

// Reusable media-library picker popup. Shows every file in the Cloudinary
// account (the same data as /admin/media), with search + type + folder filters.
// Props:
//   open        — boolean, show the modal
//   onClose     — close the modal
//   onSelect    — single mode: (item) => void; multi mode: (items[]) => void
//   kind        — "image" | "video" | "all" (default "all")
//   multi       — when true, tick several files then confirm once

// Error boundary: a picker failure shows an inline error instead of crashing
// the whole admin page, and surfaces the actual message for diagnosis.
class MediaPickerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose from media library"
          className="mp-overlay"
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(20,12,10,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            className="mp-panel"
            style={{ background: "#fff", borderRadius: 14, width: "min(480px, 94vw)", padding: "28px 24px", textAlign: "center" }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>Couldn't open the media picker</h2>
            <p style={{ color: "#7a6a7c", fontSize: 13, margin: "0 0 6px" }}>Please try again — the rest of this page is unaffected.</p>
            <p style={{ color: "#a33", fontSize: 12, wordBreak: "break-word", background: "#fdf0ef", borderRadius: 8, padding: "8px 10px" }}>
              {String((error && error.message) || error || "Unknown error")}
            </p>
            <button type="button" className="btn btn-dark" onClick={this.props.onClose} style={{ marginTop: 10 }}>Close</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MediaPickerInner({ open, onClose, onSelect, kind = "all", multi = false }) {
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(false); // first batch not yet shown
  const [loadingMore, setLoadingMore] = useState(false); // full list still fetching
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState(kind === "all" ? "all" : kind);
  const [folder, setFolder] = useState("all");
  const [sel, setSel] = useState([]); // array of media ids, multi mode only

  useEffect(() => {
    if (!open) return;
    setTab(kind === "all" ? "all" : kind);
    setFolder("all");
    setQ("");
    setSel([]);
    setMedia([]);
    let live = true;
    (async () => {
      setBusy(true); setErr(""); setLoadingMore(false);
      try {
        // Phase 1: first 24 files fast, so the picker opens instantly.
        const first = await api("/api/admin/media?limit=24&usage=0");
        if (!live) return;
        setMedia(first.media || []);
        setBusy(false);
        // Phase 2: the rest in the background.
        setLoadingMore(true);
        const full = await api("/api/admin/media?usage=0");
        if (!live) return;
        setMedia(full.media || []);
      } catch (e) { if (live) setErr("Failed to load library: " + e.message); }
      if (live) { setBusy(false); setLoadingMore(false); }
    })();
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => { live = false; window.removeEventListener("keydown", h); };
  }, [open, kind, onClose]);

  const folders = useMemo(() => {
    const set = new Set();
    for (const m of media) if (m && m.folder) set.add(m.folder);
    return Array.from(set).sort();
  }, [media]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // Guard against malformed API items so one bad record can't crash the grid.
    return (Array.isArray(media) ? media : []).filter((m) => {
      if (!m || typeof m !== "object") return false;
      if (tab !== "all" && m.kind !== tab) return false;
      if (folder === "__root") { if (m.folder) return false; }
      else if (folder !== "all" && m.folder !== folder) return false;
      if (needle && !((m.public_id || "").toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [media, q, tab, folder]);

  // Bottom-sheet drag-to-dismiss (mobile). Hooks must stay above the early
  // return — calling useRef only when open breaks the Rules of Hooks and
  // crashes React with "Rendered more hooks than during the previous render".
  const sheetRef = useRef(null);
  const dragY = useRef(null);

  if (!open) return null;

  const norm = (m) => ({ url: m.url, kind: m.kind, public_id: m.public_id, thumb: m.thumb, width: m.width || 0, height: m.height || 0 });

  const pickOne = (m) => { onSelect(norm(m)); onClose(); };

  const toggle = (m) => {
    setSel((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]));
  };

  const confirmMulti = () => {
    const items = (Array.isArray(media) ? media : []).filter((m) => m && sel.includes(m.id)).map(norm);
    if (items.length === 0) return;
    onSelect(items);
    onClose();
  };

  const fname = (m) => (m.public_id || "").split("/").pop();

  // Bottom-sheet drag-to-dismiss (mobile). Dragging the handle down closes.
  const onTouchStart = (e) => { dragY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    if (dragY.current == null) return;
    const dy = e.touches[0].clientY - dragY.current;
    if (dy > 0 && sheetRef.current) sheetRef.current.style.transform = `translateY(${Math.min(dy, 220)}px)`;
  };
  const onTouchEnd = (e) => {
    const dy = dragY.current == null ? 0 : e.changedTouches[0].clientY - dragY.current;
    dragY.current = null;
    if (sheetRef.current) sheetRef.current.style.transform = "";
    if (dy > 90) onClose();
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose from media library"
      className="mp-overlay"
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(20,12,10,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="mp-panel"
        style={{ background: "#fff", borderRadius: 14, width: "min(920px, 96vw)", maxHeight: "86vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div
          className="mp-handle"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-hidden="true"
        >
          <span />
        </div>
        <div className="mp-head" style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, flex: "1 1 auto" }}>Choose from library</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search file name…"
            style={{ maxWidth: 180 }}
            aria-label="Search library"
          />
          <select value={tab} onChange={(e) => setTab(e.target.value)} aria-label="Filter by type">
            {(kind === "all" || kind === "image") && <option value="image">Photos</option>}
            {(kind === "all" || kind === "video") && <option value="video">Videos</option>}
            {kind === "all" && <option value="all">All</option>}
          </select>
          <select value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Filter by folder" style={{ maxWidth: 200 }}>
            <option value="all">All folders</option>
            <option value="__root">🏠 Home (root)</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="btn-sm btn-del" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ padding: 16, overflowY: "auto" }}>
          {err && <div className="login-err">{err}</div>}
          {busy ? (
            <div className="admin-loader-wrap" style={{ minHeight: 200, padding: "50px 20px" }}>
              <div style={{ textAlign: "center" }}>
                <div className="admin-loader" style={{ margin: "0 auto 14px" }} />
                <div style={{ color: "#7a6a7c", fontSize: 13 }}>Loading library…</div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ color: "#7a6a7c" }}>No files match. Upload new ones from the Media Library page.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {filtered.map((m) => {
                const checked = sel.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => (multi ? toggle(m) : pickOne(m))}
                    title={fname(m)}
                    aria-pressed={multi ? checked : undefined}
                    style={{
                      border: checked ? "2.5px solid var(--brand, #B9553A)" : "1.5px solid #ecd9e4",
                      borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer",
                      background: checked ? "#fdf6f2" : "#fff", position: "relative",
                    }}
                  >
                    {m.kind === "video"
                      ? <img src={m.thumb} alt="" loading="lazy" style={{ width: "100%", height: 84, objectFit: "cover", display: "block" }} />
                      : <img src={m.url} alt="" loading="lazy" style={{ width: "100%", height: 84, objectFit: "cover", display: "block" }} />}
                    {m.kind === "video" && (
                      <span style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>▶</span>
                    )}
                    {m.kind === "video" && m.duration > 0 && (
                      <span style={{ position: "absolute", bottom: 36, right: 4, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "2px 5px", borderRadius: 5 }}>
                        {Math.floor(m.duration / 60)}:{String(Math.round(m.duration % 60)).padStart(2, "0")}
                      </span>
                    )}
                    {multi && (
                      <span style={{
                        position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                        background: checked ? "#B9553A" : "rgba(255,255,255,0.9)",
                        border: checked ? "2px solid #B9553A" : "2px solid #b9a8b2",
                        color: "#fff", fontSize: 13, fontWeight: 800, display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {checked ? "✓" : ""}
                      </span>
                    )}
                    <span style={{ display: "block", fontSize: 10.5, color: "#6b5d6e", padding: "6px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {fname(m)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid #eee", fontSize: 13, color: "#7a6a7c", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 auto" }}>
            {multi
              ? (sel.length > 0 ? `${sel.length} selected` : "Tick the photos you want, then add them together.")
              : "Click one to use it in this field."}
            {" "}· {filtered.length} file{filtered.length === 1 ? "" : "s"} shown.
            {loadingMore && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 10 }}>
                <span className="bulk-spin" style={{ width: 12, height: 12 }} />
                Loading full library…
              </span>
            )}
          </span>
          {multi && (
            <button type="button" className="btn btn-primary" disabled={sel.length === 0} onClick={confirmMulti}>
              Add {sel.length > 0 ? `${sel.length} photo${sel.length === 1 ? "" : "s"}` : "photos"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export: the picker wrapped in its error boundary, so a picker
// failure can never take down the whole admin page it was opened from.
export default function MediaPicker(props) {
  if (!props.open) return null;
  return (
    <MediaPickerErrorBoundary onClose={props.onClose}>
      <MediaPickerInner {...props} />
    </MediaPickerErrorBoundary>
  );
}
