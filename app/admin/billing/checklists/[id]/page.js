"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../lib/adminApi";
import { toast } from "../../../_lib/ui";
import { ChecklistForm, useChecklistTemplates } from "../../forms";

const BACK = "/admin/billing?tab=checklists";

export default function EditChecklistPage({ params }) {
  const router = useRouter();
  const [templates] = useChecklistTemplates();
  const [item, setItem] = useState(null);
  const [ready, setReady] = useState(false);
  const id = params?.id;

  useEffect(() => {
    api("/api/admin/checklists")
      .then((r) => setItem((r.checklists || []).find((x) => String(x.id) === String(id)) || null))
      .catch((e) => toast("Failed to load checklist: " + e.message, "error"))
      .finally(() => setReady(true));
  }, [id]);

  const save = async (f) => {
    try {
      await api(`/api/admin/checklists/${f.id}`, { method: "PUT", body: f });
      toast("Checklist updated.");
      router.push(BACK);
    } catch (e) { toast("Save failed: " + e.message, "error"); }
  };

  return (
    <>
      <button type="button" className="btn-sm btn-edit" onClick={() => router.push(BACK)} style={{ marginBottom: 14 }}>← Back to checklists</button>
      {!ready ? <p className="admin-sub">Loading…</p> : !item ? (
        <p className="admin-sub">Checklist not found — it may have been deleted.</p>
      ) : (
        <ChecklistForm initial={item} templates={templates} onSave={save} onCancel={() => router.push(BACK)} />
      )}
    </>
  );
}
