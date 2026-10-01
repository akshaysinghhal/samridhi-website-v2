"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "../_lib/ui";
import { api } from "../../../lib/adminApi";
import {
  calcTotals, inr, nextDocNo, waLink, quoteWaMessage, invoiceWaMessage,
  paymentReminderMessage, receiptWaMessage, fmtDate,
} from "../../../lib/billing";
import { buildQuotePdf, buildInvoicePdf, buildReceiptPdf, logoDataUrl } from "../../../lib/billingPdf";

const QUOTE_STATUS = ["draft", "sent", "approved", "rejected", "converted"];
const PAY_MODES = ["Cash", "UPI", "Bank transfer", "Cheque", "Card"];

function useCompany() {
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
          quotePrefix: s.quote_prefix || "",
          invoicePrefix: s.invoice_prefix || "",
          receiptPrefix: s.receipt_prefix || "",
          logoDataUrl: await logoDataUrl(),
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
function DocForm({ kind, initial, existingNos, onSave, onCancel, company }) {
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
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

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
      <h3 style={{ marginTop: 0 }}>{initial?.id ? "Edit" : "New"} {kind === "quote" ? "Quotation" : "Invoice"} — {f[noKey]}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div className="field"><label>{kind === "quote" ? "Quote no." : "Invoice no."}</label><input value={f[noKey]} onChange={(e) => set(noKey, e.target.value)} /></div>
        <div className="field"><label>Client name *</label><input value={f.client_name} onChange={(e) => set("client_name", e.target.value)} /></div>
        <div className="field"><label>Client phone</label><input value={f.client_phone} onChange={(e) => set("client_phone", e.target.value)} placeholder="For WhatsApp sharing" /></div>
        <div className="field"><label>Client email</label><input value={f.client_email} onChange={(e) => set("client_email", e.target.value)} /></div>
        <div className="field"><label>Event title</label><input value={f.event_title} onChange={(e) => set("event_title", e.target.value)} placeholder="e.g. Sharma Wedding Sangeet" /></div>
        <div className="field"><label>Event date</label><input type="date" value={f.event_date || ""} onChange={(e) => set("event_date", e.target.value)} /></div>
        <div className="field"><label>Venue</label><input value={f.venue} onChange={(e) => set("venue", e.target.value)} /></div>
      </div>
      <div className="field">
        <label>✨ AI item suggestions — describe the event, AI drafts the line items (you fill in the rates)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={aiDesc} onChange={(e) => setAiDesc(e.target.value)} placeholder="e.g. haldi ceremony for 150 guests at a farmhouse in Chittorgarh" style={{ flex: 1 }} />
          <button type="button" className="btn-sm btn-edit" disabled={aiBusy} onClick={aiDraft}>{aiBusy ? "Thinking…" : "Draft items"}</button>
        </div>
      </div>
      <ItemsEditor items={f.items} setItems={(v) => set("items", v)} />
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
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "💾 Save"}</button>
        <button type="button" className="btn btn-dark" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ---------------- quotations tab ----------------
function QuotesTab({ company, onConvert }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | quote
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try { const r = await api("/api/admin/quotations"); setQuotes(r.quotations || []); }
    catch (e) { toast("Failed to load quotations: " + e.message, "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (f) => {
    try {
      if (f.id) await api(`/api/admin/quotations/${f.id}`, { method: "PUT", body: f });
      else await api("/api/admin/quotations", { method: "POST", body: f });
      toast(f.id ? "Quotation updated." : "Quotation saved.");
      setEditing(null); load();
    } catch (e) { toast("Save failed: " + e.message, "error"); }
  };
  const del = async (id) => {
    if (!confirm("Delete this quotation?")) return;
    try { await api(`/api/admin/quotations/${id}`, { method: "DELETE" }); toast("Quotation deleted."); load(); }
    catch (e) { toast("Delete failed: " + e.message, "error"); }
  };
  const pdf = (quote) => {
    try { buildQuotePdf(quote, company).save(`${quote.quote_no.replace(/\//g, "-")}.pdf`); toast("PDF downloaded."); }
    catch (e) { toast("PDF failed: " + e.message, "error"); }
  };
  const share = (quote) => {
    const t = calcTotals(quote.items, quote.discount, quote.gst_percent);
    window.open(waLink(quote.client_phone, quoteWaMessage(quote, t, company)), "_blank");
  };

  const filtered = quotes.filter((x) =>
    (x.client_name + " " + x.event_title + " " + x.quote_no).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>＋ New quotation</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client / event / number…" style={{ flex: 1, minWidth: 200 }} />
      </div>
      {editing && (
        <DocForm kind="quote" company={company}
          initial={editing === "new" ? null : editing}
          existingNos={quotes.map((x) => x.quote_no)}
          onSave={save} onCancel={() => setEditing(null)} />
      )}
      {loading ? <p className="admin-sub">Loading…</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((x) => {
            const t = calcTotals(x.items, x.discount, x.gst_percent);
            return (
              <div key={x.id} className="editor" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <div>
                    <b>{x.quote_no}</b> · {x.client_name}
                    {x.event_title && <span className="seo-hint"> — {x.event_title}{x.event_date ? ` (${fmtDate(x.event_date)})` : ""}</span>}
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge badge-${x.status === "approved" ? "published" : x.status === "rejected" ? "draft" : "pending"}`}>{x.status}</span>
                      <b style={{ marginLeft: 10, color: "#8F3F2D" }}>{inr(t.total)}</b>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" className="btn-sm btn-edit" onClick={() => pdf(x)}>📄 PDF</button>
                    <button type="button" className="btn-sm btn-edit" onClick={() => share(x)}>💬 WhatsApp</button>
                    {x.status !== "converted" && <button type="button" className="btn-sm btn-edit" onClick={() => onConvert(x)}>→ Invoice</button>}
                    <button type="button" className="btn-sm btn-edit" onClick={() => setEditing(x)}>Edit</button>
                    <button type="button" className="btn-sm btn-del" onClick={() => del(x.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && <p className="admin-sub">No quotations yet. Create your first one above.</p>}
        </div>
      )}
    </div>
  );
}

// ---------------- invoices + payments tab ----------------
function statusFor(total, paid) {
  if (paid <= 0) return "unpaid";
  if (paid >= total - 0.5) return "paid";
  return "partial";
}

function InvoicesTab({ company, convertQuote, clearConvert }) {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [openPay, setOpenPay] = useState(null); // invoice id with payments open
  const [payForm, setPayForm] = useState({ amount: "", mode: "UPI", paid_on: new Date().toISOString().slice(0, 10), notes: "" });
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [ri, rp] = await Promise.all([api("/api/admin/invoices"), api("/api/admin/payments")]);
      setInvoices(ri.invoices || []); setPayments(rp.payments || []);
    } catch (e) { toast("Failed to load invoices: " + e.message, "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (convertQuote) {
      setEditing({
        quotation_id: convertQuote.id, quote_no: convertQuote.quote_no,
        client_name: convertQuote.client_name, client_phone: convertQuote.client_phone, client_email: convertQuote.client_email,
        event_title: convertQuote.event_title, event_date: convertQuote.event_date, venue: convertQuote.venue,
        items: (convertQuote.items || []).map((it) => ({ ...it })),
        discount: convertQuote.discount, gst_percent: convertQuote.gst_percent, notes: convertQuote.notes,
      });
      clearConvert();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [convertQuote]);

  const paidFor = (invId) => payments.filter((p) => p.invoice_id === invId).reduce((a, p) => a + (+p.amount || 0), 0);

  const save = async (f) => {
    try {
      if (f.id) await api(`/api/admin/invoices/${f.id}`, { method: "PUT", body: f });
      else {
        await api("/api/admin/invoices", { method: "POST", body: f });
        if (f.quotation_id) {
          try { await api(`/api/admin/quotations/${f.quotation_id}`, { method: "PUT", body: { status: "converted" } }); } catch { /* ignore */ }
        }
      }
      toast(f.id ? "Invoice updated." : "Invoice saved.");
      setEditing(null); load();
    } catch (e) { toast("Save failed: " + e.message, "error"); }
  };
  const del = async (inv) => {
    if (!confirm(`Delete invoice ${inv.invoice_no}? Its payment records will also be deleted.`)) return;
    try {
      for (const p of payments.filter((x) => x.invoice_id === inv.id))
        await api(`/api/admin/payments/${p.id}`, { method: "DELETE" });
      await api(`/api/admin/invoices/${inv.id}`, { method: "DELETE" });
      toast("Invoice deleted."); load();
    } catch (e) { toast("Delete failed: " + e.message, "error"); }
  };
  const pdf = (inv) => {
    try {
      buildInvoicePdf(inv, payments.filter((p) => p.invoice_id === inv.id), company)
        .save(`${inv.invoice_no.replace(/\//g, "-")}.pdf`);
      toast("PDF downloaded.");
    } catch (e) { toast("PDF failed: " + e.message, "error"); }
  };
  const share = (inv) => {
    const t = calcTotals(inv.items, inv.discount, inv.gst_percent);
    window.open(waLink(inv.client_phone, invoiceWaMessage(inv, t, paidFor(inv.id), company)), "_blank");
  };
  const remind = (inv) => {
    const t = calcTotals(inv.items, inv.discount, inv.gst_percent);
    window.open(waLink(inv.client_phone, paymentReminderMessage(inv, t, paidFor(inv.id), company)), "_blank");
  };
  const addPayment = async (inv) => {
    const amt = +payForm.amount;
    if (!(amt > 0)) { toast("Enter a payment amount.", "error"); return; }
    try {
      const receipt_no = nextDocNo(company.receiptPrefix || "", payments.map((p) => p.receipt_no));
      await api("/api/admin/payments", { method: "POST", body: { invoice_id: inv.id, receipt_no, ...payForm, amount: amt } });
      const t = calcTotals(inv.items, inv.discount, inv.gst_percent);
      const newPaid = paidFor(inv.id) + amt;
      await api(`/api/admin/invoices/${inv.id}`, { method: "PUT", body: { status: statusFor(t.total, newPaid) } });
      toast("Payment recorded.");
      setPayForm({ amount: "", mode: "UPI", paid_on: new Date().toISOString().slice(0, 10), notes: "" });
      load();
    } catch (e) { toast("Failed: " + e.message, "error"); }
  };
  const receiptPdf = (p, inv) => {
    try {
      buildReceiptPdf(p, inv, company)
        .save(`receipt-${(p.receipt_no || p.id).replace(/[^a-z0-9]+/gi, "-")}.pdf`);
      toast("Receipt downloaded.");
    } catch (e) { toast("Receipt failed: " + e.message, "error"); }
  };
  const receiptShare = (p, inv) => {
    window.open(waLink(inv.client_phone, receiptWaMessage(p, inv, company)), "_blank");
  };
  const delPayment = async (p, inv) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await api(`/api/admin/payments/${p.id}`, { method: "DELETE" });
      const t = calcTotals(inv.items, inv.discount, inv.gst_percent);
      await api(`/api/admin/invoices/${inv.id}`, { method: "PUT", body: { status: statusFor(t.total, paidFor(inv.id) - (+p.amount || 0)) } });
      toast("Payment deleted."); load();
    } catch (e) { toast("Failed: " + e.message, "error"); }
  };

  const daysTo = (d) => {
    if (!d) return null;
    return Math.round((new Date(d + "T00:00:00") - new Date(new Date().toDateString())) / 864e5);
  };

  const filtered = invoices.filter((x) =>
    (x.client_name + " " + x.event_title + " " + x.invoice_no).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>＋ New invoice</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client / event / number…" style={{ flex: 1, minWidth: 200 }} />
      </div>
      {editing && (
        <DocForm kind="invoice" company={company}
          initial={editing === "new" ? null : editing}
          existingNos={invoices.map((x) => x.invoice_no)}
          onSave={save} onCancel={() => setEditing(null)} />
      )}
      {loading ? <p className="admin-sub">Loading…</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((x) => {
            const t = calcTotals(x.items, x.discount, x.gst_percent);
            const paid = paidFor(x.id);
            const bal = Math.max(0, t.total - paid);
            const dd = daysTo(x.event_date);
            const showReminder = bal > 0.5 && dd !== null && dd <= 14;
            return (
              <div key={x.id} className="editor" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <div>
                    <b>{x.invoice_no}</b> · {x.client_name}
                    {x.event_title && <span className="seo-hint"> — {x.event_title}{x.event_date ? ` (${fmtDate(x.event_date)})` : ""}</span>}
                    <div style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span className={`badge badge-${x.status === "paid" ? "published" : x.status === "partial" ? "pending" : "draft"}`}>{x.status}</span>
                      <span style={{ fontSize: 13 }}>Total <b>{inr(t.total)}</b></span>
                      <span style={{ fontSize: 13, color: "#1e7a3c" }}>Paid <b>{inr(paid)}</b></span>
                      <span style={{ fontSize: 13, color: bal > 0.5 ? "#8F3F2D" : "#1e7a3c" }}>Balance <b>{inr(bal)}</b></span>
                      {showReminder && <span className="badge badge-pending">⚠ {dd < 0 ? "event passed" : `event in ${dd}d`} · balance due</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" className="btn-sm btn-edit" onClick={() => setOpenPay(openPay === x.id ? null : x.id)}>
                      💰 Payments ({payments.filter((p) => p.invoice_id === x.id).length})
                    </button>
                    <button type="button" className="btn-sm btn-edit" onClick={() => pdf(x)}>📄 PDF</button>
                    <button type="button" className="btn-sm btn-edit" onClick={() => share(x)}>💬 WhatsApp</button>
                    {bal > 0.5 && <button type="button" className="btn-sm btn-edit" onClick={() => remind(x)}>⏰ Remind</button>}
                    <button type="button" className="btn-sm btn-edit" onClick={() => setEditing(x)}>Edit</button>
                    <button type="button" className="btn-sm btn-del" onClick={() => del(x)}>Delete</button>
                  </div>
                </div>
                {openPay === x.id && (
                  <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
                    {payments.filter((p) => p.invoice_id === x.id).map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 14, flexWrap: "wrap", gap: 6 }}>
                        <span>{p.receipt_no ? <><b>{p.receipt_no}</b>{" · "}</> : ""}{fmtDate(p.paid_on)} · {p.mode}{p.notes ? ` · ${p.notes}` : ""}</span>
                        <span>
                          <b>{inr(p.amount)}</b>
                          <button type="button" className="btn-sm btn-edit" style={{ marginLeft: 8 }} onClick={() => receiptPdf(p, x)}>🧾 Receipt</button>
                          <button type="button" className="btn-sm btn-edit" style={{ marginLeft: 4 }} onClick={() => receiptShare(p, x)}>💬</button>
                          <button type="button" className="btn-sm btn-del" style={{ marginLeft: 4 }} onClick={() => delPayment(p, x)}>✕</button>
                        </span>
                      </div>
                    ))}
                    {!payments.filter((p) => p.invoice_id === x.id).length && <p className="admin-sub">No payments recorded yet.</p>}
                    <div style={{ display: "grid", gridTemplateColumns: "110px 130px 150px 1fr auto", gap: 8, marginTop: 10 }} className="pay-grid">
                      <input type="number" min={0} placeholder="Amount Rs." value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                      <select value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
                        {PAY_MODES.map((m) => <option key={m}>{m}</option>)}
                      </select>
                      <input type="date" value={payForm.paid_on} onChange={(e) => setPayForm({ ...payForm, paid_on: e.target.value })} />
                      <input placeholder="Note (optional)" value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
                      <button type="button" className="btn-sm btn-edit" onClick={() => addPayment(x)}>＋ Record</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!filtered.length && <p className="admin-sub">No invoices yet. Create one directly, or convert a quotation with “→ Invoice”.</p>}
        </div>
      )}
    </div>
  );
}

// ---------------- checklists tab ----------------
const CHECKLIST_TEMPLATES = {
  "Wedding": ["Venue booked & advance paid", "Decor theme finalised", "Catering menu + tasting", "Photography / videography team", "Music, DJ & live artists", "Invitations sent", "Guest list & RSVP tracking", "Guest transport & stay", "Makeup & styling trials", "Pandit / rituals confirmed", "Sound, light & LED wall", "Backup power (DG set)", "Security & bouncers", "Hospitality / helpdesk", "Final venue walkthrough"],
  "Corporate event": ["Venue + date locked", "Stage, AV & branding", "Invites sent, RSVP tracked", "Registration desk", "Catering / refreshments", "Emcee / anchor", "Photographer", "Return gifts / mementos", "Feedback forms"],
  "Live show / concert": ["Artist contracts signed", "Venue + police permissions", "Stage, sound & light vendors", "Ticketing / entry gates", "Security & crowd management", "Green rooms", "F&B stalls", "Medical / first aid", "Promotions & announcements", "Artist settlement"],
  "Mela / fair": ["Ground booking + permissions", "Rides / jhula vendors", "Food stall allotments", "Celebrity appearances", "Ticketing & entry gates", "Security plan", "Power & water", "Sanitation", "First aid", "Promotions", "Post-event cleanup"],
};

function ChecklistsTab() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | checklist
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try { const r = await api("/api/admin/checklists"); setLists(r.checklists || []); }
    catch (e) { toast("Failed to load checklists: " + e.message, "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (f) => {
    try {
      if (f.id) await api(`/api/admin/checklists/${f.id}`, { method: "PUT", body: f });
      else await api("/api/admin/checklists", { method: "POST", body: f });
      toast(f.id ? "Checklist updated." : "Checklist created.");
      setEditing(null); load();
    } catch (e) { toast("Save failed: " + e.message, "error"); }
  };
  const del = async (id) => {
    if (!confirm("Delete this checklist?")) return;
    try { await api(`/api/admin/checklists/${id}`, { method: "DELETE" }); toast("Checklist deleted."); load(); }
    catch (e) { toast("Delete failed: " + e.message, "error"); }
  };
  const quickToggle = async (cl, i) => {
    const items = cl.items.map((it, j) => (j === i ? { ...it, done: !it.done } : it));
    try { await api(`/api/admin/checklists/${cl.id}`, { method: "PUT", body: { items } }); load(); }
    catch (e) { toast("Failed: " + e.message, "error"); }
  };

  const filtered = lists.filter((x) =>
    (x.event_title + " " + x.client_name).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>＋ New checklist</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search event…" style={{ flex: 1, minWidth: 200 }} />
      </div>
      {editing && <ChecklistForm initial={editing === "new" ? null : editing} onSave={save} onCancel={() => setEditing(null)} />}
      {loading ? <p className="admin-sub">Loading…</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((cl) => {
            const done = cl.items.filter((i) => i.done).length;
            const pct = cl.items.length ? Math.round((done / cl.items.length) * 100) : 0;
            return (
              <div key={cl.id} className="editor" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <b>{cl.event_title}</b>
                    <span className="seo-hint">{cl.client_name && ` · ${cl.client_name}`}{cl.event_date && ` · ${fmtDate(cl.event_date)}`}</span>
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 160, height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: pct + "%", height: "100%", background: pct === 100 ? "#1e7a3c" : "#B9553A" }} />
                      </div>
                      <span style={{ fontSize: 13 }}>{done}/{cl.items.length} · {pct}%</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn-sm btn-edit" onClick={() => setEditing(cl)}>Open</button>
                    <button type="button" className="btn-sm btn-del" onClick={() => del(cl.id)}>Delete</button>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 4 }}>
                  {cl.items.slice(0, 6).map((it, i) => (
                    <label key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!it.done} onChange={() => quickToggle(cl, i)} />
                      <span style={it.done ? { textDecoration: "line-through", color: "#999" } : undefined}>{it.label}</span>
                    </label>
                  ))}
                  {cl.items.length > 6 && <span className="seo-hint">+ {cl.items.length - 6} more — open to see all</span>}
                </div>
              </div>
            );
          })}
          {!filtered.length && <p className="admin-sub">No checklists yet. Start one from a template above.</p>}
        </div>
      )}
    </div>
  );
}

function ChecklistForm({ initial, onSave, onCancel }) {
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
    if (!tpl) return;
    if (f.items.length && !confirm("Replace current tasks with the template?")) return;
    set("items", CHECKLIST_TEMPLATES[tpl].map((label) => ({ label, done: false })));
    toast("Template applied.");
  };

  const save = async () => {
    if (!f.event_title.trim()) { toast("Event title is required.", "error"); return; }
    setSaving(true);
    try { await onSave(f); } finally { setSaving(false); }
  };

  return (
    <div className="editor" style={{ marginBottom: 22, border: "2px solid #8F3F2D" }}>
      <h3 style={{ marginTop: 0 }}>{f.id ? "Edit" : "New"} event checklist</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
        <div className="field" style={{ margin: 0 }}><label>Event title *</label><input value={f.event_title} onChange={(e) => set("event_title", e.target.value)} /></div>
        <div className="field" style={{ margin: 0 }}><label>Event date</label><input type="date" value={f.event_date || ""} onChange={(e) => set("event_date", e.target.value)} /></div>
        <div className="field" style={{ margin: 0 }}><label>Client</label><input value={f.client_name} onChange={(e) => set("client_name", e.target.value)} /></div>
        <div className="field" style={{ margin: 0 }}><label>Start from template</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={tpl} onChange={(e) => setTpl(e.target.value)} style={{ flex: 1 }}>
              <option value="">Choose…</option>
              {Object.keys(CHECKLIST_TEMPLATES).map((t) => <option key={t}>{t}</option>)}
            </select>
            <button type="button" className="btn-sm btn-edit" onClick={applyTemplate}>Apply</button>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 4, marginBottom: 10 }}>
        {f.items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={!!it.done} onChange={() => set("items", f.items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
            <input value={it.label} onChange={(e) => set("items", f.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} style={{ flex: 1 }} />
            <button type="button" className="btn-sm btn-del" onClick={() => set("items", f.items.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a custom task…" style={{ flex: 1 }}
          onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { set("items", [...f.items, { label: newTask.trim(), done: false }]); setNewTask(""); } }} />
        <button type="button" className="btn-sm btn-edit" onClick={() => { if (newTask.trim()) { set("items", [...f.items, { label: newTask.trim(), done: false }]); setNewTask(""); } }}>＋ Add</button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "💾 Save checklist"}</button>
        <button type="button" className="btn btn-dark" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ---------------- page ----------------
const TABS = [["quotes", "🧾 Quotations"], ["invoices", "💰 Invoices & Payments"], ["checklists", "✅ Event Checklists"]];

export default function BillingAdmin() {
  const company = useCompany();
  const [tab, setTab] = useState("quotes");
  const [convertQuote, setConvertQuote] = useState(null);

  return (
    <>
      <h1>Billing</h1>
      <p className="admin-sub">Quotations, invoices with payment tracking, and per-event checklists. Company details &amp; GSTIN are picked up from <b>Integrations &amp; AI → Legal &amp; GST</b>.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className="ai-chip"
            style={tab === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff", fontSize: 14, padding: "10px 18px" } : { fontSize: 14, padding: "10px 18px" }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "quotes" && <QuotesTab company={company} onConvert={(q) => { setConvertQuote(q); setTab("invoices"); }} />}
      {tab === "invoices" && <InvoicesTab company={company} convertQuote={convertQuote} clearConvert={() => setConvertQuote(null)} />}
      {tab === "checklists" && <ChecklistsTab />}
    </>
  );
}
