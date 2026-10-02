"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../lib/adminApi";
import { toast } from "../../../_lib/ui";
import { DocForm, useCompany, friendlyDbError, withUniqueNo } from "../../forms";

const BACK = "/admin/billing?tab=quotes";

export default function EditQuotePage({ params }) {
  const router = useRouter();
  const company = useCompany();
  const [quotes, setQuotes] = useState([]);
  const [quote, setQuote] = useState(null);
  const [ready, setReady] = useState(false);
  const id = params?.id;

  useEffect(() => {
    api("/api/admin/quotations")
      .then((r) => {
        const list = r.quotations || [];
        setQuotes(list);
        setQuote(list.find((x) => String(x.id) === String(id)) || null);
      })
      .catch((e) => toast("Failed to load quotation: " + e.message, "error"))
      .finally(() => setReady(true));
  }, [id]);

  const save = async (f) => {
    const { body, bumped } = withUniqueNo(quotes, "quote_no", company.quotePrefix || "", f);
    if (bumped) toast(`Quote no. ${bumped.from} already exists — saved as ${bumped.to}.`, "info");
    try {
      await api(`/api/admin/quotations/${body.id}`, { method: "PUT", body });
      toast("Quotation updated.");
      router.push(BACK);
    } catch (e) { toast("Save failed: " + friendlyDbError(e.message), "error"); }
  };

  return (
    <>
      <button type="button" className="btn-sm btn-edit" onClick={() => router.push(BACK)} style={{ marginBottom: 14 }}>← Back to quotations</button>
      {!ready ? <p className="admin-sub">Loading…</p> : !quote ? (
        <p className="admin-sub">Quotation not found — it may have been deleted.</p>
      ) : (
        <DocForm kind="quote" company={company} initial={quote}
          existingNos={quotes.map((x) => x.quote_no)}
          onSave={save} onCancel={() => router.push(BACK)} />
      )}
    </>
  );
}
