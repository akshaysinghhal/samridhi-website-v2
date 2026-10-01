"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/adminApi";
import { revalidateSite, useBulk, BulkBar, CheckCell, AdminLoader } from "../_lib/ui";

export default function WeddingsList() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");

  const load = async (silent) => {
    if (!silent) setBusy(true);
    try { setRows((await api("/api/admin/weddings")).weddings); } catch { /* ignore */ }
    if (!silent) setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const shown = rows.filter((w) => {
    const needle = q.trim().toLowerCase();
    if (needle && !`${w.title || ""} ${w.location || ""}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  const bulk = useBulk({ rows: shown, patchRows: setRows, endpoint: "/api/admin/weddings" });

  const togglePin = async (w) => {
    await api(`/api/admin/weddings/${w.id}`, { method: "PUT", body: { ...w, pinned: !w.pinned } });
    setRows((rs) => rs.map((x) => (x.id === w.id ? { ...x, pinned: !x.pinned } : x)));
    await revalidateSite();
  };

  const remove = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/api/admin/weddings/${id}`, { method: "DELETE" });
    setRows((rs) => rs.filter((x) => x.id !== id));
    await revalidateSite();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Weddings</h1>
          <p className="admin-sub">Pin up to 10 weddings to feature them on the homepage.</p>
        </div>
        <Link className="btn-sm btn-new" href="/admin/weddings/new">+ New Wedding</Link>
      </div>
      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}
      {rows.length > 0 && (
        <div className="list-bar">
          <input className="list-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or location…" aria-label="Search weddings" style={{ flex: 1, minWidth: 180 }} />
          {q.trim() && <span className="seo-hint" style={{ margin: 0, whiteSpace: "nowrap" }}>{shown.length} of {rows.length}</span>}
        </div>
      )}
      {busy ? <AdminLoader /> : rows.length === 0 ? (
        <div className="editor" style={{ textAlign: "center" }}>
          <p style={{ color: "#7a6a7c" }}>No weddings yet. Add your first celebration!</p>
          <Link className="btn btn-primary" href="/admin/weddings/new">+ New Wedding</Link>
        </div>
      ) : shown.length === 0 ? (
        <p style={{ color: "#7a6a7c" }}>No weddings match this search.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th style={{ width: 40 }}><CheckCell checked={bulk.allChecked} onChange={bulk.toggleAll} label="Select all weddings" /></th><th>Wedding</th><th>Location</th><th>Pinned</th><th></th></tr></thead>
          <tbody>
            {shown.map((w) => (
              <tr key={w.id} className={bulk.selected.has(w.id) ? "row-selected" : ""}>
                <td><CheckCell checked={bulk.selected.has(w.id)} onChange={() => bulk.toggleOne(w.id)} label={`Select ${w.title}`} /></td>
                <td>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {w.cover_image && <img src={w.cover_image} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8 }} />}
                    <div><b>{w.title}</b><br /><span style={{ color: "#7a6a7c", fontSize: 12.5 }}>{(w.gallery || []).length} photos</span></div>
                  </div>
                </td>
                <td>{w.location || "—"}</td>
                <td>
                  <button className={`btn-sm ${w.pinned ? "pin-btn on" : "btn-edit"}`} onClick={() => togglePin(w)}>
                    {w.pinned ? "★ Pinned" : "☆ Pin"}
                  </button>
                </td>
                <td><div className="row-actions">
                  <a className="btn-sm btn-view" href="/weddings" target="_blank" rel="noreferrer">Preview</a>
                  <Link className="btn-sm btn-edit" href={`/admin/weddings/${w.id}`}>Edit</Link>
                  <button className="btn-sm btn-del" onClick={() => remove(w.id, w.title)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
