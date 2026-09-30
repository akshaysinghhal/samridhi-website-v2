"use client";
import { useState } from "react";
import AdminCrud, { STATUS_OPTIONS } from "../_lib/crud-ui";
import { api, uploadFile } from "../../../lib/adminApi";
import { revalidateSite } from "../_lib/ui";

const PUBS = ["Dainik Bhaskar", "Rajasthan Patrika", "Patrika", "Pratahkal", "Other"];

export default function PressAdmin() {
  const [bulkMsg, setBulkMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const bulkUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setBulkMsg("");
    let n = 0;
    for (const file of files) {
      try {
        const m = await uploadFile(file);
        await api("/api/admin/press-clippings", {
          method: "POST",
          body: { image_url: m.url, type: "single_clipping", headline: file.name.replace(/\.[^.]+$/, ""), status: "published", is_placeholder: false, sort: 0 },
        });
        n++;
      } catch (err) { setBulkMsg("Some uploads failed: " + err.message); break; }
    }
    setUploading(false);
    e.target.value = "";
    if (n) { setBulkMsg(`Uploaded ${n} clipping${n > 1 ? "s" : ""} — list updated below.`); await revalidateSite(); setRefreshTick((t) => t + 1); }
  };

  return (
    <>
      <div className="editor" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Bulk upload clippings</h2>
        <p className="admin-sub" style={{ marginBottom: 12 }}>Select scanned newspaper pages or individual clippings — each becomes a press item. Edit publication and date afterwards.</p>
        <input type="file" accept="image/*" multiple onChange={bulkUpload} disabled={uploading} />
        {uploading && <div className="seo-hint">Uploading…</div>}
        {bulkMsg && <div className="seo-hint">{bulkMsg}</div>}
      </div>
      <AdminCrud
        title="Press Coverage"
        sub="Newspaper and media coverage. Page collages are full scanned pages; single clippings are individual cuttings."
        endpoint="/api/admin/press-clippings"
        listKey="clippings"
          previewFor={() => `/press`}
        externalRefresh={refreshTick}
        addLabel="Add Clipping"
        columns={[
          { key: "image_url", label: "Image", render: (r) => (r.image_url ? <img src={r.image_url} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8 }} /> : "—") },
          { key: "headline", label: "Headline" },
          { key: "publication", label: "Publication" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "is_placeholder", label: "Flag" },
        ]}
        fields={[
          { key: "image_url", label: "Clipping image", type: "image", required: true },
          { key: "type", label: "Type", type: "select", options: [{ value: "single_clipping", label: "Single clipping" }, { value: "page_collage", label: "Page collage (full scanned page)" }] },
          { key: "publication", label: "Publication", type: "select", options: PUBS },
          { key: "city", label: "City" },
          { key: "published_on", label: "Published on", type: "date" },
          { key: "headline", label: "Headline / caption" },
          { key: "sort", label: "Display order", type: "number" },
          { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
          { key: "is_placeholder", label: "Mark as placeholder", type: "check" },
        ]}
        defaults={{ type: "single_clipping", status: "published", sort: 0, is_placeholder: false }}
        validate={(f) => (!f.image_url ? "Please upload a clipping image." : null)}
      />
    </>
  );
}
