// Branded quotation / invoice PDFs for Samridhi Films & Television.
// Client-side, uses jsPDF (loaded dynamically by the caller).
// company = { name, tagline, addressLines[], phone, email, gstin, logoDataUrl }

import { jsPDF } from "jspdf";
import { calcTotals, inr, amountInWords, fmtDate } from "./billing";

const TERRA = [185, 85, 58];
const DEEP = [143, 63, 45];
const GOLD = [201, 161, 90];
const INK = [61, 35, 23];
const GREY = [120, 110, 100];
const MW = 15; // margin

function header(doc, company, kind) {
  // top accent bar
  doc.setFillColor(...TERRA);
  doc.rect(0, 0, 210, 10, "F");
  let y = 20;
  if (company.logoDataUrl) {
    try { doc.addImage(company.logoDataUrl, "PNG", MW, 14, 34, 17); } catch { /* ignore */ }
  }
  doc.setTextColor(...DEEP);
  doc.setFont("times", "bold"); doc.setFontSize(20);
  doc.text(company.name || "Samridhi Films & Television", 54, y + 2);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(company.tagline || "You Just Think & We Will Manage It.", 54, y + 8);
  y += 15;
  doc.setFontSize(8.5); doc.setTextColor(...GREY);
  const info = [
    (company.addressLines || []).filter(Boolean).join(", "),
    [company.phone, company.email].filter(Boolean).join("  •  "),
    company.gstin ? "GSTIN: " + company.gstin : "",
  ].filter(Boolean);
  for (const line of info) { doc.text(line, 54, y); y += 4.5; }
  // kind banner
  y += 4;
  doc.setFillColor(...DEEP);
  doc.rect(MW, y, 180, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(kind, MW + 5, y + 7.5);
  return y + 18;
}

function footer(doc, company) {
  const y = 287;
  doc.setFontSize(8); doc.setTextColor(...GREY); doc.setFont("helvetica", "normal");
  const f = [company.phone, company.email, company.gstin ? "GSTIN: " + company.gstin : ""].filter(Boolean).join("  •  ");
  doc.text(f, 105, y, { align: "center" });
  doc.setDrawColor(...GOLD);
  doc.line(MW, y - 5, 195, y - 5);
}

function parties(doc, y, docData) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...DEEP);
  doc.text("BILL TO", MW, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...INK);
  let by = y + 6;
  doc.setFont("helvetica", "bold");
  doc.text(docData.client_name || "—", MW, by); by += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  if (docData.client_phone) { doc.text("Phone: " + docData.client_phone, MW, by); by += 5; }
  if (docData.client_email) { doc.text("Email: " + docData.client_email, MW, by); by += 5; }

  const rx = 115;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...DEEP);
  doc.text("EVENT", rx, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  let ey = y + 6;
  if (docData.event_title) { doc.setFont("helvetica", "bold"); doc.text(docData.event_title, rx, ey); doc.setFont("helvetica", "normal"); ey += 6; }
  if (docData.event_date) { doc.text("Date: " + fmtDate(docData.event_date), rx, ey); ey += 5; }
  if (docData.venue) { doc.text("Venue: " + docData.venue, rx, ey); ey += 5; }
  return Math.max(by, ey) + 8;
}

function itemsTable(doc, y, items) {
  const cols = [
    { w: 12, label: "#" },
    { w: 96, label: "Description" },
    { w: 20, label: "Qty", align: "right" },
    { w: 28, label: "Rate (Rs.)", align: "right" },
    { w: 24, label: "Amount", align: "right" },
  ];
  const tableW = cols.reduce((a, c) => a + c.w, 0);
  // head
  doc.setFillColor(...TERRA);
  doc.rect(MW, y, tableW, 9, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  let x = MW;
  for (const c of cols) { doc.text(c.label, x + (c.align === "right" ? c.w - 3 : 3), y + 6.2, c.align === "right" ? { align: "right" } : undefined); x += c.w; }
  y += 9;
  doc.setFont("helvetica", "normal"); doc.setTextColor(...INK); doc.setFontSize(9.5);
  (items || []).forEach((it, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    const amt = (+it.qty || 0) * (+it.rate || 0);
    if (i % 2 === 0) { doc.setFillColor(253, 249, 240); doc.rect(MW, y, tableW, 8, "F"); }
    let cx = MW;
    const cells = [
      String(i + 1),
      String(it.desc || ""),
      String(it.qty || ""),
      (+it.rate || 0).toLocaleString("en-IN"),
      amt.toLocaleString("en-IN"),
    ];
    cols.forEach((c, ci) => {
      const txt = ci === 1 ? doc.splitTextToSize(cells[ci], c.w - 6)[0] : cells[ci];
      doc.text(txt, cx + (c.align === "right" ? c.w - 3 : 3), y + 5.8, c.align === "right" ? { align: "right" } : undefined);
      cx += c.w;
    });
    y += 8;
  });
  doc.setDrawColor(...GOLD);
  doc.line(MW, y, MW + tableW, y);
  return y + 6;
}

function totalsBlock(doc, y, t) {
  const rx = 125, vx = 192;
  const row = (label, val, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(...(bold ? DEEP : INK));
    doc.text(label, rx, y);
    doc.text(val, vx, y, { align: "right" });
    y += bold ? 7 : 5.5;
  };
  row("Subtotal", "Rs. " + Math.round(t.sub).toLocaleString("en-IN"));
  if (t.discount > 0) row("Discount", "− Rs. " + Math.round(t.discount).toLocaleString("en-IN"));
  if (t.gstPercent > 0) {
    row(`CGST @ ${(t.gstPercent / 2).toFixed(1)}%`, "Rs. " + Math.round(t.cgst).toLocaleString("en-IN"));
    row(`SGST @ ${(t.gstPercent / 2).toFixed(1)}%`, "Rs. " + Math.round(t.sgst).toLocaleString("en-IN"));
  }
  doc.setDrawColor(...TERRA);
  doc.line(rx, y - 1, vx, y - 1);
  y += 2;
  row("GRAND TOTAL", inr(t.total), true);
  doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...GREY);
  const words = doc.splitTextToSize("Rupees " + amountInWords(t.total) + " Only", 180);
  doc.text(words, MW, y + 2);
  return y + 6 + words.length * 4.5;
}

function notesTerms(doc, y, docData, company) {
  if (docData.notes) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...DEEP);
    doc.text("Notes", MW, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(docData.notes, 180);
    doc.text(lines, MW, y); y += lines.length * 4.5 + 4;
    y += 10;
  }
  // signature
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  doc.text("For " + (company.name || "Samridhi Films & Television"), 195, y, { align: "right" });
  doc.text("Authorised Signatory", 195, y + 22, { align: "right" });
  doc.setDrawColor(...GREY);
  doc.line(150, y + 18, 195, y + 18);
  return y;
}

function metaBlock(doc, y, rows) {
  // rows: [label, value]
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...GREY);
    doc.text(label, MW, y);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...DEEP);
    doc.text(String(value || "—"), MW + 42, y);
    y += 7;
  }
  return y + 4;
}

export async function logoDataUrl() {
  try {
    const r = await fetch("/images/logo.png");
    const b = await r.blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(b);
    });
  } catch { return ""; }
}

export function buildQuotePdf(q, company) {
  const t = calcTotals(q.items, q.discount, q.gst_percent);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, company, "QUOTATION");
  y = metaBlock(doc, y, [
    ["Quote No.", q.quote_no],
    ["Date", fmtDate(q.created_at?.slice(0, 10))],
    ["Valid Till", fmtDate(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10))],
  ]);
  y = parties(doc, y, q);
  y = itemsTable(doc, y, q.items);
  y = totalsBlock(doc, y, t);
  if (y > 235) { doc.addPage(); y = 20; }
  notesTerms(doc, y, q, company);
  footer(doc, company);
  return doc;
}

export function buildInvoicePdf(inv, payments, company) {
  const t = calcTotals(inv.items, inv.discount, inv.gst_percent);
  const paid = (payments || []).reduce((a, p) => a + (+p.amount || 0), 0);
  const bal = Math.max(0, t.total - paid);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, company, company.gstin ? "TAX INVOICE" : "INVOICE");
  y = metaBlock(doc, y, [
    ["Invoice No.", inv.invoice_no],
    ["Date", fmtDate(inv.created_at?.slice(0, 10))],
    ...(inv.quotation_id ? [["Quote Ref.", inv.quote_no || ""]] : []),
  ]);
  y = parties(doc, y, inv);
  y = itemsTable(doc, y, inv.items);
  y = totalsBlock(doc, y, t);
  // payments
  if ((payments || []).length) {
    if (y > 225) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...DEEP);
    doc.text("PAYMENTS RECEIVED", MW, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
    for (const p of payments) {
      doc.text(`${fmtDate(p.paid_on)}   •   ${p.mode || ""}${p.notes ? "   •   " + p.notes : ""}`, MW, y);
      doc.text(inr(p.amount), 192, y, { align: "right" });
      y += 5.5;
    }
    y += 2;
  }
  doc.setFillColor(253, 249, 240);
  doc.rect(MW, y, 180, 12, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.setTextColor(...(bal > 0 ? DEEP : [30, 122, 60]));
  doc.text(bal > 0 ? "BALANCE DUE" : "PAID IN FULL ✓", MW + 4, y + 7.5);
  doc.text(inr(bal), 192, y + 7.5, { align: "right" });
  y += 20;
  if (y > 235) { doc.addPage(); y = 20; }
  notesTerms(doc, y, inv, company);
  footer(doc, company);
  return doc;
}

export function buildReceiptPdf(p, inv, company) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, company, "PAYMENT RECEIPT");
  y = metaBlock(doc, y, [
    ["Receipt No.", p.receipt_no || "—"],
    ["Date", fmtDate(p.paid_on)],
    ["Invoice Ref.", inv.invoice_no],
  ]);
  y = parties(doc, y, inv);
  if (y > 225) { doc.addPage(); y = 20; }
  // payment summary
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...DEEP);
  doc.text("PAYMENT DETAILS", MW, y); y += 7;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...INK);
  doc.text(`Received a sum of ${inr(p.amount)} via ${p.mode || "—"}`, MW, y); y += 7;
  if (p.notes) {
    doc.setFontSize(9); doc.setTextColor(...GREY);
    const nl = doc.splitTextToSize("Note: " + p.notes, 180);
    doc.text(nl, MW, y); y += nl.length * 4.5 + 3;
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...INK);
  const words = doc.splitTextToSize("Rupees " + amountInWords(p.amount) + " Only", 180);
  doc.text(words, MW, y + 2);
  y += 6 + words.length * 4.5 + 10;
  // signature
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  doc.text("For " + (company.name || "Samridhi Films & Television"), 195, y, { align: "right" });
  doc.text("Authorised Signatory", 195, y + 22, { align: "right" });
  doc.setDrawColor(...GREY);
  doc.line(150, y + 18, 195, y + 18);
  footer(doc, company);
  return doc;
}
