"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, uploadOne, slugify, PhBadge, StatusBadge, STATUS_OPTIONS } from "../_lib/ui";

const EMPTY = {
  name: "", slug: "", category: "", bio: "", image_url: "", videos: [],
  featured: false, display_status: "Available for booking through Samridhi Films & Television",
  price_note: "", booking_notes: "", languages: [], genres: [],
  sort: 0, status: "published", is_placeholder: false,
};

export default function ArtistsAdmin() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [a, c] = await Promise.all([api("/api/admin/artists"), api("/api/admin/artist-categories")]);
      setRows(a.artists || []); setCategories(c.categories || []);
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => {
    const n = { ...f, [k]: v };
    if (k === "name" && (!editingId || !f.slug)) n.slug = slugify(v);
    return n;
  });

  const startAdd = () => { setForm({ ...EMPTY }); setEditingId(null); setMsg(""); setOkMsg(""); setShowForm(true); };
  const startEdit = (r) => {
    setForm({ ...EMPTY, ...r, languages: r.languages || [], genres: r.genres || [], videos: r.videos || [] });
    setEditingId(r.id); setMsg(""); setOkMsg(""); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setMsg(""); setOkMsg("");
    if (!form.name.trim()) { setMsg("Name is required."); return; }
    try {
      const body = { ...form, slug: form.slug || null };
      if (editingId) await api(`/api/admin/artists/${editingId}`, { method: "PUT", body });
      else await api("/api/admin/artists", { method: "POST", body });
      await revalidateSite();
      setOkMsg("Saved — live on the website now.");
      setShowForm(false); setEditingId(null); setForm({ ...EMPTY }); load();
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const remove = async (r) => {
    if (!confirm(`Remove "${r.name}"?`)) return;
    await api(`/api/admin/artists/${r.id}`, { method: "DELETE" });
    await revalidateSite(); load();
  };

  const setVideo = (i, k, v) => {
    const n = [...form.videos]; n[i] = { ...n[i], [k]: v }; set("videos", n);
  };
  const csv = (arr) => (arr || []).join(", ");
  const fromCsv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <>
      <h1>Artists</h1>
      <p className="admin-sub">The artist line-up for the Artists page and homepage strip. Only artists you mark as available-for-booking profiles appear with booking CTAs.</p>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      {!showForm && <div style={{ marginBottom: 18 }}><button className="btn btn-primary" onClick={startAdd}>+ Add Artist</button></div>}

      {showForm && (
        <div className="editor" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Edit Artist" : "Add Artist"}</h2>
          <div className="form-row">
            <div className="field"><label>Name *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="field"><label>Slug</label><input value={form.slug} onChange={(e) => set("slug", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <div className="seo-hint">Categories are managed in the database (artist_categories).</div>
            </div>
            <div className="field"><label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
          </div>
          <div className="field"><label>Bio</label><textarea rows={5} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></div>
          <div className="field"><label>Photo</label>
            <input type="file" accept="image/*" onChange={async (e) => { const u = await uploadOne(e.target.files[0], setUploading, setMsg); if (u) set("image_url", u); e.target.value = ""; }} />
            {uploading && <div className="seo-hint">Uploading…</div>}
            {form.image_url && <div className="img-preview"><img src={form.image_url} alt="" /></div>}
          </div>

          <div className="field"><label>Performance videos</label>
            {form.videos.map((v, i) => (
              <div key={i} style={{ border: "1.5px solid #ecd9e4", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div className="form-row">
                  <div className="field"><label>Source</label>
                    <select value={v.source || "youtube"} onChange={(e) => setVideo(i, "source", e.target.value)}>
                      <option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="cloudinary">Cloudinary</option><option value="mp4_url">MP4 URL</option>
                    </select>
                  </div>
                  <div className="field"><label>Video title</label><input value={v.title || ""} onChange={(e) => setVideo(i, "title", e.target.value)} /></div>
                </div>
                <div className="field"><label>Reference (URL or ID)</label><input value={v.ref || ""} onChange={(e) => setVideo(i, "ref", e.target.value)} /></div>
                <button type="button" className="btn-sm btn-del" onClick={() => set("videos", form.videos.filter((_, j) => j !== i))}>Remove video</button>
              </div>
            ))}
            <button type="button" className="btn-sm btn-edit" onClick={() => set("videos", [...form.videos, { source: "youtube", ref: "", title: "" }])}>+ Add video</button>
          </div>

          <div className="form-row">
            <div className="field"><label>Languages (comma-separated)</label><input value={csv(form.languages)} onChange={(e) => set("languages", fromCsv(e.target.value))} placeholder="Hindi, English" /></div>
            <div className="field"><label>Genres (comma-separated)</label><input value={csv(form.genres)} onChange={(e) => set("genres", fromCsv(e.target.value))} placeholder="Bollywood, Sufi" /></div>
          </div>
          <div className="field"><label>Display status</label><input value={form.display_status} onChange={(e) => set("display_status", e.target.value)} /></div>
          <div className="form-row">
            <div className="field"><label>Price note</label><input value={form.price_note} onChange={(e) => set("price_note", e.target.value)} placeholder="e.g. On request" /></div>
            <div className="field"><label>Order</label><input type="number" value={form.sort} onChange={(e) => set("sort", Number(e.target.value))} /></div>
          </div>
          <div className="field"><label>Booking notes (internal)</label><textarea rows={3} value={form.booking_notes} onChange={(e) => set("booking_notes", e.target.value)} /></div>
          <label className="check-row"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured artist</label>
          <label className="check-row"><input type="checkbox" checked={form.is_placeholder} onChange={(e) => set("is_placeholder", e.target.checked)} /> Mark as placeholder</label>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={save}>{editingId ? "Save Changes" : "Add Artist"}</button>
            <button className="btn btn-dark" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {busy ? <p>Loading…</p> : (
        <table className="admin-table">
          <thead><tr><th>Artist</th><th>Category</th><th>Status</th><th>Flag</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  {r.image_url && <img src={r.image_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "50%" }} />}
                  <b>{r.name}</b>{r.featured && <span className="badge pub">★</span>}
                </span></td>
                <td>{r.category || "—"}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>{r.is_placeholder ? <PhBadge /> : "—"}</td>
                <td><div className="row-actions">
                  <button className="btn-sm btn-edit" onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn-sm btn-del" onClick={() => remove(r)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
