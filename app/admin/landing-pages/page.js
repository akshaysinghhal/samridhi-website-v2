"use client";
import AdminCrud, { STATUS_OPTIONS } from "../_lib/crud-ui";

export default function LandingPagesAdmin() {
  return (
    <AdminCrud
      title="Landing Pages"
      sub="City + service landing pages for search (e.g. /wedding-planners-udaipur). Fill the SEO fields carefully."
      endpoint="/api/admin/landing-pages"
      listKey="pages"
      slugFrom="title"
      addLabel="Add Landing Page"
      columns={[
        { key: "title", label: "Title" },
        { key: "location", label: "Location" },
        { key: "service_ref", label: "Service" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "slug", label: "URL slug", hint: "Auto-filled from the title." },
        { key: "service_ref", label: "Service reference", placeholder: "e.g. wedding-planning" },
        { key: "location", label: "Location", placeholder: "e.g. Udaipur" },
        { key: "h1", label: "H1 heading" },
        { key: "intro", label: "Intro copy", type: "textarea", rows: 5 },
        { key: "faq", label: "FAQs", type: "faq" },
        { key: "seo_title", label: "SEO title", hint: "Stored in the page's seo block.", get: (r) => r.seo?.title || "" },
        { key: "seo_description", label: "SEO description", type: "textarea", rows: 2, get: (r) => r.seo?.description || "" },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      ]}
      defaults={{ status: "draft", sort: 0, faq: [] }}
      validate={(f) => {
        if (!f.title || !f.title.trim()) return "Title is required.";
        return null;
      }}
      beforeSave={(f) => {
        f.seo = { ...(f.seo || {}), title: f.seo_title || "", description: f.seo_description || "" };
        delete f.seo_title; delete f.seo_description;
        return f;
      }}
      note="Note: the SEO title/description are saved into this page's seo block as {title, description}."
    />
  );
}
