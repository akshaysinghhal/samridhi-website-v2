"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/adminApi";

export default function WeddingsList() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    try { setRows((await api("/api/admin/weddings")).weddings); } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const togglePin = async (w) => {
    await api(`/api/admin/weddings/${w.id}`, { method: "PUT", body: { ...w, pinned: !w.pinned } });
    load();
  };

  const remove = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/api/admin/weddings/${id}`, { method: "DELETE" });
    load();
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
      {busy ? <p>Loading…</p> : rows.length === 0 ? (
        <div className="editor" style={{ textAlign: "center" }}>
          <p style={{ color: "#7a6a7c" }}>No weddings yet. Add your first celebration!</p>
          <Link className="btn btn-primary" href="/admin/weddings/new">+ New Wedding</Link>
        </div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Wedding</th><th>Location</th><th>Pinned</th><th></th></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
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
