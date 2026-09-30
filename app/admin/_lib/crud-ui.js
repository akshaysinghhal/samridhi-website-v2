"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, uploadOne, PhBadge, StatusBadge, STATUS_OPTIONS, slugify } from "./ui";

// Config-driven admin CRUD: list table + add/edit form.
// fields: [{key,label,type,required,placeholder,options,rows,hint}]
// types: text|textarea|number|date|select|check|image|images|list|faq
export default function AdminCrud({
  title, sub, endpoint, listKey, columns, fields,
  defaults = {}, validate, slugFrom, note, addLabel, beforeSave,
}) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState({ ...defaults });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setBusy(true);
    try { setRows((await api(endpoint))[listKey] || []); } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, [endpoint, listKey]);

  const set = (key, v) => {
    setForm((f) => {
      const next = { ...f, [key]: v };
      if (slugFrom && key === slugFrom && (!editingId || !f.slug)) next.slug = slugify(v);
      return next;
    });
  };

  const startAdd = () => { setForm({ ...defaults }); setEditingId(null); setMsg(""); setOkMsg(""); setShowForm(true); };
  const startEdit = (row) => {
    const f = { ...defaults };
    for (const fld of fields) {
      const fromRow = fld.get ? fld.get(row) : row[fld.key];
      f[fld.key] = fromRow ?? defaults[fld.key] ?? "";
    }
    setForm(f); setEditingId(row.id); setMsg(""); setOkMsg(""); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setMsg(""); setOkMsg("");
    if (validate) {
      const err = validate(form);
      if (err) { setMsg(err); return; }
    }
    try {
      const body = beforeSave ? beforeSave({ ...form }) : form;
      if (editingId) await api(`${endpoint}/${editingId}`, { method: "PUT", body });
      else await api(endpoint, { method: "POST", body });
      await revalidateSite();
      setOkMsg("Saved — live on the website now.");
      setShowForm(false); setEditingId(null); setForm({ ...defaults });
      load();
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  const remove = async (row) => {
    const label = row.title || row.name || row.slug || row.id;
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try { await api(`${endpoint}/${row.id}`, { method: "DELETE" }); await revalidateSite(); load(); }
    catch (e) { setMsg("Failed: " + e.message); }
  };

  const onFile = async (e, key, multi) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setMsg("");
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadOne(file, null, setMsg);
        if (url) urls.push(url);
      }
      if (urls.length) {
        setForm((f) => ({ ...f, [key]: multi ? [...(Array.isArray(f[key]) ? f[key] : []), ...urls] : urls[0] }));
      }
    } finally { setUploading(false); e.target.value = ""; }
  };

  const renderField = (f) => {
    const v = form[f.key];
    const req = f.required ? " *" : null;
    switch (f.type) {
      case "textarea":
        return <div className="field" key={f.key}><label>{f.label}{req}</label><textarea rows={f.rows || 4} value={v || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />{f.hint && <div className="seo-hint">{f.hint}</div>}</div>;
      case "number":
        return <div className="field" key={f.key}><label>{f.label}{req}</label><input type="number" value={v ?? 0} onChange={(e) => set(f.key, Number(e.target.value))} /></div>;
      case "date":
        return <div className="field" key={f.key}><label>{f.label}{req}</label><input type="date" value={v || ""} onChange={(e) => set(f.key, e.target.value || null)} /></div>;
      case "select": {
        const opts = (f.options || []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
        const numeric = opts.length > 0 && opts.every((o) => typeof o.value === "number");
        return <div className="field" key={f.key}><label>{f.label}{req}</label><select value={v ?? ""} onChange={(e) => set(f.key, numeric ? Number(e.target.value) : e.target.value)}>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
      }
      case "check":
        return <label className="check-row" key={f.key}><input type="checkbox" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} /> {f.label}{f.hint && <span className="seo-hint" style={{ marginLeft: 8 }}>{f.hint}</span>}</label>;
      case "image":
        return <div className="field" key={f.key}><label>{f.label}{req}</label>
          <input type="file" accept="image/*" onChange={(e) => onFile(e, f.key, false)} />
          {uploading && <div className="seo-hint">Uploading…</div>}
          {v && <div className="img-preview"><div className="img-thumb"><img src={v} alt="" /><button type="button" onClick={() => set(f.key, "")}>✕</button></div></div>}
        </div>;
      case "images": {
        const arr = Array.isArray(v) ? v : [];
        return <div className="field" key={f.key}><label>{f.label}{req}</label>
          <input type="file" accept="image/*" multiple onChange={(e) => onFile(e, f.key, true)} />
          {uploading && <div className="seo-hint">Uploading…</div>}
          {arr.length > 0 && <div className="img-preview">{arr.map((u, i) => <div className="img-thumb" key={i}><img src={u} alt="" /><button type="button" onClick={() => set(f.key, arr.filter((_, j) => j !== i))}>✕</button></div>)}</div>}
        </div>;
      }
      case "list": {
        const arr = Array.isArray(v) ? v : [];
        return <div className="field" key={f.key}><label>{f.label}{req}</label>
          {arr.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={it} onChange={(e) => { const n = [...arr]; n[i] = e.target.value; set(f.key, n); }} style={{ flex: 1 }} placeholder={f.placeholder} />
              <button type="button" className="btn-sm btn-del" onClick={() => set(f.key, arr.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-sm btn-edit" onClick={() => set(f.key, [...arr, ""])}>+ Add</button>
        </div>;
      }
      case "faq": {
        const arr = Array.isArray(v) ? v : [];
        return <div className="field" key={f.key}><label>{f.label}</label>
          {arr.map((qa, i) => (
            <div key={i} style={{ border: "1.5px solid #ecd9e4", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <input value={qa.q || ""} onChange={(e) => { const n = [...arr]; n[i] = { ...n[i], q: e.target.value }; set(f.key, n); }} placeholder="Question" style={{ width: "100%", marginBottom: 8 }} />
              <textarea rows={2} value={qa.a || ""} onChange={(e) => { const n = [...arr]; n[i] = { ...n[i], a: e.target.value }; set(f.key, n); }} placeholder="Answer" style={{ width: "100%" }} />
              <button type="button" className="btn-sm btn-del" style={{ marginTop: 8 }} onClick={() => set(f.key, arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn-sm btn-edit" onClick={() => set(f.key, [...arr, { q: "", a: "" }])}>+ Add FAQ</button>
        </div>;
      }
      default:
        return <div className="field" key={f.key}><label>{f.label}{req}</label><input value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />{f.hint && <div className="seo-hint">{f.hint}</div>}</div>;
    }
  };

  const cell = (row, col) => {
    if (col.render) return col.render(row);
    const v = row[col.key];
    if (col.key === "is_placeholder") return v ? <PhBadge /> : <span style={{ color: "#bbb" }}>—</span>;
    if (col.key === "status") return <StatusBadge status={v} />;
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.length;
    return v ?? "—";
  };

  return (
    <>
      <h1>{title}</h1>
      {sub && <p className="admin-sub">{sub}</p>}
      {note && <div className="admin-note">{note}</div>}
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      {!showForm && (
        <div style={{ marginBottom: 18 }}>
          <button className="btn btn-primary" onClick={startAdd}>+ {addLabel || "Add New"}</button>
        </div>
      )}

      {showForm && (
        <div className="editor" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Edit" : "Add New"}</h2>
          {fields.map(renderField)}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={save}>{editingId ? "Save Changes" : "Add"}</button>
            <button className="btn btn-dark" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...defaults }); setMsg(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {busy ? <p>Loading…</p> : rows.length === 0 ? <p style={{ color: "#7a6a7c" }}>Nothing here yet.</p> : (
        <table className="admin-table">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => <td key={c.key}>{cell(row, c)}</td>)}
                <td><div className="row-actions">
                  <button className="btn-sm btn-edit" onClick={() => startEdit(row)}>Edit</button>
                  <button className="btn-sm btn-del" onClick={() => remove(row)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export { STATUS_OPTIONS };
