// Billing helpers — totals, Indian number-to-words, document numbering,
// WhatsApp links. Client-safe (no JSX, no server imports).

export function lineTotal(it) {
  return (+it.qty || 0) * (+it.rate || 0);
}

export function calcTotals(items, discount = 0, gstPercent = 18) {
  const sub = (items || []).reduce((a, it) => a + lineTotal(it), 0);
  const disc = Math.max(0, +discount || 0);
  const afterDisc = Math.max(0, sub - disc);
  const gp = +gstPercent || 0;
  const gst = (afterDisc * gp) / 100;
  const total = afterDisc + gst;
  return { sub, discount: disc, afterDisc, gstPercent: gp, cgst: gst / 2, sgst: gst / 2, total };
}

export function inr(n) {
  const v = Math.round(+n || 0);
  return "Rs. " + v.toLocaleString("en-IN");
}

// Financial year like "26-27" (April–March).
export function finYear(date = new Date()) {
  const y = date.getFullYear(), m = date.getMonth();
  const start = m >= 3 ? y : y - 1;
  return String(start).slice(2) + "-" + String(start + 1).slice(2);
}

// Next running number, e.g. prefix "SF/Q" -> "SF/Q/26-27/004".
export function nextDocNo(prefix, existingNos) {
  const fy = finYear();
  const p = String(prefix || "").trim();
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("^" + (p ? esc + "/" : "") + fy + "/(\\d+)$");
  let max = 0;
  for (const n of existingNos || []) {
    const m = String(n || "").match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const seq = String(max + 1).padStart(3, "0");
  return p ? `${p}/${fy}/${seq}` : `${fy}/${seq}`;
}

// ---- Indian number-to-words (lakh / crore) ----
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigits(n) {
  const h = Math.floor(n / 100), r = n % 100;
  return (h ? ONES[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigits(r) : "");
}
export function amountInWords(num) {
  let n = Math.round(Math.abs(+num || 0));
  if (n === 0) return "Zero";
  const parts = [];
  const cr = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) parts.push(threeDigits(cr) + " Crore");
  if (lakh) parts.push(twoDigits(lakh) + " Lakh");
  if (th) parts.push(twoDigits(th) + " Thousand");
  if (n) parts.push(threeDigits(n));
  return parts.join(" ");
}

// ---- WhatsApp ----
export function normalizePhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 10) d = "91" + d;
  else if (d.length === 11 && d[0] === "0") d = "91" + d.slice(1);
  return d;
}
// phone optional — without it wa.me opens the contact picker.
export function waLink(phone, message) {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message || "")}`;
}

export function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return String(d); }
}

export function quoteWaMessage(q, totals, company) {
  const lines = [
    `Hello ${q.client_name || "there"},`,
    "",
    `Sharing our quotation *${q.quote_no}*${q.event_title ? ` for *${q.event_title}*` : ""}${q.event_date ? ` (${fmtDate(q.event_date)})` : ""}.`,
    "",
    `Total: *${inr(totals.total)}*${totals.gstPercent > 0 ? " (incl. GST)" : ""}`,
    "",
    "I'll share the detailed PDF right after this message.",
    "",
    `— ${company?.name || "Samridhi Films & Television"}`,
  ];
  return lines.join("\n");
}

export function paymentReminderMessage(inv, totals, paid, company) {
  const bal = Math.max(0, totals.total - paid);
  const lines = [
    `Hello ${inv.client_name || "there"},`,
    "",
    `A gentle reminder about invoice *${inv.invoice_no}*${inv.event_title ? ` for *${inv.event_title}*` : ""}${inv.event_date ? ` (${fmtDate(inv.event_date)})` : ""}.`,
    "",
    `Balance due: *${inr(bal)}*`,
    "",
    "Please let us know once the payment is made. Thank you!",
    "",
    `— ${company?.name || "Samridhi Films & Television"}`,
  ];
  return lines.join("\n");
}

export function invoiceWaMessage(inv, totals, paid, company) {  const bal = Math.max(0, totals.total - paid);
  const lines = [
    `Hello ${inv.client_name || "there"},`,
    "",
    `Sharing invoice *${inv.invoice_no}*${inv.event_title ? ` for *${inv.event_title}*` : ""}.`,
    "",
    `Total: *${inr(totals.total)}* · Received: *${inr(paid)}* · Balance: *${inr(bal)}*`,
    "",
    "I'll share the detailed PDF right after this message.",
    "",
    `— ${company?.name || "Samridhi Films & Television"}`,
  ];
  return lines.join("\n");
}

export function receiptWaMessage(p, inv, company) {
  const lines = [
    `Hello ${inv.client_name || "there"},`,
    "",
    `Payment received: *${inr(p.amount)}* via ${p.mode || "—"} on ${fmtDate(p.paid_on)}.`,
    `Receipt no. *${p.receipt_no || "—"}* against invoice *${inv.invoice_no}*${inv.event_title ? ` (${inv.event_title})` : ""}.`,
    "",
    "I'll share the receipt PDF right after this message.",
    "",
    `— ${company?.name || "Samridhi Films & Television"}`,
  ];
  return lines.join("\n");
}
