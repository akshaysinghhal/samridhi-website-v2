"use client";
import { useRouter } from "next/navigation";
import { api } from "../../../../../lib/adminApi";
import { toast } from "../../../_lib/ui";
import { ChecklistForm, useChecklistTemplates } from "../../forms";

const BACK = "/admin/billing?tab=checklists";

export default function NewChecklistPage() {
  const router = useRouter();
  const [templates] = useChecklistTemplates();

  const save = async (f) => {
    try {
      await api("/api/admin/checklists", { method: "POST", body: f });
      toast("Checklist created.");
      router.push(BACK);
    } catch (e) { toast("Save failed: " + e.message, "error"); }
  };

  return (
    <>
      <button type="button" className="btn-sm btn-edit" onClick={() => router.push(BACK)} style={{ marginBottom: 14 }}>← Back to checklists</button>
      <ChecklistForm initial={null} templates={templates} onSave={save} onCancel={() => router.push(BACK)} />
    </>
  );
}
