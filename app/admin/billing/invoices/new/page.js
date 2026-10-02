"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../lib/adminApi";
import { toast } from "../../../_lib/ui";
import { DocForm, useCompany, friendlyDbError, withUniqueNo } from "../../forms";

const BACK = "/admin/billing?tab=invoices";

export default function NewInvoicePage() {
  const router = useRouter();
  const company = useCompany();
  const [invoices, setInvoices] = useState([]);
  const [initial, setInitial] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fq = new URLSearchParams(window.location.search).get("fromQuote");
        const ri = await api("/api/admin/invoices");
        setInvoices(ri.invoices || []);
        if (fq) {
          const rq = await api("/api/admin/quotations");
          const q = (rq.quotations || []).find((x) => String(x.id) === String(fq));
          if (q) {
            setInitial({
              quotation_id: q.id, quote_no: q.quote_no,
              client_name: q.client_name, client_phone: q.client_phone, client_email: q.client_email,
              event_title: q.event_title, event_date: q.event_date, venue: q.venue,
              items: (q.items || []).map((it) => ({ ...it })),
              discount: q.discount, gst_percent: q.gst_percent, notes: q.notes,
            });
          }
        }
      } catch (e) { toast("Failed to load: " + e.message, "error"); }
      setReady(true);
    })();
  }, []);

  const save = async (f) => {
    const { body, bumped } = withUniqueNo(invoices, "invoice_no", company.invoicePrefix || "", f);
    if (bumped) toast(`Invoice no. ${bumped.from} already exists — saved as ${bumped.to}.`, "info");
    try {
      await api("/api/admin/invoices", { method: "POST", body });
      if (body.quotation_id) {
        try { await api(`/api/admin/quotations/${body.quotation_id}`, { method: "PUT", body: { status: "converted" } }); } catch { /* ignore */ }
      }
      toast("Invoice saved.");
      router.push(BACK);
    } catch (e) { toast("Save failed: " + friendlyDbError(e.message), "error"); }
  };

  return (
    <>
      <button type="button" className="btn-sm btn-edit" onClick={() => router.push(BACK)} style={{ marginBottom: 14 }}>← Back to invoices</button>
      {ready ? (
        <DocForm kind="invoice" company={company} initial={initial}
          existingNos={invoices.map((x) => x.invoice_no)}
          onSave={save} onCancel={() => router.push(BACK)} />
      ) : <p className="admin-sub">Loading…</p>}
    </>
  );
}
