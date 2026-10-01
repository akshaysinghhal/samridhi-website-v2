"use client";
import AdminCrud, { STATUS_OPTIONS, SIZE_HINTS } from "../_lib/crud-ui";

export default function ServicesAdmin() {
  return (
    <AdminCrud
      title="Services"
      sub="Service pages shown under /services. Items appear as the 'what we deliver' checklist; FAQs get FAQ schema markup."
      endpoint="/api/admin/services"
      listKey="services"
        previewFor={(r) => r.slug ? `/services/${r.slug}` : null}
      slugFrom="title"
      addLabel="Add Service"
      columns={[
        { key: "title", label: "Service" },
        { key: "slug", label: "Slug" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "slug", label: "URL slug", hint: "Auto-filled from the title." },
        { key: "summary", label: "Summary", type: "textarea", rows: 3 },
        { key: "icon", label: "Icon (emoji or text)", placeholder: "e.g. 💒" },
        { key: "hero_image", label: "Hero image", type: "image", sizeHint: SIZE_HINTS.hero },
        { key: "items", label: "What we deliver (checklist)", type: "list", placeholder: "e.g. Stage Setup" },
        { key: "faq", label: "FAQs", type: "faq" },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      ]}
      defaults={{ status: "published", sort: 0, items: [], faq: [] }}
      validate={(f) => (!f.title || !f.title.trim() ? "Title is required." : null)}
    />
  );
}
