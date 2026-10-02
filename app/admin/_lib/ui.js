"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/adminApi";

// Authenticated draft preview: the endpoint verifies the admin session
// server-side, sets a short-lived preview cookie, and returns the public URL.
// The cookie is stored from the fetch response, so the new tab carries it.
export async function openPreview(slug, setMsg) {
  try {
    const { url } = await api(`/api/admin/preview?slug=${encodeURIComponent(slug)}`);
    window.open(url, "_blank", "noopener");
  } catch (e) {
    if (setMsg) setMsg("Preview failed: " + e.message);
  }
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Best-effort on-demand revalidation after a save. Goes through the
// authenticated /api/admin/revalidate endpoint, so the browser never sees
// the REVALIDATE_SECRET. The server API routes also revalidate on write;
// this is a second trigger from the UI. Pass type="layout" when the change
// affects the shared layout (e.g. theme colours) rather than one page.
export async function revalidateSite(paths = ["/"], type = "page") {
  try {
    await api("/api/admin/revalidate", { method: "POST", body: { paths, type } });
  } catch { /* ignore */ }
}

export function PhBadge() {
  return <span className="placeholder-badge">Placeholder</span>;
}

export function StatusBadge({ status }) {
  const label = status ? status[0].toUpperCase() + status.slice(1) : "—";
  return <span className={`badge ${status === "published" ? "pub" : "draft"}`}>{label}</span>;
}

// Self-contained save button with a spinner — drop in anywhere a save action
// fires so every admin form shows a loader while its save is in flight.
export function SaveButton({ onClick, children, className = "btn btn-primary", style }) {
  const [saving, setSaving] = useState(false);
  const click = async () => {
    if (saving) return;
    setSaving(true);
    try { await onClick(); } finally { setSaving(false); }
  };
  return (
    <button className={className} style={style} disabled={saving} onClick={click}>
      {saving ? <><span className="spin" aria-hidden="true" /> Saving…</> : children}
    </button>
  );
}

// Upload a single file from an <input type=file> change event. Returns the URL or null.
export async function uploadOne(file, setUploading, setMsg) {
  if (!file) return null;
  const { uploadFile } = await import("../../../lib/adminApi");
  try {
    if (setUploading) setUploading(true);
    const m = await uploadFile(file);
    return m.url;
  } catch (err) {
    if (setMsg) setMsg("Upload failed: " + err.message);
    return null;
  } finally {
    if (setUploading) setUploading(false);
  }
}

export const STATUS_OPTIONS = ["draft", "published", "scheduled"];

// --- bulk selection + bulk actions ------------------------------------------
// Shared multi-select for custom admin list pages.
// rows: current row array; patchRows: (updater) => void (usually setRows);
// endpoint: e.g. "/api/admin/posts". Override updateOne/deleteOne when the
// API doesn't follow the RESTful `${endpoint}/${id}` convention.
export function useBulk({ rows, patchRows, endpoint, statusField = "status", updateOne, deleteOne }) {
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState("");
  const [bulkStatus, setBulkStatus] = useState("published");

  const doUpdate = updateOne || ((id, body) => api(`${endpoint}/${id}`, { method: "PUT", body }));
  const doDelete = deleteOne || ((id) => api(`${endpoint}/${id}`, { method: "DELETE" }));

  const ids = rows.map((r) => r.id);
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));
  const hasStatus = rows.some((r) => typeof r[statusField] === "string");

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(ids));
  const toggleOne = (id) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clear = () => setSelected(new Set());

  const bulkSetStatus = async () => {
    const list = [...selected];
    if (!list.length) return;
    setBulkBusy(`Updating 0/${list.length}…`);
    let done = 0, failed = 0;
    for (const id of list) {
      try { await doUpdate(id, { [statusField]: bulkStatus }); done++; }
      catch { failed++; }
      setBulkBusy(`Updating ${done + failed}/${list.length}…`);
    }
    patchRows((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, [statusField]: bulkStatus } : r)));
    clear(); setBulkBusy("");
    return { done, failed };
  };

  const bulkDelete = async () => {
    const list = [...selected];
    if (!list.length) return { done: 0, failed: 0 };
    if (!confirm(`Delete ${list.length} selected item${list.length > 1 ? "s" : ""}? This cannot be undone.`)) return null;
    setBulkBusy(`Deleting 0/${list.length}…`);
    let done = 0, failed = 0;
    for (const id of list) {
      try { await doDelete(id); done++; }
      catch { failed++; }
      setBulkBusy(`Deleting ${done + failed}/${list.length}…`);
    }
    const gone = new Set(list);
    patchRows((rs) => rs.filter((r) => !gone.has(r.id)));
    clear(); setBulkBusy("");
    return { done, failed };
  };

  return {
    selected, allChecked, hasStatus, bulkBusy, bulkStatus, setBulkStatus,
    toggleAll, toggleOne, clear, bulkSetStatus, bulkDelete,
  };
}

// Sticky bulk-action bar. Render above the table when bulk.selected.size > 0.
// scopeCount (optional): how many rows the select-all checkbox covers — pass
// the filtered count so it never claims "all" when a filter is active.
export function BulkBar({ bulk, onDone, scopeCount }) {
  const [note, setNote] = useState("");
  const finish = async (fn, verb) => {
    setNote("");
    const res = await fn();
    if (!res) return;
    if (onDone) onDone();
    const noteText = res.failed ? `${verb}: ${res.done} ok, ${res.failed} failed.` : `${verb}: ${res.done} done.`;
    setNote(noteText);
    toast(noteText, res.failed ? "error" : "success");
  };
  const scopeNote = typeof scopeCount === "number" ? ` (of ${scopeCount} shown)` : "";
  return (
    <div className="bulk-bar">
      <label className="bulk-selectall" title={(bulk.allChecked ? "Deselect all" : "Select all") + scopeNote}>
        <input
          type="checkbox"
          checked={bulk.allChecked}
          onChange={bulk.toggleAll}
          aria-label="Select all"
          style={{ width: 17, height: 17, accentColor: "var(--brand)" }}
        />
        <strong>{bulk.selected.size} selected</strong>
      </label>
      {bulk.hasStatus && (
        <>
          <select value={bulk.bulkStatus} onChange={(e) => bulk.setBulkStatus(e.target.value)} aria-label="Bulk status">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button className="btn-sm btn-edit" disabled={!!bulk.bulkBusy} onClick={() => finish(bulk.bulkSetStatus, "Status updated")}>Apply status</button>
        </>
      )}
      <button className="btn-sm btn-del" disabled={!!bulk.bulkBusy} onClick={() => finish(bulk.bulkDelete, "Deleted")}>Delete selected</button>
      <button className="btn-sm" disabled={!!bulk.bulkBusy} onClick={bulk.clear} style={{ background: "#eee", color: "#555" }}>Clear</button>
      {bulk.bulkBusy && (
        <span className="seo-hint" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="bulk-spin" aria-hidden="true" />
          {bulk.bulkBusy}
        </span>
      )}
      {note && <span className="seo-hint" style={{ margin: 0 }}>{note}</span>}
    </div>
  );
}

// Status dropdown filter for list pages. Options default to the shared
// draft/published/scheduled set; pass custom options (e.g. lead statuses)
// when the page uses different values.
export function StatusFilter({ value, onChange, options, label = "All statuses" }) {
  const opts = options || STATUS_OPTIONS.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Filter by status" className="list-filter">
      <option value="">{label}</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Checkbox cell + header shared by custom list tables.
export function CheckCell({ checked, onChange, label }) {
  return <input type="checkbox" checked={checked} onChange={onChange} aria-label={label || "Select row"} style={{ width: 17, height: 17, accentColor: "var(--brand)" }} />;
}

// Centered circular loading spinner for admin pages.
export function AdminLoader() {
  return (
    <div className="admin-loader-wrap" role="status" aria-label="Loading">
      <div className="admin-loader" />
    </div>
  );
}

// ---------- Toast notifications ----------
// Fire-and-forget: toast("Saved", "success"). The <Toaster/> in the admin
// layout listens for these events and renders them.
export function toast(msg, type = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("admin-toast", {
    detail: { msg: String(msg), type, id: Date.now() + Math.random() },
  }));
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail || {};
      setItems((prev) => [...prev.slice(-3), t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3400);
    };
    window.addEventListener("admin-toast", onToast);
    return () => window.removeEventListener("admin-toast", onToast);
  }, []);
  const icons = { success: "✓", error: "✕", info: "i" };
  return (
    <div className="admin-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`admin-toast admin-toast-${t.type || "success"}`}>
          <span className="admin-toast-icon">{icons[t.type] || icons.success}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// Circular upload progress ring. Shows % uploaded in the middle and the
// remaining % underneath, e.g. "38%" big with "62% left" below it.
export function CircleProgress({ value = 0, size = 92, label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#efe4d8" strokeWidth="9" fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="var(--brand, #B9553A)" strokeWidth="9" fill="none" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - value)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.15s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.15 }}>
          <strong style={{ fontSize: size * 0.22, color: "#3d2b23" }}>{pct}%</strong>
          <span style={{ fontSize: size * 0.115, color: "#8a7a72", fontWeight: 700 }}>{100 - pct}% left</span>
        </div>
      </div>
      {label && <div style={{ fontSize: 12, color: "#6b5d6e", maxWidth: 180, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>}
    </div>
  );
}
