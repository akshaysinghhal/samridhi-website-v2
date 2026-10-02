"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, uploadOne, PhBadge, StatusBadge, STATUS_OPTIONS, useBulk, BulkBar, CheckCell, SaveButton, StatusFilter, AdminLoader, toast } from "../_lib/ui";
import MediaPicker from "../_lib/MediaPicker";

const SOURCES = [
  { value: "youtube", label: "YouTube" },
  { value: "cloudinary", label: "Cloudinary video" },
  { value: "vimeo", label: "Vimeo" },
  { value: "mp4_url", label: "MP4 URL" },
];

const EMPTY = { title: "", label: "In Their Words", couple_names: "", thumbnail_url: "", video_source: "youtube", video_ref: "", event_id: "", consent_granted: false, featured_on_home: false, sort: 0, status: "draft", is_placeholder: false };

export default function CoupleStoriesAdmin() {
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [thumbPicker, setThumbPicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setBusy(true);
    try {
      const [s, e] = await Promise.all([api("/api/admin/couple-stories"), api("/api/admin/events")]);
      setRows(s.stories || []); setEvents(e.events || []);
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const shown = rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    const needle = q.trim().toLowerCase();
    if (needle && !`${r.title || ""} ${r.couple_names || ""}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  const bulk = useBulk({ rows: shown, patchRows: setRows, endpoint: "/api/admin/couple-stories" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const startAdd = () => { setForm({ ...EMPTY }); setEditingId(null); setMsg(""); setOkMsg(""); setShowForm(true); };
  const startEdit = (r) => {
    setForm({ ...EMPTY, ...r, event_id: r.event_id || "" });
    setEditingId(r.id); setMsg(""); setOkMsg(""); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setMsg(""); setOkMsg("");
    if (!form.title.trim()) { setMsg("Title is required."); return; }
    if (form.status === "published" && !form.consent_granted) {
      setMsg("⛔ Consent is required before publishing. Tick 'Consent granted by the couple' first.");
      return;
    }
    const featuredCount = rows.filter((r) => r.featured_on_home && r.id !== editingId).length;
    if (form.featured_on_home && featuredCount >= 4) {
      if (!confirm(`There are already 4 stories featured on the homepage. Add this as a 5th?`)) return;
    }
    try {
      const body = { ...form, event_id: form.event_id || null };
      if (editingId) {
        await api(`/api/admin/couple-stories/${editingId}`, { method: "PUT", body });
        setRows((rs) => rs.map((r) => (r.id === editingId ? { ...r, ...body } : r)));
      } else {
        const res = await api("/api/admin/couple-stories", { method: "POST", body });
        const saved = res.story || res.row || res.item;
        setRows((rs) => [{ ...body, id: saved?.id || res.id }, ...rs]);
      }
      await revalidateSite();
      setOkMsg("Saved — live on the website now.");
      toast("Story saved — live on the website now.");
      setShowForm(false); setEditingId(null); setForm({ ...EMPTY });
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const remove = async (r) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    await api(`/api/admin/couple-stories/${r.id}`, { method: "DELETE" });
    await revalidateSite();
    setRows((rs) => rs.filter((x) => x.id !== r.id));
    toast("Story deleted.");
  };

  return (
    <>
      <h1>Couple Stories</h1>
      <p className="admin-sub">Video testimonials from couples. Consent is mandatory before a story can be published.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      {!showForm && <div style={{ marginBottom: 18 }}><button className="btn btn-primary" onClick={startAdd}>+ Add Story</button></div>}

      {showForm && (
        <div className="editor" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Edit Story" : "Add Story"}</h2>
          <div className="form-row">
            <div className="field"><label>Title *</label><input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="field"><label>Label / eyebrow</label><input value={form.label} onChange={(e) => set("label", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Couple names</label><input value={form.couple_names} onChange={(e) => set("couple_names", e.target.value)} placeholder="e.g. Aarav & Diya" /></div>
            <div className="field"><label>Linked portfolio event</label>
              <select value={form.event_id} onChange={(e) => set("event_id", e.target.value)}>
                <option value="">— none —</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>Thumbnail</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <input type="file" accept="image/*" onChange={async (e) => { const u = await uploadOne(e.target.files[0], setUploading, setMsg); if (u) set("thumbnail_url", u); e.target.value = ""; }} />
              <button type="button" className="btn-sm btn-edit" onClick={() => setThumbPicker(true)}>🖼 Choose from library</button>
            </div>
            {uploading && <div className="seo-hint">Uploading…</div>}
            {form.thumbnail_url && <div className="img-preview"><img src={form.thumbnail_url} alt="" /></div>}
          </div>
          <div className="form-row">
            <div className="field"><label>Video source</label>
              <select value={form.video_source} onChange={(e) => set("video_source", e.target.value)}>
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="field"><label>Video reference</label><input value={form.video_ref} onChange={(e) => set("video_ref", e.target.value)} placeholder="URL or video ID" /></div>
          </div>
          <label className="check-row" style={{ background: "#fff8e1", padding: "12px 16px", borderRadius: 10, marginBottom: 12 }}>
            <input type="checkbox" checked={form.consent_granted} onChange={(e) => set("consent_granted", e.target.checked)} />
            <b>Consent granted by the couple</b> <span className="seo-hint">(required to publish)</span>
          </label>
          <div className="form-row">
            <div className="field" style={{ display: "flex", alignItems: "center" }}><label className="check-row"><input type="checkbox" checked={form.featured_on_home} onChange={(e) => set("featured_on_home", e.target.checked)} /> Featured on homepage <span className="seo-hint">(max 4)</span></label></div>
            <div className="field"><label>Order</label><input type="number" value={form.sort} onChange={(e) => set("sort", Number(e.target.value))} /></div>
            <div className="field"><label>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div>
          </div>
          <label className="check-row"><input type="checkbox" checked={form.is_placeholder} onChange={(e) => set("is_placeholder", e.target.checked)} /> Mark as placeholder</label>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <SaveButton onClick={save}>{editingId ? "Save Changes" : "Add Story"}</SaveButton>
            <button className="btn btn-dark" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}
      {rows.length > 0 && (
        <div className="list-bar">
          <input className="list-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or couple names…" aria-label="Search stories" style={{ flex: 1, minWidth: 180 }} />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          {(q.trim() || statusFilter) && <span className="seo-hint" style={{ margin: 0, whiteSpace: "nowrap" }}>{shown.length} of {rows.length}</span>}
        </div>
      )}
      {busy ? <AdminLoader /> : (
        <table className="admin-table">
          <thead><tr><th style={{ width: 40 }}><CheckCell checked={bulk.allChecked} onChange={bulk.toggleAll} label="Select all stories" /></th><th>Story</th><th>Source</th><th>Consent</th><th>Status</th><th>Flag</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} style={{ color: "#7a6a7c", textAlign: "center", padding: 24 }}>No stories yet. Add your first story above.</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={7} style={{ color: "#7a6a7c", textAlign: "center", padding: 24 }}>No stories match this filter.</td></tr>
            ) : shown.map((r) => (
              <tr key={r.id} className={bulk.selected.has(r.id) ? "row-selected" : ""}>
                <td><CheckCell checked={bulk.selected.has(r.id)} onChange={() => bulk.toggleOne(r.id)} label={`Select ${r.title}`} /></td>
                <td><b>{r.title}</b>{r.couple_names && <div className="seo-hint">{r.couple_names}</div>}</td>
                <td>{r.video_source}</td>
                <td>{r.consent_granted ? "✅" : "❌"}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>{r.is_placeholder ? <PhBadge /> : "—"}</td>
                <td><div className="row-actions">
                  <a className="btn-sm btn-view" href="/couple-stories" target="_blank" rel="noreferrer">Preview</a>
                  <button className="btn-sm btn-edit" onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn-sm btn-del" onClick={() => remove(r)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <MediaPicker
        open={thumbPicker}
        kind="image"
        onClose={() => setThumbPicker(false)}
        onSelect={(m) => { if (m?.url) set("thumbnail_url", m.url); setThumbPicker(false); }}
      />
    </>
  );
}
