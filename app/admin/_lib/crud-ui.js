"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite, uploadOne, PhBadge, StatusBadge, STATUS_OPTIONS, slugify, SaveButton, StatusFilter, AdminLoader, toast } from "./ui";
import { AiFormFill } from "./AiFormFill";
import { AiFieldButton } from "./AiAssist";
import MediaPicker from "./MediaPicker";
import PreviewModal from "./PreviewModal";

// Recommended dimensions shown as guidance under media fields. These are
// suggestions, not enforced rules — Akshay asked for them as hints.
export const SIZE_HINTS = {
  cover: "Suggested: 1600 × 900 px (16:9)",
  hero: "Suggested: 1920 × 1080 px (16:9)",
  portrait: "Suggested: 800 × 1000 px (4:5)",
  square: "Suggested: 1080 × 1080 px (1:1)",
  logo: "Suggested: 512 × 512 px, transparent PNG",
};

// Config-driven admin CRUD: list table + add/edit form.
// fields: [{key,label,type,required,placeholder,options,rows,hint,sizeHint}]
// types: text|textarea|number|date|select|check|image|images|video|list|faq
// sizeHint: e.g. SIZE_HINTS.cover — a recommended-dimensions guidance line.
// previewFor: (row) => public URL to preview the row (or null to hide)
// shareFor: (row) => WhatsApp share text for the row (or null to hide)
// externalRefresh: change this value (e.g. a counter) to trigger a silent list refresh.
export default function AdminCrud({
  title, sub, endpoint, listKey, columns, fields,
  defaults = {}, validate, slugFrom, note, addLabel, beforeSave, previewFor, shareFor, externalRefresh,
  revalidatePaths, aiFillFields, aiFillHint, aiInstructions, aiPlaceholder,
}) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState({ ...defaults });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState("");
  const [bulkStatus, setBulkStatus] = useState("published");
  const [picker, setPicker] = useState(null); // { key, multi, kind }
  const [preview, setPreview] = useState(null); // { url, kind }
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  // revalidatePaths: extra public paths to purge on save/delete.
  // Array of strings, or (savedRow, allRows) => string[].
  const bust = async (saved) => {
    let extra = [];
    try {
      extra = typeof revalidatePaths === "function" ? (revalidatePaths(saved, rows) || []) : (revalidatePaths || []);
    } catch { extra = []; }
    const paths = ["/", ...extra.filter((p) => typeof p === "string" && p.startsWith("/"))].slice(0, 20);
    await revalidateSite(paths);
  };

  // silent=true refreshes data without flashing the "Loading…" state.
  const load = async (silent) => {
    if (!silent) setBusy(true);
    try { setRows((await api(endpoint))[listKey] || []); } catch { /* ignore */ }
    if (!silent) setBusy(false);
  };
  useEffect(() => { load(); }, [endpoint, listKey]);
  useEffect(() => { if (externalRefresh) load(true); }, [externalRefresh]);

  const hasStatus = rows.some((r) => typeof r.status === "string");

  // Client-side search + status filter for the list table.
  const shown = rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    const needle = q.trim().toLowerCase();
    if (needle) {
      const hay = Object.values(r)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v) => typeof v === "string" || typeof v === "number")
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

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
      let saved;
      if (editingId) {
        const res = await api(`${endpoint}/${editingId}`, { method: "PUT", body });
        saved = res.item || res.row || res.post || res.clipping || { ...body, id: editingId };
        // Update the row in place — no list reload flash.
        setRows((rs) => rs.map((r) => (r.id === editingId ? { ...r, ...saved } : r)));
      } else {
        const res = await api(endpoint, { method: "POST", body });
        saved = res.item || res.row || res.post || res.clipping || { ...body, id: res.id };
        setRows((rs) => [saved, ...rs]);
      }
      await bust(saved);
      setOkMsg("Saved — live on the website now.");
      toast(editingId ? "Changes saved — live on the website now." : "Added — live on the website now.");
      setShowForm(false); setEditingId(null); setForm({ ...defaults });
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  const remove = async (row) => {
    const label = row.title || row.name || row.slug || row.id;
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await api(`${endpoint}/${row.id}`, { method: "DELETE" });
      await bust(row);
      // Remove the row in place — no list reload flash.
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      setSelected((s) => { const n = new Set(s); n.delete(row.id); return n; });
      toast("Deleted.");
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
  };

  // --- bulk selection -------------------------------------------------------
  // "Select all" applies to the currently filtered view (shown), not hidden rows.
  const allIds = shown.map((r) => r.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(allIds));
  };
  const toggleOne = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkSetStatus = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(`Updating 0/${ids.length}…`); setMsg("");
    let done = 0, failed = 0;
    for (const id of ids) {
      try {
        await api(`${endpoint}/${id}`, { method: "PUT", body: { status: bulkStatus } });
        done++;
      } catch { failed++; }
      setBulkBusy(`Updating ${done + failed}/${ids.length}…`);
    }
    // Patch statuses in place — no list reload flash.
    setRows((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, status: bulkStatus } : r)));
    setSelected(new Set());
    setBulkBusy("");
    await bust(null);
    const okMsg = failed ? `Updated ${done}, failed ${failed}.` : `Updated ${done} item${done > 1 ? "s" : ""} to ${bulkStatus}.`;
    setOkMsg(okMsg);
    toast(okMsg, failed ? "error" : "success");
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected item${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkBusy(`Deleting 0/${ids.length}…`); setMsg("");
    let done = 0, failed = 0;
    for (const id of ids) {
      try { await api(`${endpoint}/${id}`, { method: "DELETE" }); done++; }
      catch { failed++; }
      setBulkBusy(`Deleting ${done + failed}/${ids.length}…`);
    }
    const gone = new Set(ids);
    setRows((rs) => rs.filter((r) => !gone.has(r.id)));
    setSelected(new Set());
    setBulkBusy("");
    await bust(null);
    const okMsg2 = failed ? `Deleted ${done}, failed ${failed}.` : `Deleted ${done} item${done > 1 ? "s" : ""}.`;
    setOkMsg(okMsg2);
    toast(okMsg2, failed ? "error" : "success");
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

  // AI watches the chosen video and fills text fields (e.g. testimonial quote).
  // f.aiDescribe: { instructions?, fields?: [keys to merge] }
  const describeVideo = async (f, url) => {
    if (!url || aiBusy) return;
    const cfg = typeof f.aiDescribe === "object" ? f.aiDescribe : {};
    setAiBusy(true); setMsg("");
    try {
      const r = await api("/api/admin/ai-video", {
        method: "POST",
        body: { videoUrl: url, instructions: cfg.instructions || "" },
      });
      const keys = Array.isArray(cfg.fields) && cfg.fields.length ? cfg.fields : ["quote", "author_name", "company"];
      const values = {};
      let n = 0;
      for (const k of keys) {
        const val = r[k];
        if (val !== undefined && val !== null && String(val).trim() !== "") { values[k] = String(val).trim(); n++; }
      }
      if (n) {
        setForm((f0) => ({ ...f0, ...values }));
        setMsg("AI watched the video and filled the form — please review before saving.");
      } else {
        setMsg("AI could not pick out a testimonial from that video.");
      }
    } catch (e) {
      setMsg("AI video analysis failed: " + (e.message || "try again"));
    } finally { setAiBusy(false); }
  };

  // MediaPicker selection lands here: set (or append) the chosen URL(s).
  const onPick = (items) => {
    if (!picker) return;
    const { key, multi } = picker;
    const arr = Array.isArray(items) ? items : [items];
    if (multi) {
      setForm((f) => ({ ...f, [key]: [...(Array.isArray(f[key]) ? f[key] : []), ...arr.map((i) => i.url)] }));
    } else {
      set(key, arr[0] ? arr[0].url : "");
    }
  };

  const openPicker = (key, multi, kind) => setPicker({ key, multi, kind });

  const renderField = (f) => {
    const v = form[f.key];
    const req = f.required ? " *" : null;
    const sizeHint = f.sizeHint ? <div className="seo-hint">📐 {f.sizeHint}</div> : null;
    // Optional per-field AI writing button (f.ai = true): opens the AI modal
    // and inserts the generated text into this field.
    const aiBtn = f.ai ? (
      <AiFieldButton
        onInsert={(t) => set(f.key, t)}
        label={`Write ${f.label} with AI`}
        seedPrompt={f.aiSeed || `Write ${f.label.toLowerCase()} for "${form.title || form.name || "this entry"}"`}
      />
    ) : null;
    const labelRow = aiBtn ? (
      <div className="ai-field-row"><label>{f.label}{req}</label>{aiBtn}</div>
    ) : <label>{f.label}{req}</label>;
    switch (f.type) {
      case "divider":
        return <div className="or-divider" key={f.key || "divider"} aria-hidden="true"><span>{f.label || "OR"}</span></div>;
      case "textarea":
        return <div className="field" key={f.key}>{labelRow}<textarea rows={f.rows || 4} value={v || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />{f.hint && <div className="seo-hint">{f.hint}</div>}</div>;
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
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="image/*" onChange={(e) => onFile(e, f.key, false)} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => openPicker(f.key, false, "image")}>📚 Choose from library</button>
          </div>
          {uploading && <div className="seo-hint">Uploading…</div>}
          {sizeHint}
          {v && <div className="img-preview"><div className="img-thumb">
            <img src={v} alt="" onClick={() => setPreview({ url: v, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" />
            <button type="button" onClick={() => set(f.key, "")}>✕</button>
          </div></div>}
        </div>;
      case "images": {
        const arr = Array.isArray(v) ? v : [];
        return <div className="field" key={f.key}><label>{f.label}{req}</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="image/*" multiple onChange={(e) => onFile(e, f.key, true)} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => openPicker(f.key, true, "image")}>📚 Choose from library</button>
          </div>
          {uploading && <div className="seo-hint">Uploading…</div>}
          {sizeHint}
          {arr.length > 0 && <div className="img-preview">{arr.map((u, i) => <div className="img-thumb" key={i}>
            <img src={u} alt="" onClick={() => setPreview({ url: u, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" />
            <button type="button" onClick={() => set(f.key, arr.filter((_, j) => j !== i))}>✕</button>
          </div>)}</div>}
        </div>;
      }
      case "video":
        return <div className="field" key={f.key}><label>{f.label}{req}</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="video/*" onChange={(e) => onFile(e, f.key, false)} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => openPicker(f.key, false, "video")}>📚 Choose from library</button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
            <input value={v || ""} onChange={(e) => set(f.key, e.target.value)} placeholder="…or paste a video URL" style={{ flex: "1 1 200px" }} />
            {f.aiDescribe && !!v && (
              <button type="button" className="btn-sm btn-edit" disabled={aiBusy} onClick={() => describeVideo(f, v)}>✨ Describe video with AI</button>
            )}
          </div>
          {uploading && <div className="seo-hint">Uploading…</div>}
          {aiBusy && <div className="seo-hint">AI is watching the video… this takes ~20–30 seconds.</div>}
          {sizeHint}
          {v && <div className="img-preview"><div className="img-thumb">
            <video src={v} preload="metadata" onClick={() => setPreview({ url: v, kind: "video" })} style={{ cursor: "zoom-in", width: 120, height: 90, objectFit: "cover", borderRadius: 10 }} title="Click to preview" />
            <button type="button" onClick={() => set(f.key, "")}>✕</button>
          </div></div>}
          {f.hint && <div className="seo-hint">{f.hint}</div>}
        </div>;
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
            <div key={i} style={{ border: "1.5px solid #e6dcf3", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <input value={qa.q || ""} onChange={(e) => { const n = [...arr]; n[i] = { ...n[i], q: e.target.value }; set(f.key, n); }} placeholder="Question" style={{ width: "100%", marginBottom: 8 }} />
              <textarea rows={2} value={qa.a || ""} onChange={(e) => { const n = [...arr]; n[i] = { ...n[i], a: e.target.value }; set(f.key, n); }} placeholder="Answer" style={{ width: "100%" }} />
              <button type="button" className="btn-sm btn-del" style={{ marginTop: 8 }} onClick={() => set(f.key, arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn-sm btn-edit" onClick={() => set(f.key, [...arr, { q: "", a: "" }])}>+ Add FAQ</button>
        </div>;
      }
      default:
        return <div className="field" key={f.key}>{labelRow}<input value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />{f.hint && <div className="seo-hint">{f.hint}</div>}</div>;
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

  const previewUrl = (row) => {
    try { return previewFor ? previewFor(row) : null; } catch { return null; }
  };
  const shareText = (row) => {
    try { return shareFor ? shareFor(row) : null; } catch { return null; }
  };
  const waShare = (row) => {
    const t = shareText(row);
    if (t) window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
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
          {aiFillFields && (
            <AiFormFill
              fields={aiFillFields}
              hint={aiFillHint}
              instructions={aiInstructions}
              placeholder={aiPlaceholder}
              onFill={(values) => setForm((f) => ({ ...f, ...values }))}
            />
          )}
          {fields.map(renderField)}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <SaveButton onClick={save}>{editingId ? "Save Changes" : "Add"}</SaveButton>
            <button className="btn btn-dark" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...defaults }); setMsg(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="bulk-bar">
          <strong>{selected.size} selected</strong>
          {hasStatus && (
            <>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} aria-label="Bulk status">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
              <button className="btn-sm btn-edit" disabled={!!bulkBusy} onClick={bulkSetStatus}>Apply status</button>
            </>
          )}
          <button className="btn-sm btn-del" disabled={!!bulkBusy} onClick={bulkDelete}>Delete selected</button>
          <button className="btn-sm" disabled={!!bulkBusy} onClick={() => setSelected(new Set())} style={{ background: "#eee", color: "#555" }}>Clear</button>
          {bulkBusy && <span className="seo-hint" style={{ margin: 0 }}>{bulkBusy}</span>}
        </div>
      )}

      {rows.length > 0 && (
        <div className="list-bar">
          <input
            className="list-filter"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this list…"
            aria-label="Search list"
            style={{ flex: 1, minWidth: 180 }}
          />
          {hasStatus && <StatusFilter value={statusFilter} onChange={setStatusFilter} />}
          {(q.trim() || statusFilter) && (
            <span className="seo-hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
              {shown.length} of {rows.length}
            </span>
          )}
        </div>
      )}

      {busy ? <AdminLoader /> : shown.length === 0 ? (
        <p style={{ color: "#7a6a7c" }}>{rows.length === 0 ? "Nothing here yet." : "No items match this filter."}</p>
      ) : (
        <table className="admin-table">
          <thead><tr>
            <th style={{ width: 40 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" style={{ width: 17, height: 17, accentColor: "var(--brand)" }} /></th>
            {columns.map((c) => <th key={c.key}>{c.label}</th>)}<th></th>
          </tr></thead>
          <tbody>
            {shown.map((row) => {
              const url = previewUrl(row);
              return (
                <tr key={row.id} className={selected.has(row.id) ? "row-selected" : ""}>
                  <td><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} aria-label={`Select ${row.title || row.name || row.slug || row.id}`} style={{ width: 17, height: 17, accentColor: "var(--brand)" }} /></td>
                  {columns.map((c) => <td key={c.key}>{cell(row, c)}</td>)}
                  <td><div className="row-actions">
                    {url && <a className="btn-sm btn-view" href={url} target="_blank" rel="noreferrer">Preview</a>}
                    {shareText(row) && <button className="btn-sm btn-edit" onClick={() => waShare(row)} title="Share on WhatsApp">💬</button>}
                    <button className="btn-sm btn-edit" onClick={() => startEdit(row)}>Edit</button>
                    <button className="btn-sm btn-del" onClick={() => remove(row)}>Delete</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {picker && (
        <MediaPicker
          open={!!picker}
          kind={picker.kind}
          multi={!!picker.multi}
          onClose={() => setPicker(null)}
          onSelect={onPick}
        />
      )}
      {preview && (
        <PreviewModal url={preview.url} kind={preview.kind} onClose={() => setPreview(null)} />
      )}
    </>
  );
}

export { STATUS_OPTIONS };
