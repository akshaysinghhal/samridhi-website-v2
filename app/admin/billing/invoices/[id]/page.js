"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../lib/adminApi";
import { toast } from "../../../_lib/ui";
import { DocForm, useCompany, friendlyDbError, withUniqueNo } from "../../forms";

const BACK = "/admin/billing?tab=invoices";

export default function EditInvoicePage({ params }) {
  const router = useRouter();
  const company = useCompany();
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [ready, setReady] = useState(false);
  const id = params?.id;

  useEffect(() => {
    api("/api/admin/invoices")
      .then((r) => {
        const list = r.invoices || [];
        setInvoices(list);
        setInvoice(list.find((x) => String(x.id) === String(id)) || null);
      })
      .catch((e) => toast("Failed to load invoice: " + e.message, "error"))
      .finally(() => setReady(true));
  }, [id]);

  const save = async (f) => {
    const { body, bumped } = withUniqueNo(invoices, "invoice_no", company.invoicePrefix || "", f);
    if (bumped) toast(`Invoice no. ${bumped.from} already exists — saved as ${bumped.to}.`, "info");
    try {
      await api(`/api/admin/invoices/${body.id}`, { method: "PUT", body });
      toast("Invoice updated.");
      router.push(BACK);
    } catch (e) { toast("Save failed: " + friendlyDbError(e.message), "error"); }
  };

  return (
    <>
      <button type="button" className="btn-sm btn-edit" onClick={() => router.push(BACK)} style={{ marginBottom: 14 }}>← Back to invoices</button>
      {!ready ? <p className="admin-sub">Loading…</p> : !invoice ? (
        <p className="admin-sub">Invoice not found — it may have been deleted.</p>
      ) : (
        <DocForm kind="invoice" company={company} initial={invoice}
          existingNos={invoices.map((x) => x.invoice_no)}
          onSave={save} onCancel={() => router.push(BACK)} />
      )}
    </>
  );
}
