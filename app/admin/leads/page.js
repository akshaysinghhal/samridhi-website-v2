"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/adminApi";

const STATUSES = ["New", "Contacted", "Quote Sent", "Negotiation", "Won", "Lost"];

function digits(phone) { return String(phone || "").replace(/\D/g, ""); }
function waPhone(phone) {
  const d = digits(phone);
  if (d.length === 10) return "91" + d;
  if (d.length === 12 && d.startsWith("91")) return d;
  return d;
}

export default function LeadsAdmin() {
  const [leads, setLeads] = useState([]);
  const [busy, setBusy] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [hideSpam, setHideSpam] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteBody, setNoteBody] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());
      const r = await api("/api/admin/leads?" + params.toString());
      setLeads(r.leads || []);
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, [statusFilter]);

  const shown = useMemo(() => (hideSpam ? leads.filter((l) => !l.spam) : leads), [leads, hideSpam]);
  const dupPhones = useMemo(() => {
    const counts = {};
    for (const l of shown) { const d = digits(l.phone); if (d) counts[d] = (counts[d] || 0) + 1; }
    return counts;
  }, [shown]);

  const openLead = async (lead) => {
    setSelected(lead); setAssignTo(lead.assigned_to || ""); setMsg("");
    try { setNotes((await api(`/api/admin/leads/${lead.id}/notes`)).notes || []); } catch { setNotes([]); }
  };

  const patchLead = async (id, patch) => {
    try {
      const r = await api(`/api/admin/leads/${id}`, { method: "PUT", body: patch });
      setLeads((xs) => xs.map((l) => (l.id === id ? r.lead : l)));
      if (selected && selected.id === id) setSelected(r.lead);
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const addNote = async () => {
    if (!noteBody.trim() || !selected) return;
    try {
      const r = await api(`/api/admin/leads/${selected.id}/notes`, {
        method: "POST",
        body: { body: noteBody.trim(), follow_up_at: followUp || null },
      });
      setNotes((n) => [r.note, ...n]); setNoteBody(""); setFollowUp("");
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const exportCsv = () => {
    const cols = ["created_at", "type", "name", "company", "phone", "email", "event_type", "event_date", "location", "guests", "budget", "message", "status", "assigned_to", "source_page"];
    const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = [cols.join(",")].concat(shown.map((l) => cols.map((c) => esc(l[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "samridhi-leads.csv";
    a.click();
  };

  return (
    <>
      <h1>Leads</h1>
      <p className="admin-sub">Enquiries from the quote, artist-booking, wedding and contact forms. Phone numbers in bold red are duplicates.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="leads-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search name, phone, email…" style={{ flex: 1, minWidth: 200 }} />
        <button className="btn-sm btn-edit" onClick={load}>Search</button>
        <label className="check-row" style={{ margin: 0 }}><input type="checkbox" checked={hideSpam} onChange={(e) => setHideSpam(e.target.checked)} /> Hide spam</label>
        <button className="btn-sm btn-new" onClick={exportCsv}>⬇ CSV export</button>
      </div>

      <div className="leads-wrap">
        <div className="leads-list">
          {busy ? <p>Loading…</p> : shown.length === 0 ? <p>No leads match.</p> : (
            <table className="admin-table">
              <thead><tr><th>Lead</th><th>Type</th><th>Event</th><th>Status</th><th>Received</th></tr></thead>
              <tbody>
                {shown.map((l) => {
                  const dup = digits(l.phone) && dupPhones[digits(l.phone)] > 1;
                  return (
                    <tr key={l.id} className={selected && selected.id === l.id ? "row-selected" : ""} onClick={() => openLead(l)} style={{ cursor: "pointer" }}>
                      <td>
                        <b>{l.name || "—"}</b>
                        <div className={dup ? "dup-phone" : "seo-hint"} title={dup ? "Duplicate phone number" : ""}>{l.phone || "—"}</div>
                        {l.spam && <span className="badge draft">spam</span>}
                      </td>
                      <td>{l.type}</td>
                      <td>{l.event_type || "—"}{l.event_date ? <div className="seo-hint">{l.event_date}</div> : null}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select value={l.status} onChange={(e) => patchLead(l.id, { status: e.target.value })} style={{ padding: "6px 8px" }}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="seo-hint">{new Date(l.created_at).toLocaleDateString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="leads-detail editor">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{selected.name}</h2>
              <button className="btn-sm btn-del" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="detail-grid">
              <div><span>Phone</span><b>{selected.phone || "—"}</b></div>
              <div><span>Email</span><b>{selected.email || "—"}</b></div>
              <div><span>Company</span><b>{selected.company || "—"}</b></div>
              <div><span>Type</span><b>{selected.type}</b></div>
              <div><span>Event type</span><b>{selected.event_type || "—"}</b></div>
              <div><span>Event date</span><b>{selected.event_date || "—"}</b></div>
              <div><span>Location</span><b>{selected.location || "—"}</b></div>
              <div><span>Guests</span><b>{selected.guests || "—"}</b></div>
              <div><span>Budget</span><b>{selected.budget || "—"}</b></div>
              <div><span>Source page</span><b style={{ wordBreak: "break-all" }}>{selected.source_page || "—"}</b></div>
            </div>
            {selected.message && <div className="field" style={{ marginTop: 12 }}><label>Message</label><div className="detail-msg">{selected.message}</div></div>}
            {selected.utm && Object.keys(selected.utm).length > 0 && (
              <div className="seo-hint" style={{ marginTop: 8 }}>UTM: {Object.entries(selected.utm).map(([k, v]) => `${k}=${v}`).join(" · ")}</div>
            )}

            <div className="contact-btns">
              {selected.phone && <a className="btn-sm btn-new" href={`tel:${digits(selected.phone)}`}>📞 Call</a>}
              {selected.phone && <a className="btn-sm btn-edit" target="_blank" rel="noreferrer" href={`https://wa.me/${waPhone(selected.phone)}?text=${encodeURIComponent("Hello " + (selected.name || "") + ", this is Samridhi Films & Television following up on your enquiry.")}`}>💬 WhatsApp</a>}
              {selected.email && <a className="btn-sm btn-edit" href={`mailto:${selected.email}?subject=${encodeURIComponent("Your enquiry — Samridhi Films & Television")}`}>✉️ Email</a>}
            </div>

            <div className="form-row" style={{ marginTop: 16 }}>
              <div className="field"><label>Assigned to</label><input value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="Team member name" onBlur={() => { if (assignTo !== (selected.assigned_to || "")) patchLead(selected.id, { assigned_to: assignTo }); }} /></div>
              <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                <label className="check-row"><input type="checkbox" checked={!!selected.spam} onChange={(e) => patchLead(selected.id, { spam: e.target.checked })} /> Mark as spam</label>
              </div>
            </div>

            <h3 style={{ marginTop: 20 }}>Internal notes</h3>
            {notes.map((n) => (
              <div key={n.id} className="note-card">
                <div className="note-head"><b>{n.author || "Team"}</b><span>{new Date(n.created_at).toLocaleString("en-IN")}</span></div>
                <div>{n.body}</div>
                {n.follow_up_at && <div className="seo-hint" style={{ marginTop: 6 }}>⏰ Follow up: {new Date(n.follow_up_at).toLocaleString("en-IN")}</div>}
              </div>
            ))}
            <div className="field"><label>Add note</label><textarea rows={3} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Internal note (never shown publicly)…" /></div>
            <div className="form-row">
              <div className="field"><label>Follow-up reminder</label><input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></div>
              <div className="field" style={{ display: "flex", alignItems: "flex-end" }}><button className="btn btn-primary" onClick={addNote}>Add Note</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
