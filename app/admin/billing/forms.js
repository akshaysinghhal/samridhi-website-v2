"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "../_lib/ui";
import { api } from "../../../lib/adminApi";
import { calcTotals, inr, nextDocNo } from "../../../lib/billing";
import { logoDataUrl, fetchDataUrl } from "../../../lib/billingPdf";

export const QUOTE_STATUS = ["draft", "sent", "approved", "rejected", "converted"];

export function friendlyDbError(msg) {
  const m = String(msg || "");
  if (/duplicate key value violates unique constraint/i.test(m)) {
    if (m.includes("invoice_no")) return "That invoice number is already used — please use a different number.";
    if (m.includes("quote_no")) return "That quotation number is already used — please use a different number.";
    if (m.includes("receipt_no")) return "That receipt number is already used — please use a different number.";
    return "That number is already used — please use a different one.";
  }
  return m;
}

export function useCompany() {
  const [company, setCompany] = useState({ name: "Samridhi Films & Television" });
  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/admin/site-settings");
        const s = r.settings || {};
        const legal = s.legal_entity || {};
        let addressLines = [];
        if (legal.address) addressLines = [legal.address, legal.state].filter(Boolean);
        else {
          try {
            const addrs = JSON.parse(s.addresses || "[]");
            if (addrs[0]) addressLines = [addrs[0].address].filter(Boolean);
          } catch { /* ignore */ }
        }
        setCompany({
          name: legal.trade_name || s.company_name || "Samridhi Films & Television",
          tagline: s.tagline1 || "You Just Think & We Will Manage It.",
          addressLines,
          phone: legal.phone || s.phone1 || "+91 96022 28846",
          email: legal.email || s.email || "samridhifilms@yahoo.co.in",
          gstin: legal.gstin || "",
          pan: legal.pan || "",
          legalName: legal.legal_name || "",
          bank: legal.bank || {},
          showSignature: legal.show_signature !== false,
          signatureDataUrl: legal.show_signature !== false && legal.signature_url
            ? await fetchDataUrl(legal.signature_url)
            : "",
          quotePrefix: s.quote_prefix || "",
          invoicePrefix: s.invoice_prefix || "",
          receiptPrefix: s.receipt_prefix || "",
          logoDataUrl: await logoDataUrl(String(s.logo_url || "").trim() || "/images/logo.png"),
        });
      } catch { /* keep defaults */ }
    })();
  }, []);
  return company;
}


// ---------------- line-items editor ----------------
function ItemsEditor({ items, setItems }) {
  const set = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const add = () => setItems([...items, { desc: "", qty: 1, rate: 0 }]);
  const del = (i) => setItems(items.filter((_, j) => j !== i));
  return (
    <div className="editor" style={{ margin: "0 0 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <b>Line items</b>
        <button type="button" className="btn-sm btn-edit" onClick={add}>＋ Add item</button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="bill-items-row" style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 40px", gap: 8, marginBottom: 8 }}>
          <input value={it.desc} onChange={(e) => set(i, "desc", e.target.value)} placeholder="Description (e.g. Stage & decor setup)" />
          <input type="number" min={0} value={it.qty} onChange={(e) => set(i, "qty", e.target.value)} placeholder="Qty" title="Quantity" />
          <input type="number" min={0} value={it.rate} onChange={(e) => set(i, "rate", e.target.value)} placeholder="Rate (Rs.)" title="Rate" />
          <button type="button" className="btn-sm btn-del" onClick={() => del(i)} title="Remove">✕</button>
        </div>
      ))}
      {!items.length && <p className="admin-sub">No items yet — add the services included in this quote.</p>}
    </div>
  );
}

function TotalsPreview({ items, discount, gstPercent }) {
  const t = calcTotals(items, discount, gstPercent);
  return (
    <div className="editor" style={{ margin: "0 0 14px", background: "#FDF9F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>Subtotal</span><b>{inr(t.sub)}</b></div>
      {t.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>Discount</span><b>− {inr(t.discount)}</b></div>}
      {t.gstPercent > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>CGST @ {(t.gstPercent / 2).toFixed(1)}%</span><b>{inr(t.cgst)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>SGST @ {(t.gstPercent / 2).toFixed(1)}%</span><b>{inr(t.sgst)}</b></div>
        </>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, marginTop: 6, color: "#8F3F2D" }}><span><b>Total</b></span><b>{inr(t.total)}</b></div>
    </div>
  );
}

const EMPTY_DOC = {
  client_name: "", client_phone: "", client_email: "",
  event_title: "", event_date: "", venue: "",
  items: [], discount: 0, gst_percent: 0, notes: "",
};


// ---------------- quote / invoice form ----------------
export function DocForm({ kind, initial, existingNos, onSave, onCancel, company }) {
  const noKey = kind === "quote" ? "quote_no" : "invoice_no";
  const prefix = kind === "quote" ? (company.quotePrefix || "") : (company.invoicePrefix || "");
  const [f, setF] = useState(() => ({
    ...EMPTY_DOC,
    ...(initial || {}),
    items: (initial?.items || []).map((it) => ({ ...it })),
    ...{ [noKey]: initial?.[noKey] || nextDocNo(prefix, existingNos), status: initial?.status || (kind === "quote" ? "draft" : "unpaid") },
  }));
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDesc, setAiDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [numTouched, setNumTouched] = useState(false); // user edited the doc number manually
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  // If the form opened before the list finished loading, the suggested number
  // may already be taken — refresh it until the user types their own.
  const nosKey = (existingNos || []).join("|");
  useEffect(() => {
    if (!initial?.id && !numTouched) set(noKey, nextDocNo(prefix, existingNos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nosKey]);

  const aiDraft = async () => {
    if (!aiDesc.trim()) { toast("Describe the event first — e.g. 'sangeet night for 300 guests in Udaipur'.", "info"); return; }
    setAiBusy(true);
    try {
      const r = await api("/api/admin/ai", {
        method: "POST",
        body: {
          lang: "en",
          prompt: `You are helping an event company in Rajasthan draft a quotation's line items. The event: ${aiDesc.trim()}. Return ONLY a JSON array like [{"desc":"...","qty":1}] — item descriptions and quantities only, NO prices, NO rates, NO commentary, NO markdown fences. 5-10 practical items an event planner would quote for this.`,
        },
      });
      const raw = String(r.text || "").replace(/```json|```/g, "").trim();
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        setF((x) => ({ ...x, items: [...x.items, ...arr.map((a) => ({ desc: String(a.desc || "").slice(0, 120), qty: +a.qty || 1, rate: 0 }))] }));
        toast("AI suggested item descriptions — fill in your rates.");
      } else toast("AI returned nothing usable.", "info");
    } catch (e) { toast("AI draft failed: " + e.message, "error"); }
    setAiBusy(false);
  };

  const save = async () => {
    if (!f.client_name.trim()) { toast("Client name is required.", "error"); return; }
    if (!f.items.length || !f.items.some((it) => it.desc.trim())) { toast("Add at least one line item.", "error"); return; }
    setSaving(true);
    try { await onSave(f); }
    finally { setSaving(false); }
  };

  return (
    <div className="editor" style={{ marginBottom: 22, border: "2px solid #8F3F2D" }}>
      <h3 style={{ marginTop: 0 }}>{initial?.id ? "Edit" : "New"} {kind === "quote" ? "Quotation" : "Invoice"}</h3>

      <div className="bill-form-sec">
        <h4>Document</h4>
        <div className="field" style={{ margin: 0, maxWidth: 320 }}>
          <label>{kind === "quote" ? "Quote no." : "Invoice no."}</label>
          <input value={f[noKey]} onChange={(e) => { set(noKey, e.target.value); setNumTouched(true); }} />
        </div>
      </div>

      <div className="bill-form-sec">
        <h4>Client</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div className="field" style={{ margin: 0 }}><label>Client name *</label><input value={f.client_name} onChange={(e) => set("client_name", e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Client phone</label><input value={f.client_phone} onChange={(e) => set("client_phone", e.target.value)} placeholder="For WhatsApp sharing" /></div>
          <div className="field" style={{ margin: 0 }}><label>Client email</label><input value={f.client_email} onChange={(e) => set("client_email", e.target.value)} /></div>
        </div>
      </div>

      <div className="bill-form-sec">
        <h4>Event</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div className="field" style={{ margin: 0 }}><label>Event title</label><input value={f.event_title} onChange={(e) => set("event_title", e.target.value)} placeholder="e.g. Sharma Wedding Sangeet" /></div>
          <div className="field" style={{ margin: 0 }}><label>Event date</label><input type="date" value={f.event_date || ""} onChange={(e) => set("event_date", e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Venue</label><input value={f.venue} onChange={(e) => set("venue", e.target.value)} /></div>
        </div>
      </div>

      <div className="bill-form-sec">
        <h4>Line items</h4>
        <div className="field">
          <label>✨ AI item suggestions — describe the event, AI drafts the line items (you fill in the rates)</label>
          <div className="bill-ai-row">
            <input value={aiDesc} onChange={(e) => setAiDesc(e.target.value)} placeholder="e.g. haldi ceremony for 150 guests at a farmhouse in Chittorgarh" style={{ flex: 1 }} />
            <button type="button" className="btn-sm btn-edit" disabled={aiBusy} onClick={aiDraft}>{aiBusy ? "Thinking…" : "Draft items"}</button>
          </div>
        </div>
        <ItemsEditor items={f.items} setItems={(v) => set("items", v)} />
      </div>

      <div className="bill-form-sec">
        <h4>Totals &amp; terms</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ margin: 0 }}><label>Discount (Rs.)</label><input type="number" min={0} value={f.discount} onChange={(e) => set("discount", e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>GST %</label><input type="number" min={0} max={28} step={0.5} value={f.gst_percent} onChange={(e) => set("gst_percent", e.target.value)} placeholder="0 = no GST" /></div>
          <div className="field" style={{ margin: 0 }}><label>Status</label>
            <select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {(kind === "quote" ? QUOTE_STATUS : ["unpaid", "partial", "paid", "overdue", "cancelled"]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Notes</label><textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Payment terms, inclusions, anything the client should know" /></div>
        <TotalsPreview items={f.items} discount={f.discount} gstPercent={f.gst_percent} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "💾 Save"}</button>
        <button type="button" className="btn btn-dark" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}


export const CHECKLIST_TEMPLATES = {
  "Wedding": ["Venue booked & advance paid", "Decor theme finalised", "Catering menu + tasting", "Photography / videography team", "Music, DJ & live artists", "Invitations sent", "Guest list & RSVP tracking", "Guest transport & stay", "Makeup & styling trials", "Pandit / rituals confirmed", "Sound, light & LED wall", "Backup power (DG set)", "Security & bouncers", "Hospitality / helpdesk", "Final venue walkthrough"],
  "Corporate event": ["Venue + date locked", "Stage, AV & branding", "Invites sent, RSVP tracked", "Registration desk", "Catering / refreshments", "Emcee / anchor", "Photographer", "Return gifts / mementos", "Feedback forms"],
  "Live show / concert": ["Artist contracts signed", "Venue + police permissions", "Stage, sound & light vendors", "Ticketing / entry gates", "Security & crowd management", "Green rooms", "F&B stalls", "Medical / first aid", "Promotions & announcements", "Artist settlement"],
  "Mela / fair": ["Ground booking + permissions", "Rides / jhula vendors", "Food stall allotments", "Celebrity appearances", "Ticketing & entry gates", "Security plan", "Power & water", "Sanitation", "First aid", "Promotions", "Post-event cleanup"],
};

// Editor for the checklist templates above — stored in site_settings under
// "checklist_templates" (no migration needed). Editing a template only affects

export function TemplateEditor({ templates, onSaved }) {
  const toRows = (t) => Object.entries(t || {}).map(([name, tasks]) => ({ name, tasks: (tasks || []).join("\n") }));
  const [rows, setRows] = useState(() => toRows(templates));
  const [busy, setBusy] = useState(false);
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const collect = () => {
    const obj = {};
    for (const r of rows) {
      const name = r.name.trim();
      if (!name) continue;
      if (obj[name]) { toast(`Duplicate template name: ${name}`, "error"); return null; }
      obj[name] = r.tasks.split("\n").map((t) => t.trim()).filter(Boolean);
    }
    if (!Object.keys(obj).length) { toast("Add at least one template.", "error"); return null; }
    return obj;
  };

  const save = async () => {
    const obj = collect();
    if (!obj) return;
    setBusy(true);
    try {
      await api("/api/admin/site-settings", { method: "PUT", body: { key: "checklist_templates", value: obj } });
      onSaved(obj);
      toast("Templates saved — new checklists will use them.");
    } catch (e) { toast("Save failed: " + e.message, "error"); }
    setBusy(false);
  };

  const resetAll = async () => {
    if (!confirm("Reset all checklist templates to the defaults? Your customizations will be lost.")) return;
    setBusy(true);
    try {
      await api("/api/admin/site-settings", { method: "PUT", body: { key: "checklist_templates", value: null } });
      onSaved({});
      setRows(toRows(CHECKLIST_TEMPLATES));
      toast("Templates reset to defaults.");
    } catch (e) { toast("Reset failed: " + e.message, "error"); }
    setBusy(false);
  };

  return (
    <div className="editor" style={{ marginBottom: 22, border: "2px solid #8F3F2D" }}>
      <h3 style={{ marginTop: 0 }}>Edit checklist templates</h3>
      <p className="admin-sub" style={{ marginTop: -6 }}>One task per line. Changes apply to checklists you create afterwards — existing checklists are untouched.</p>
      {rows.map((r, i) => (
        <div key={i} className="bill-form-sec">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Template name" style={{ flex: 1, fontWeight: 700, minWidth: 0 }} aria-label="Template name" />
            <button type="button" className="btn-sm btn-del" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>Delete</button>
          </div>
          <textarea value={r.tasks} onChange={(e) => setRow(i, { tasks: e.target.value })} rows={5}
            style={{ width: "100%", boxSizing: "border-box", fontSize: 16 }} aria-label={`Tasks for ${r.name || "template"}`} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn-sm btn-edit" onClick={() => setRows((rs) => [...rs, { name: "", tasks: "" }])}>＋ New template</button>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn btn-dark" disabled={busy} onClick={resetAll}>Reset to defaults</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "💾 Save templates"}</button>
      </div>
    </div>
  );
}


export function ChecklistForm({ initial, onSave, onCancel, templates }) {
  const T = templates || CHECKLIST_TEMPLATES;
  const [f, setF] = useState(() => ({
    event_title: initial?.event_title || "", event_date: initial?.event_date || "", client_name: initial?.client_name || "",
    items: (initial?.items || []).map((it) => ({ label: it.label, done: !!it.done })),
    id: initial?.id,
  }));
  const [tpl, setTpl] = useState("");
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const applyTemplate = () => {
    if (!tpl || !T[tpl]) return;
    if (f.items.length && !confirm("Replace current tasks with the template?")) return;
    set("items", T[tpl].map((label) => ({ label, done: false })));
    toast("Template applied.");
  };

  const save = async () => {
    if (!f.event_title.trim()) { toast("Event title is required.", "error"); return; }
    setSaving(true);
    try { await onSave(f); } finally { setSaving(false); }
  };

  const doneCount = f.items.filter((it) => it.done).length;

  return (
    <div className="editor" style={{ marginBottom: 22, border: "2px solid #8F3F2D" }}>
      <h3 style={{ marginTop: 0 }}>{f.id ? "Edit" : "New"} event checklist</h3>

      <div className="bill-form-sec">
        <h4>Event</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div className="field" style={{ margin: 0 }}><label>Event title *</label><input value={f.event_title} onChange={(e) => set("event_title", e.target.value)} placeholder="e.g. Sharma Wedding — Udaipur" /></div>
          <div className="field" style={{ margin: 0 }}><label>Event date</label><input type="date" value={f.event_date || ""} onChange={(e) => set("event_date", e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Client</label><input value={f.client_name} onChange={(e) => set("client_name", e.target.value)} /></div>
        </div>
      </div>

      <div className="bill-form-sec">
        <h4>Start from a template</h4>
        <div className="field" style={{ margin: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={tpl} onChange={(e) => setTpl(e.target.value)} style={{ flex: 1 }}>
              <option value="">Choose a template…</option>
              {Object.keys(T).map((t) => <option key={t} value={t}>{t} ({T[t].length} tasks)</option>)}
            </select>
            <button type="button" className="btn-sm btn-edit" onClick={applyTemplate}>Apply</button>
          </div>
          <span className="seo-hint">Replaces the current task list — confirm when asked.</span>
        </div>
      </div>

      <div className="bill-form-sec">
        <h4>Tasks · {doneCount} of {f.items.length} done</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div className={`check-progress${f.items.length && doneCount === f.items.length ? " done" : ""}`}>
            <div style={{ width: (f.items.length ? Math.round((doneCount / f.items.length) * 100) : 0) + "%" }} />
          </div>
          <button type="button" className="btn-sm btn-edit"
            onClick={() => {
              const allDone = f.items.length && doneCount === f.items.length;
              set("items", f.items.map((it) => ({ ...it, done: !allDone })));
            }}>
            {f.items.length && doneCount === f.items.length ? "Uncheck all" : "Check all"}
          </button>
        </div>
        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          {f.items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={!!it.done} style={{ width: 18, height: 18, accentColor: "#8F3F2D", flex: "0 0 auto" }}
                onChange={() => set("items", f.items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
              <input value={it.label} onChange={(e) => set("items", f.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} style={{ flex: 1 }} />
              <button type="button" className="btn-sm btn-del" onClick={() => set("items", f.items.filter((_, j) => j !== i))} aria-label="Remove task">✕</button>
            </div>
          ))}
          {!f.items.length && <p className="admin-sub" style={{ margin: 0 }}>No tasks yet — apply a template or add your own below.</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a custom task… (Enter to add)" style={{ flex: 1 }}
            onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { set("items", [...f.items, { label: newTask.trim(), done: false }]); setNewTask(""); } }} />
          <button type="button" className="btn-sm btn-edit" onClick={() => { if (newTask.trim()) { set("items", [...f.items, { label: newTask.trim(), done: false }]); setNewTask(""); } }}>＋ Add</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "💾 Save checklist"}</button>
        <button type="button" className="btn btn-dark" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}


// Loads checklist templates: built-in defaults overlaid with the admin's
// customizations from site_settings ("checklist_templates", no migration).
export function useChecklistTemplates() {
  const [custom, setCustom] = useState(null); // null = still loading
  useEffect(() => {
    api("/api/admin/site-settings").then((r) => {
      const v = r.settings?.checklist_templates;
      setCustom(v && typeof v === "object" ? v : {});
    }).catch(() => setCustom({}));
  }, []);
  const templates = useMemo(() => ({ ...CHECKLIST_TEMPLATES, ...(custom || {}) }), [custom]);
  return [templates, setCustom];
}

// Ensures a quote/invoice number is unique before saving: returns the doc to
// save, bumping to the next free number when the entered one is taken.
export function withUniqueNo(list, noKey, prefix, f) {
  const no = String(f[noKey] || "").trim();
  const clash = (list || []).some((x) => x.id !== f.id && String(x[noKey]).trim() === no);
  if (!clash) return { body: f, bumped: null };
  const free = nextDocNo(prefix, (list || []).map((x) => x[noKey]));
  return { body: { ...f, [noKey]: free }, bumped: { from: no, to: free } };
}
