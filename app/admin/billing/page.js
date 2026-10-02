"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "../_lib/ui";
import { api } from "../../../lib/adminApi";
import {
  calcTotals, inr, nextDocNo, waLink, quoteWaMessage, invoiceWaMessage,
  paymentReminderMessage, receiptWaMessage, fmtDate,
} from "../../../lib/billing";
import { buildQuotePdf, buildInvoicePdf, buildReceiptPdf, logoDataUrl, fetchDataUrl } from "../../../lib/billingPdf";
import { useCompany, QUOTE_STATUS, TemplateEditor, useChecklistTemplates } from "./forms";

const PAY_MODES = ["Cash", "UPI", "Bank transfer", "Cheque", "Card"];

// ---------------- quotations tab ----------------
function QuotesTab({ company, onConvert }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");

  const load = async () => {
    setLoading(true);
    try { const r = await api("/api/admin/quotations"); setQuotes(r.quotations || []); }
    catch (e) { toast("Failed to load quotations: " + e.message, "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

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
    (statusF === "all" || x.status === statusF) &&
    (x.client_name + " " + x.event_title + " " + x.quote_no).toLowerCase().includes(q.toLowerCase()));

  const totals = quotes.reduce((a, x) => a + calcTotals(x.items, x.discount, x.gst_percent).total, 0);
  const countBy = (s) => quotes.filter((x) => x.status === s).length;

  return (
    <div>
      <div className="bill-summary">
        <div className="bill-stat"><div className="k">Quotations</div><div className="v">{quotes.length}</div></div>
        <div className="bill-stat"><div className="k">Total quoted</div><div className="v">{inr(totals)}</div></div>
        <div className="bill-stat"><div className="k">Approved</div><div className="v good">{countBy("approved")}</div></div>
        <div className="bill-stat"><div className="k">Awaiting reply</div><div className="v warn">{countBy("sent") + countBy("draft")}</div></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => router.push("/admin/billing/quotes/new")}>＋ New quotation</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client / event / number…" style={{ flex: 1, minWidth: 200 }} />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by status" style={{ maxWidth: 170 }}>
          <option value="all">All statuses</option>
          {QUOTE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <p className="admin-sub">Loading…</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((x) => {
            const t = calcTotals(x.items, x.discount, x.gst_percent);
            return (
              <div key={x.id} className="bill-card">
                <div className="bill-card-top">
                  <div>
                    <div className="bill-title">
                      {x.quote_no}
                      <span className={`badge badge-${x.status === "approved" ? "published" : x.status === "rejected" ? "draft" : "pending"}`}>{x.status}</span>
                    </div>
                    <div className="bill-sub">{x.client_name}{x.event_title ? ` · ${x.event_title}` : ""}{x.event_date ? ` · ${fmtDate(x.event_date)}` : ""}</div>
                    <div className="bill-amounts">
                      <span>Total <b>{inr(t.total)}</b></span>
                      <span>{(x.items || []).length} item{(x.items || []).length === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                  <div className="bill-actions">
                    <button type="button" className="btn-sm btn-edit" onClick={() => pdf(x)}>📄 PDF</button>
                    <button type="button" className="btn-sm btn-edit" onClick={() => share(x)}>💬 WhatsApp</button>
                    {x.status !== "converted" && <button type="button" className="btn-sm btn-edit" onClick={() => onConvert(x)}>→ Invoice</button>}
                    <button type="button" className="btn-sm btn-edit" onClick={() => router.push(`/admin/billing/quotes/${x.id}`)}>Edit</button>
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

function InvoicesTab({ company }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPay, setOpenPay] = useState(null); // invoice id with payments open
  const [payForm, setPayForm] = useState({ amount: "", mode: "UPI", paid_on: new Date().toISOString().slice(0, 10), notes: "" });
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [ri, rp] = await Promise.all([api("/api/admin/invoices"), api("/api/admin/payments")]);
      setInvoices(ri.invoices || []); setPayments(rp.payments || []);
    } catch (e) { toast("Failed to load invoices: " + e.message, "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const paidFor = (invId) => payments.filter((p) => p.invoice_id === invId).reduce((a, p) => a + (+p.amount || 0), 0);

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
    (statusF === "all" || x.status === statusF) &&
    (x.client_name + " " + x.event_title + " " + x.invoice_no).toLowerCase().includes(q.toLowerCase()));

  const sumTotals = invoices.reduce((a, x) => a + calcTotals(x.items, x.discount, x.gst_percent).total, 0);
  const sumPaid = payments.reduce((a, p) => a + (+p.amount || 0), 0);
  const sumDue = Math.max(0, sumTotals - sumPaid);
  const countBy = (s) => invoices.filter((x) => x.status === s).length;

  return (
    <div>
      <div className="bill-summary">
        <div className="bill-stat"><div className="k">Invoiced</div><div className="v">{inr(sumTotals)}</div></div>
        <div className="bill-stat"><div className="k">Collected</div><div className="v good">{inr(sumPaid)}</div></div>
        <div className="bill-stat"><div className="k">Outstanding</div><div className={`v${sumDue > 0.5 ? " warn" : " good"}`}>{inr(sumDue)}</div></div>
        <div className="bill-stat"><div className="k">Paid invoices</div><div className="v good">{countBy("paid")}</div></div>
        <div className="bill-stat"><div className="k">Pending</div><div className="v warn">{countBy("unpaid") + countBy("partial")}</div></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => router.push("/admin/billing/invoices/new")}>＋ New invoice</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client / event / number…" style={{ flex: 1, minWidth: 200 }} />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by status" style={{ maxWidth: 170 }}>
          <option value="all">All statuses</option>
          {["unpaid", "partial", "paid", "overdue", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <p className="admin-sub">Loading…</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((x) => {
            const t = calcTotals(x.items, x.discount, x.gst_percent);
            const paid = paidFor(x.id);
            const bal = Math.max(0, t.total - paid);
            const dd = daysTo(x.event_date);
            const showReminder = bal > 0.5 && dd !== null && dd <= 14;
            const payCount = payments.filter((p) => p.invoice_id === x.id).length;
            return (
              <div key={x.id} className="bill-card">
                <div className="bill-card-top">
                  <div>
                    <div className="bill-title">
                      {x.invoice_no}
                      <span className={`badge badge-${x.status === "paid" ? "published" : x.status === "partial" ? "pending" : "draft"}`}>{x.status}</span>
                      {showReminder && <span className="badge badge-pending">⚠ {dd < 0 ? "event passed" : `event in ${dd}d`} · balance due</span>}
                    </div>
                    <div className="bill-sub">{x.client_name}{x.event_title ? ` · ${x.event_title}` : ""}{x.event_date ? ` · ${fmtDate(x.event_date)}` : ""}</div>
                    <div className="bill-amounts">
                      <span>Total <b>{inr(t.total)}</b></span>
                      <span className="good">Paid <b>{inr(paid)}</b></span>
                      <span className={bal > 0.5 ? "warn" : "good"}>Balance <b>{inr(bal)}</b></span>
                    </div>
                  </div>
                  <div className="bill-actions">
                    <button type="button" className="btn-sm btn-edit" onClick={() => setOpenPay(openPay === x.id ? null : x.id)}>
                      💰 Payments ({payCount})
                    </button>
                    <button type="button" className="btn-sm btn-edit" onClick={() => pdf(x)}>📄 PDF</button>
                    <button type="button" className="btn-sm btn-edit" onClick={() => share(x)}>💬 WhatsApp</button>
                    {bal > 0.5 && <button type="button" className="btn-sm btn-edit" onClick={() => remind(x)}>⏰ Remind</button>}
                    <button type="button" className="btn-sm btn-edit" onClick={() => router.push(`/admin/billing/invoices/${x.id}`)}>Edit</button>
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
function ChecklistsTab() {
  const router = useRouter();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all"); // all | active | complete
  const [expanded, setExpanded] = useState(null); // checklist id with all tasks shown
  const [tplEditor, setTplEditor] = useState(false);
  const [templates, setCustomTpls] = useChecklistTemplates();
  const togglingRef = useRef({}); // checklist id -> in-flight toggle chain
  const listsRef = useRef([]); // always-current checklists (refs update synchronously, state doesn't)

  const load = async () => {
    setLoading(true);
    try { const r = await api("/api/admin/checklists"); listsRef.current = r.checklists || []; setLists(listsRef.current); }
    catch (e) { toast("Failed to load checklists: " + e.message, "error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm("Delete this checklist?")) return;
    try { await api(`/api/admin/checklists/${id}`, { method: "DELETE" }); toast("Checklist deleted."); load(); }
    catch (e) { toast("Delete failed: " + e.message, "error"); }
  };
  const quickToggle = (cl, i) => {
    // Optimistic toggle: the checkbox flips instantly and the save happens
    // quietly in the background — no full-page reload. Rapid taps on the same
    // checklist are chained so they can't overwrite each other. nextItems is
    // computed from listsRef (synchronous) — NOT inside the setLists updater,
    // which React runs later during re-render.
    const run = async () => {
      const cur = listsRef.current.find((x) => x.id === cl.id) || cl;
      const nextItems = (cur.items || []).map((it, j) => (j === i ? { ...it, done: !it.done } : it));
      const next = listsRef.current.map((x) => (x.id === cl.id ? { ...x, items: nextItems } : x));
      listsRef.current = next;
      setLists(next);
      try {
        await api(`/api/admin/checklists/${cl.id}`, { method: "PUT", body: { items: nextItems } });
      } catch (e) {
        toast("Failed: " + e.message, "error");
        load(); // reload to restore the true state
      }
    };
    const prev = togglingRef.current[cl.id] || Promise.resolve();
    togglingRef.current[cl.id] = prev.then(run, run);
  };

  const pctOf = (cl) => {
    const done = (cl.items || []).filter((i) => i.done).length;
    return { done, total: (cl.items || []).length, pct: cl.items?.length ? Math.round((done / cl.items.length) * 100) : 0 };
  };

  const filtered = lists.filter((x) => {
    const { pct } = pctOf(x);
    if (statusF === "complete" && pct !== 100) return false;
    if (statusF === "active" && pct === 100) return false;
    return (x.event_title + " " + x.client_name).toLowerCase().includes(q.toLowerCase());
  });

  const totTasks = lists.reduce((a, x) => a + (x.items || []).length, 0);
  const doneTasks = lists.reduce((a, x) => a + (x.items || []).filter((i) => i.done).length, 0);
  const completeLists = lists.filter((x) => pctOf(x).pct === 100).length;

  return (
    <div>
      <div className="bill-summary">
        <div className="bill-stat"><div className="k">Checklists</div><div className="v">{lists.length}</div></div>
        <div className="bill-stat"><div className="k">Tasks done</div><div className="v good">{doneTasks}<span style={{ fontSize: 14, color: "#8a6a5c" }}> / {totTasks}</span></div></div>
        <div className="bill-stat"><div className="k">Completed events</div><div className="v good">{completeLists}</div></div>
        <div className="bill-stat"><div className="k">In progress</div><div className="v warn">{lists.length - completeLists}</div></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => router.push("/admin/billing/checklists/new")}>＋ New checklist</button>
        <button type="button" className="btn btn-dark" onClick={() => setTplEditor((x) => !x)}>✏️ {tplEditor ? "Close templates" : "Edit templates"}</button>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search event / client…" style={{ flex: 1, minWidth: 200 }} />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by progress" style={{ maxWidth: 170 }}>
          <option value="all">All</option>
          <option value="active">In progress</option>
          <option value="complete">Complete</option>
        </select>
      </div>
      {tplEditor && <TemplateEditor templates={templates} onSaved={(t) => setCustomTpls(t || {})} />}
      {loading ? <p className="admin-sub">Loading…</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((cl) => {
            const { done, total, pct } = pctOf(cl);
            const showAll = expanded === cl.id;
            const visible = showAll ? cl.items : (cl.items || []).slice(0, 6);
            return (
              <div key={cl.id} className="bill-card">
                <div className="bill-card-top">
                  <div style={{ flex: "1 1 260px" }}>
                    <div className="bill-title">
                      {cl.event_title}
                      {pct === 100
                        ? <span className="badge badge-published">✓ complete</span>
                        : <span className="badge badge-pending">in progress</span>}
                    </div>
                    <div className="bill-sub">{cl.client_name}{cl.event_date ? ` · ${fmtDate(cl.event_date)}` : ""}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                      <div className={`check-progress${pct === 100 ? " done" : ""}`}><div style={{ width: pct + "%" }} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#1e7a3c" : "#8F3F2D", whiteSpace: "nowrap" }}>{done}/{total} · {pct}%</span>
                    </div>
                  </div>
                  <div className="bill-actions">
                    <button type="button" className="btn-sm btn-edit" onClick={() => router.push(`/admin/billing/checklists/${cl.id}`)}>Open</button>
                    <button type="button" className="btn-sm btn-del" onClick={() => del(cl.id)}>Delete</button>
                  </div>
                </div>
                <div className="check-tasks">
                  {visible.map((it, i) => (
                    <label key={i} className="check-task">
                      <input type="checkbox" checked={!!it.done} onChange={() => quickToggle(cl, i)} />
                      <span style={it.done ? { textDecoration: "line-through", color: "#999" } : undefined}>{it.label}</span>
                    </label>
                  ))}
                </div>
                {total > 6 && (
                  <button type="button" className="btn-sm btn-edit" style={{ marginTop: 8 }}
                    onClick={() => setExpanded(showAll ? null : cl.id)}>
                    {showAll ? "Show less" : `Show all ${total} tasks`}
                  </button>
                )}
              </div>
            );
          })}
          {!filtered.length && <p className="admin-sub">No checklists yet. Start one from a template above.</p>}
        </div>
      )}
    </div>
  );
}

// ---------------- page ----------------
const TABS = [["quotes", "🧾 Quotations"], ["invoices", "💰 Invoices & Payments"], ["checklists", "✅ Event Checklists"]];

export default function BillingAdmin() {
  const router = useRouter();
  const company = useCompany();
  // When returning from a form page (?tab=invoices etc.), land on that tab.
  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "quotes";
    const t = new URLSearchParams(window.location.search).get("tab");
    return TABS.some(([id]) => id === t) ? t : "quotes";
  });

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
      {tab === "quotes" && <QuotesTab company={company} onConvert={(q) => router.push(`/admin/billing/invoices/new?fromQuote=${q.id}`)} />}
      {tab === "invoices" && <InvoicesTab company={company} />}
      {tab === "checklists" && <ChecklistsTab />}
    </>
  );
}
