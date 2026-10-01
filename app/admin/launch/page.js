"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { AdminLoader } from "../_lib/ui";

export default function LaunchAdmin() {
  const [areas, setAreas] = useState([]);
  const [total, setTotal] = useState(0);
  const [indexing, setIndexing] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/admin/launch");
        setAreas(r.areas || []); setTotal(r.total || 0); setIndexing(!!r.indexing_enabled);
      } catch { /* ignore */ }
      setBusy(false);
    })();
  }, []);

  if (busy) return (<><h1>Launch Checklist</h1><AdminLoader /></>);

  const ready = total === 0;

  return (
    <>
      <h1>Launch Checklist</h1>
      <p className="admin-sub">Replace every placeholder and draft with real, approved content before going live.</p>

      {indexing && total > 0 && (
        <div className="admin-warn launch-hero">
          ⚠️ <b>Search indexing is currently ON</b> while <b>{total} placeholder/draft item{total === 1 ? "" : "s"}</b> remain.
          Turn indexing off in <a href="/admin/settings">Settings → Search indexing</a> until everything below is replaced.
        </div>
      )}
      {ready && (
        <div className="admin-ok launch-hero">🎉 All placeholders replaced. The site is ready to be indexed.</div>
      )}

      <table className="admin-table">
        <thead><tr><th>Area</th><th>Remaining</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {areas.map((a) => (
            <tr key={a.key}>
              <td><b>{a.label}</b></td>
              <td style={{ fontSize: 20, fontWeight: 800, color: a.count > 0 ? "#e65100" : "#2e7d32" }}>{a.count}</td>
              <td>{a.count > 0 ? <span className="badge draft">Needs work</span> : <span className="badge pub">Done</span>}</td>
              <td><a className="btn-sm btn-edit" href={a.href}>Replace →</a></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="content-group" style={{ marginTop: 24 }}>
        <h2>Manual checks before launch</h2>
        <ul className="checklist">
          <li>Couple Stories and testimonials have written/video consent recorded.</li>
          <li>Client logos only shown for clients with permission granted.</li>
          <li>Legal pages reviewed by a lawyer.</li>
          <li>Lead notification email set in Settings.</li>
          <li>Contact numbers and WhatsApp number tested.</li>
          <li>SEO indexing toggle matches the decision in Settings.</li>
        </ul>
      </div>
    </>
  );
}
