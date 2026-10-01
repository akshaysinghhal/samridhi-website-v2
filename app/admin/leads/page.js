"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../lib/adminApi";
import { SaveButton } from "../_lib/ui";

const STATUSES = ["New", "Contacted", "Quote Sent", "Negotiation", "Won", "Lost"];

// Human-friendly labels for the raw type keys stored in the DB.
const TYPE_LABELS = {
  artist_booking: "Artist Booking",
  quote: "Quote",
  wedding: "Wedding",
  contact: "Contact",
};
function prettyType(t) { return TYPE_LABELS[t] || String(t || "—").replace(/_/g, " "); }

// Status pill colors for quick triage.
const STATUS_STYLE = {
  "New":         { bg: "#fdeee6", fg: "#a03d24", bd: "#f0c4ab" },
  "Contacted":   { bg: "#e8f1fd", fg: "#1d5bbf", bd: "#bcd6f7" },
  "Quote Sent":  { bg: "#f1e9fb", fg: "#6a3fb5", bd: "#d5c2f0" },
  "Negotiation": { bg: "#fdf3df", fg: "#9a6b12", bd: "#f0d9a0" },
  "Won":         { bg: "#e6f6ec", fg: "#1e7b3c", bd: "#b7e3c6" },
  "Lost":        { bg: "#f1f1f1", fg: "#6b6b6b", bd: "#d5d5d5" },
};
function statusStyle(s) { return STATUS_STYLE[s] || STATUS_STYLE["New"]; }

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
        <label className="switch" title="Hide leads marked as spam">
          <input type="checkbox" checked={hideSpam} onChange={(e) => setHideSpam(e.target.checked)} />
          <span className="sw" aria-hidden="true" />
          Hide spam
        </label>
        <button className="btn-sm btn-new" onClick={exportCsv}>⬇ CSV export</button>
      </div>

      <div className="leads-list">
        {busy ? <p>Loading…</p> : shown.length === 0 ? <p>No leads match.</p> : (
            <table className="admin-table">
              <thead><tr><th>Lead</th><th>Type</th><th>Event</th><th>Status</th><th>Received</th></tr></thead>
              <tbody>
                {shown.map((l) => {
                  const dup = digits(l.phone) && dupPhones[digits(l.phone)] > 1;
                  const st = statusStyle(l.status);
                  const isSel = selected && selected.id === l.id;
                  return (
                    <tr key={l.id} className={isSel ? "row-selected" : ""} onClick={() => openLead(l)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <b>{l.name || "—"}</b>
                          {l.spam && <span className="badge draft">spam</span>}
                          {dup && <span className="badge dup" title="Same phone number appears on another lead">dup</span>}
                        </div>
                        <div className={dup ? "dup-phone" : "seo-hint"} title={dup ? "Duplicate phone number" : l.phone}>{l.phone || "—"}</div>
                      </td>
                      <td><span className="type-badge">{prettyType(l.type)}</span></td>
                      <td>
                        <div>{l.event_type || "—"}</div>
                        {l.event_date ? <div className="seo-hint">{l.event_date}</div> : null}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={l.status}
                          onChange={(e) => patchLead(l.id, { status: e.target.value })}
                          className="status-pill"
                          style={{ background: st.bg, color: st.fg, borderColor: st.bd }}
                          aria-label="Lead status"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="seo-hint" style={{ whiteSpace: "nowrap" }}>{new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {selected && (
        <LeadModal
          lead={selected}
          notes={notes}
          noteBody={noteBody}
          setNoteBody={setNoteBody}
          followUp={followUp}
          setFollowUp={setFollowUp}
          assignTo={assignTo}
          setAssignTo={setAssignTo}
          patchLead={patchLead}
          addNote={addNote}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// Lead details open in a popup (modal) instead of a side panel.
function LeadModal({ lead, notes, noteBody, setNoteBody, followUp, setFollowUp, assignTo, setAssignTo, patchLead, addNote, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = prev; };
  }, [onClose]);
  const st = statusStyle(lead.status);
  return (
    <div className="lead-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Lead: ${lead.name || "details"}`}>
      <div className="lead-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lead-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{lead.name || "Unnamed lead"}</h2>
              <span className="type-badge">{prettyType(lead.type)}</span>
              {lead.spam && <span className="badge draft">spam</span>}
            </div>
            <div className="seo-hint" style={{ marginTop: 4 }}>
              Received {new Date(lead.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
          <button ref={closeRef} className="btn-sm btn-del" onClick={onClose} aria-label="Close lead details">✕</button>
        </div>

        <div className="lead-status-row">
          <label>Status</label>
          <select
            value={lead.status}
            onChange={(e) => patchLead(lead.id, { status: e.target.value })}
            className="status-pill"
            style={{ background: st.bg, color: st.fg, borderColor: st.bd }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="detail-grid">
          <div className="d-field"><span>Phone</span><b>{lead.phone || "—"}</b></div>
          <div className="d-field"><span>Email</span><b className="break-all">{lead.email || "—"}</b></div>
          <div className="d-field"><span>Company</span><b>{lead.company || "—"}</b></div>
          <div className="d-field"><span>Type</span><b>{prettyType(lead.type)}</b></div>
          <div className="d-field"><span>Event type</span><b>{lead.event_type || "—"}</b></div>
          <div className="d-field"><span>Event date</span><b>{lead.event_date || "—"}</b></div>
          <div className="d-field"><span>Location</span><b>{lead.location || "—"}</b></div>
          <div className="d-field"><span>Guests</span><b>{lead.guests || "—"}</b></div>
          <div className="d-field"><span>Budget</span><b>{lead.budget || "—"}</b></div>
          <div className="d-field d-full"><span>Source page</span>
            {lead.source_page
              ? <a href={lead.source_page} target="_blank" rel="noreferrer" className="break-all lead-link">{lead.source_page}</a>
              : <b>—</b>}
          </div>
        </div>
        {lead.message && <div className="field" style={{ marginTop: 12 }}><label>Message</label><div className="detail-msg">{lead.message}</div></div>}
        {lead.utm && Object.keys(lead.utm).length > 0 && (
          <div className="seo-hint" style={{ marginTop: 8 }}>UTM: {Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(" · ")}</div>
        )}

        <div className="contact-btns">
          {lead.phone && <a className="btn-sm btn-new" href={`tel:${digits(lead.phone)}`}>📞 Call</a>}
          {lead.phone && <a className="btn-sm btn-edit" target="_blank" rel="noreferrer" href={`https://wa.me/${waPhone(lead.phone)}?text=${encodeURIComponent("Hello " + (lead.name || "") + ", this is Samridhi Films & Television following up on your enquiry.")}`}>💬 WhatsApp</a>}
          {lead.email && <a className="btn-sm btn-edit" href={`mailto:${lead.email}?subject=${encodeURIComponent("Your enquiry — Samridhi Films & Television")}`}>✉️ Email</a>}
        </div>

        <div className="form-row" style={{ marginTop: 16 }}>
          <div className="field"><label>Assigned to</label><input value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="Team member name" onBlur={() => { if (assignTo !== (lead.assigned_to || "")) patchLead(lead.id, { assigned_to: assignTo }); }} /></div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <label className="check-row"><input type="checkbox" checked={!!lead.spam} onChange={(e) => patchLead(lead.id, { spam: e.target.checked })} /> Mark as spam</label>
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
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}><SaveButton onClick={addNote}>Add Note</SaveButton></div>
        </div>
      </div>
    </div>
  );
}
