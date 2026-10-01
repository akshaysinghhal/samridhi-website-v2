// Branded quotation / invoice / receipt PDFs for Samridhi Films & Television.
// Client-side, uses jsPDF (loaded dynamically by the caller).
// company = {
//   name, legalName, tagline, addressLines[], phone, email, gstin, pan,
//   logoDataUrl, signatureDataUrl, showSignature,
//   bank: { bank_name, account_name, account_no, ifsc, upi },
// }

import { jsPDF } from "jspdf";
import { calcTotals, inr, amountInWords, fmtDate } from "./billing";

const TERRA = [185, 85, 58];
const DEEP = [143, 63, 45];
const GOLD = [201, 161, 90];
const INK = [61, 35, 23];
const GREY = [120, 110, 100];
const LIGHT_BG = [253, 249, 240];
const GREEN = [30, 122, 60];
const MW = 15;          // side margin
const PW = 210, PH = 297; // A4
const CW = PW - MW * 2;   // content width

// ---------- low-level helpers ----------

function rule(doc, y, color = GOLD) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.line(MW, y, MW + CW, y);
}

function label(doc, txt, x, y, size = 8.5) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...GREY);
  doc.text(String(txt).toUpperCase(), x, y);
}

function value(doc, txt, x, y, { size = 10, bold = false, color = INK, align } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(txt ?? "—"), x, y, align ? { align } : undefined);
}

// ---------- header ----------

function header(doc, company) {
  doc.setFillColor(...TERRA);
  doc.rect(0, 0, PW, 9, "F");
  let y = 18;

  // logo
  const logoW = 40, logoH = 19;
  if (company.logoDataUrl) {
    try { doc.addImage(company.logoDataUrl, "PNG", MW, y - 4, logoW, logoH); } catch { /* ignore */ }
  }
  const tx = MW + (company.logoDataUrl ? logoW + 7 : 0);
  const tw = PW - MW - tx;

  doc.setFont("times", "bold"); doc.setFontSize(19);
  doc.setTextColor(...DEEP);
  doc.text(company.name || "Samridhi Films & Television", tx, y);
  y += 6.5;
  if (company.legalName && company.legalName !== company.name) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...GREY);
    doc.text(company.legalName, tx, y); y += 4.5;
  }
  doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  const tagLines = doc.splitTextToSize(company.tagline || "You Just Think & We Will Manage It.", tw);
  doc.text(tagLines.slice(0, 2), tx, y);
  y += tagLines.slice(0, 2).length * 4.5 + 1;

  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...GREY);
  for (const line of (company.addressLines || []).filter(Boolean)) {
    doc.text(doc.splitTextToSize(String(line), tw), tx, y);
    y += 4.2;
  }
  const contact = [company.phone, company.email].filter(Boolean).join("   •   ");
  if (contact) { doc.text(contact, tx, y); y += 4.2; }
  const taxIds = [company.gstin ? "GSTIN: " + company.gstin : "", company.pan ? "PAN: " + company.pan : ""].filter(Boolean).join("   •   ");
  if (taxIds) { doc.setTextColor(...DEEP); doc.text(taxIds, tx, y); y += 4.2; }

  y = Math.max(y + 2, 46);
  rule(doc, y);
  return y + 8;
}

// ---------- document title + meta ----------

function titleBlock(doc, y, title, metaRows) {
  // metaRows: [label, value][]
  doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.setTextColor(...DEEP);
  doc.text(title, MW, y);
  const ty = y;
  let my = y - 5;
  const rx = 128, vx = 192;
  for (const [k, v] of metaRows) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GREY);
    doc.text(String(k), rx, my);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...INK);
    doc.text(String(v || "—"), vx, my, { align: "right" });
    my += 6;
  }
  y = Math.max(ty + 6, my + 4);
  rule(doc, y, TERRA);
  return y + 8;
}

// ---------- billed-to / event ----------

function parties(doc, y, d) {
  const colW = 88;
  const cols = [
    { x: MW, label: "Billed to", lines: [
      { t: d.client_name || "—", bold: true, size: 11 },
      ...(d.client_phone ? [{ t: "Phone: " + d.client_phone }] : []),
      ...(d.client_email ? [{ t: "Email: " + d.client_email }] : []),
    ]},
    { x: MW + 92, label: "Event details", lines: [
      ...(d.event_title ? [{ t: d.event_title, bold: true, size: 11 }] : []),
      ...(d.event_date ? [{ t: "Date: " + fmtDate(d.event_date) }] : []),
      ...(d.venue ? [{ t: "Venue: " + d.venue }] : []),
    ]},
  ];
  let maxY = y;
  for (const c of cols) {
    if (!c.lines.length) continue;
    let cy = y;
    label(doc, c.label, c.x, cy); cy += 6;
    for (const ln of c.lines) {
      const wrapped = doc.splitTextToSize(ln.t, colW);
      value(doc, wrapped, c.x, cy, { size: ln.size || 9.5, bold: !!ln.bold });
      cy += wrapped.length * 5;
    }
    maxY = Math.max(maxY, cy);
  }
  return maxY + 6;
}

// ---------- items table (page-break aware, wrapped descriptions) ----------

const COLS = [
  { w: 12, label: "#", align: "right" },
  { w: 92, label: "Description" },
  { w: 18, label: "Qty", align: "right" },
  { w: 30, label: "Rate (₹)", align: "right" },
  { w: 28, label: "Amount (₹)", align: "right" },
];
const TABLE_W = COLS.reduce((a, c) => a + c.w, 0);

function tableHead(doc, y) {
  doc.setFillColor(...DEEP);
  doc.rect(MW, y, TABLE_W, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  let x = MW;
  for (const c of COLS) {
    doc.text(c.label, x + (c.align === "right" ? c.w - 3 : 3), y + 6.2,
      c.align === "right" ? { align: "right" } : undefined);
    x += c.w;
  }
  return y + 9;
}

function rowCells(doc, it, i) {
  const amt = (+it.qty || 0) * (+it.rate || 0);
  const descLines = doc.splitTextToSize(String(it.desc || "—"), COLS[1].w - 6);
  const cells = [
    { lines: [String(i + 1)], align: "right" },
    { lines: descLines },
    { lines: [String(it.qty ?? "")], align: "right" },
    { lines: [(+it.rate || 0).toLocaleString("en-IN")], align: "right" },
    { lines: [amt.toLocaleString("en-IN")], align: "right" },
  ];
  const h = Math.max(1, ...cells.map((c) => c.lines.length)) * 5 + 3.5;
  return { cells, h };
}

function drawRow(doc, y, cells, h, zebra) {
  if (zebra) { doc.setFillColor(...LIGHT_BG); doc.rect(MW, y, TABLE_W, h, "F"); }
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  let x = MW;
  COLS.forEach((c, ci) => {
    const cell = cells[ci];
    const ty = y + 5.2;
    doc.text(cell.lines, x + (c.align === "right" ? c.w - 3 : 3), ty,
      c.align === "right" ? { align: "right" } : undefined);
    x += c.w;
  });
  // column separators
  doc.setDrawColor(230, 222, 208); doc.setLineWidth(0.2);
  let sx = MW;
  for (const c of COLS) { sx += c.w; doc.line(sx, y, sx, y + h); }
  doc.line(MW, y + h, MW + TABLE_W, y + h);
  return y + h;
}

// returns { doc, y } — doc may have new pages; y is on the last page
function itemsTable(doc, y, items) {
  const need = (h) => {
    if (y + h > PH - 30) { doc.addPage(); y = 18; y = tableHead(doc, y); }
    return y;
  };
  y = tableHead(doc, y);
  (items || []).forEach((it, i) => {
    const { cells, h } = rowCells(doc, it, i);
    y = need(h + 2);
    y = drawRow(doc, y, cells, h, i % 2 === 0);
  });
  return y + 2;
}

// ---------- totals ----------

function totalsBlock(doc, y, t) {
  const need = (h) => { if (y + h > PH - 40) { doc.addPage(); y = 18; } return y; };
  y = need(60);
  const rx = 122, vx = MW + TABLE_W;
  const row = (lbl, val, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(...(bold ? DEEP : INK));
    doc.text(lbl, rx, y);
    doc.text(val, vx, y, { align: "right" });
    y += bold ? 7.5 : 5.8;
  };
  row("Subtotal", "₹ " + Math.round(t.sub).toLocaleString("en-IN"));
  if (+t.discount > 0) row("Discount", "− ₹ " + Math.round(t.discount).toLocaleString("en-IN"));
  if (+t.gstPercent > 0) {
    row(`CGST @ ${(t.gstPercent / 2).toFixed(1)}%`, "₹ " + Math.round(t.cgst).toLocaleString("en-IN"));
    row(`SGST @ ${(t.gstPercent / 2).toFixed(1)}%`, "₹ " + Math.round(t.sgst).toLocaleString("en-IN"));
  }
  rule(doc, y, TERRA); y += 6;
  // grand total highlight
  doc.setFillColor(...DEEP);
  doc.rect(rx - 4, y - 5.5, vx - rx + 8, 12, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL", rx, y + 2.5);
  doc.text(inr(t.total), vx, y + 2.5, { align: "right" });
  y += 12;
  doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...GREY);
  const words = doc.splitTextToSize("Rupees " + amountInWords(t.total) + " Only", CW);
  doc.text(words, MW, y + 3);
  return y + 5 + words.length * 4.2;
}

// ---------- payments + balance ----------

function paymentsBlock(doc, y, payments) {
  if (!(payments || []).length) return y;
  if (y > PH - 70) { doc.addPage(); y = 18; }
  label(doc, "Payments received", MW, y, 10);
  doc.setTextColor(...DEEP);
  y += 7;
  const cols = [
    { w: 34, label: "Date" }, { w: 36, label: "Receipt" },
    { w: 40, label: "Mode" }, { w: 70, label: "Amount", align: "right" },
  ];
  const tw = cols.reduce((a, c) => a + c.w, 0);
  doc.setFillColor(...LIGHT_BG);
  doc.rect(MW, y - 4.5, tw, 7.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...GREY);
  let x = MW;
  for (const c of cols) {
    doc.text(c.label.toUpperCase(), x + (c.align === "right" ? c.w - 2 : 2), y + 0.5,
      c.align === "right" ? { align: "right" } : undefined);
    x += c.w;
  }
  y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  for (const p of payments) {
    if (y > PH - 30) { doc.addPage(); y = 18; }
    let px = MW;
    const vals = [
      fmtDate(p.paid_on),
      p.receipt_no || "—",
      [p.mode, p.notes].filter(Boolean).join(" • "),
      inr(p.amount),
    ];
    cols.forEach((c, i) => {
      doc.text(String(vals[i] || "—"), px + (c.align === "right" ? c.w - 2 : 2), y,
        c.align === "right" ? { align: "right" } : undefined);
      px += c.w;
    });
    y += 5.5;
  }
  return y + 4;
}

function balanceBox(doc, y, bal) {
  if (y > PH - 40) { doc.addPage(); y = 18; }
  const paid = bal <= 0.5;
  doc.setFillColor(...(paid ? [232, 245, 233] : LIGHT_BG));
  doc.rect(MW, y - 5.5, CW, 13, "F");
  doc.setDrawColor(...(paid ? GREEN : TERRA));
  doc.setLineWidth(0.5);
  doc.rect(MW, y - 5.5, CW, 13);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.setTextColor(...(paid ? GREEN : DEEP));
  doc.text(paid ? "PAID IN FULL ✓" : "BALANCE DUE", MW + 5, y + 3);
  doc.text(inr(bal), MW + CW - 5, y + 3, { align: "right" });
  return y + 14;
}

// ---------- bank details ----------

function bankBlock(doc, y, bank) {
  const b = bank || {};
  const rows = [
    b.bank_name && ["Bank", b.bank_name],
    b.account_name && ["A/c name", b.account_name],
    b.account_no && ["A/c no.", b.account_no],
    b.ifsc && ["IFSC", b.ifsc],
    b.upi && ["UPI", b.upi],
  ].filter(Boolean);
  if (!rows.length) return y;
  if (y > PH - 55) { doc.addPage(); y = 18; }
  label(doc, "Bank details", MW, y, 10);
  doc.setTextColor(...DEEP);
  y += 7;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  const half = Math.ceil(rows.length / 2);
  for (let i = 0; i < half; i++) {
    const L = rows[i], R = rows[i + half];
    doc.setTextColor(...GREY); doc.setFont("helvetica", "bold");
    doc.text(L[0], MW, y);
    doc.setTextColor(...INK); doc.setFont("helvetica", "normal");
    doc.text(String(L[1]), MW + 24, y);
    if (R) {
      doc.setTextColor(...GREY); doc.setFont("helvetica", "bold");
      doc.text(R[0], MW + 95, y);
      doc.setTextColor(...INK); doc.setFont("helvetica", "normal");
      doc.text(String(R[1]), MW + 119, y);
    }
    y += 5.5;
  }
  return y + 5;
}

// ---------- notes + signature ----------

function notesBlock(doc, y, notes, title = "Notes") {
  if (!notes) return y;
  if (y > PH - 45) { doc.addPage(); y = 18; }
  label(doc, title, MW, y, 10);
  doc.setTextColor(...DEEP);
  y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(String(notes), CW);
  if (y + lines.length * 4.5 > PH - 45) { doc.addPage(); y = 18; }
  doc.text(lines, MW, y);
  return y + lines.length * 4.5 + 6;
}

function signatureBlock(doc, y, company) {
  // The admin can hide the whole signature area from
  // Integrations → Legal & GST → "Show signature on PDFs".
  if (company.showSignature === false) return y;
  if (y > PH - 55) { doc.addPage(); y = 18; }
  const sx = MW + CW; // right aligned
  let sigTop = y;
  // Signature image (already a data URL — transparent PNGs keep transparency).
  if (company.signatureDataUrl) {
    try {
      // draw signature image above the signatory line (max 42w x 20h)
      doc.addImage(company.signatureDataUrl, "PNG", sx - 44, y, 42, 18, undefined, "FAST");
      sigTop = y + 20;
    } catch { /* fall back to blank line */ }
  }
  value(doc, "For " + (company.name || "Samridhi Films & Television"), sx, sigTop, { size: 9.5, align: "right" });
  const lineY = sigTop + 14;
  doc.setDrawColor(...GREY); doc.setLineWidth(0.4);
  doc.line(sx - 55, lineY, sx, lineY);
  value(doc, "Authorised Signatory", sx, lineY + 5.5, { size: 9.5, align: "right" });
  return lineY + 12;
}

// ---------- footer (applied to every page at the end) ----------

function applyFooters(doc, company) {
  const n = doc.getNumberOfPages();
  const contact = [company.phone, company.email,
    company.gstin ? "GSTIN: " + company.gstin : ""].filter(Boolean).join("   •   ");
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const y = PH - 12;
    rule(doc, y - 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GREY);
    doc.text(contact, MW, y);
    doc.text(`Page ${i} of ${n}`, MW + CW, y, { align: "right" });
  }
}

// ---------- builders ----------

export async function logoDataUrl(url) {
  return fetchDataUrl(url || "/images/logo.png");
}

// Fetch any image URL (site-relative or remote, e.g. Cloudinary) and return
// it as a data URL for jsPDF. Original bytes are preserved, so transparent
// PNGs stay transparent. Returns "" on any failure.
export async function fetchDataUrl(url) {
  try {
    if (!url) return "";
    const r = await fetch(url);
    if (!r.ok) return "";
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
  let y = header(doc, company);
  y = titleBlock(doc, y, "QUOTATION", [
    ["Quote no.", q.quote_no],
    ["Date", fmtDate(q.created_at?.slice(0, 10))],
  ]);
  y = parties(doc, y, q);
  y = itemsTable(doc, y, q.items);
  y = totalsBlock(doc, y, t);
  y = bankBlock(doc, y, company.bank);
  y = notesBlock(doc, y, q.notes);
  signatureBlock(doc, y, company);
  applyFooters(doc, company);
  return doc;
}

export function buildInvoicePdf(inv, payments, company) {
  const t = calcTotals(inv.items, inv.discount, inv.gst_percent);
  const paid = (payments || []).reduce((a, p) => a + (+p.amount || 0), 0);
  const bal = Math.max(0, t.total - paid);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, company);
  y = titleBlock(doc, y, company.gstin ? "TAX INVOICE" : "INVOICE", [
    ["Invoice no.", inv.invoice_no],
    ["Date", fmtDate(inv.created_at?.slice(0, 10))],
    ...(inv.quotation_id && inv.quote_no ? [["Quote ref.", inv.quote_no]] : []),
  ]);
  y = parties(doc, y, inv);
  y = itemsTable(doc, y, inv.items);
  y = totalsBlock(doc, y, t);
  y = paymentsBlock(doc, y, payments);
  y = balanceBox(doc, y, bal);
  y = bankBlock(doc, y, company.bank);
  y = notesBlock(doc, y, inv.notes);
  signatureBlock(doc, y, company);
  applyFooters(doc, company);
  return doc;
}

export function buildReceiptPdf(p, inv, company) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = header(doc, company);
  y = titleBlock(doc, y, "PAYMENT RECEIPT", [
    ["Receipt no.", p.receipt_no || "—"],
    ["Date", fmtDate(p.paid_on)],
    ["Invoice ref.", inv.invoice_no],
  ]);
  y = parties(doc, y, inv);

  if (y > PH - 80) { doc.addPage(); y = 18; }
  label(doc, "Payment details", MW, y, 10);
  doc.setTextColor(...DEEP);
  y += 8;
  // amount highlight box
  doc.setFillColor(...LIGHT_BG);
  doc.rect(MW, y - 6, CW, 16, "F");
  doc.setDrawColor(...TERRA); doc.setLineWidth(0.5);
  doc.rect(MW, y - 6, CW, 16);
  value(doc, `Received ${inr(p.amount)} via ${p.mode || "—"}`, MW + 5, y + 4.5, { size: 12, bold: true, color: DEEP });
  y += 16;
  doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor(...GREY);
  const words = doc.splitTextToSize("Rupees " + amountInWords(p.amount) + " Only", CW);
  doc.text(words, MW, y + 3);
  y += 5 + words.length * 4.5;
  if (p.notes) {
    value(doc, "Note: " + p.notes, MW, y + 4, { size: 9.5, color: GREY });
    y += 8;
  }
  y = signatureBlock(doc, y + 10, company);
  applyFooters(doc, company);
  return doc;
}
