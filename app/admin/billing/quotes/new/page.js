"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../lib/adminApi";
import { toast } from "../../../_lib/ui";
import { DocForm, useCompany, friendlyDbError, withUniqueNo } from "../../forms";

const BACK = "/admin/billing?tab=quotes";

export default function NewQuotePage() {
  const router = useRouter();
  const company = useCompany();
  const [quotes, setQuotes] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api("/api/admin/quotations")
      .then((r) => setQuotes(r.quotations || []))
      .catch((e) => toast("Failed to load quotations: " + e.message, "error"))
      .finally(() => setReady(true));
  }, []);

  const save = async (f) => {
    const { body, bumped } = withUniqueNo(quotes, "quote_no", company.quotePrefix || "", f);
    if (bumped) toast(`Quote no. ${bumped.from} already exists — saved as ${bumped.to}.`, "info");
    try {
      await api("/api/admin/quotations", { method: "POST", body });
      toast("Quotation saved.");
      router.push(BACK);
    } catch (e) { toast("Save failed: " + friendlyDbError(e.message), "error"); }
  };

  return (
    <>
      <button type="button" className="btn-sm btn-edit" onClick={() => router.push(BACK)} style={{ marginBottom: 14 }}>← Back to quotations</button>
      {ready ? (
        <DocForm kind="quote" company={company} initial={null}
          existingNos={quotes.map((x) => x.quote_no)}
          onSave={save} onCancel={() => router.push(BACK)} />
      ) : <p className="admin-sub">Loading…</p>}
    </>
  );
}
