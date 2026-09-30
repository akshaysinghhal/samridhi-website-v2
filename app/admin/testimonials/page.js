"use client";
import AdminCrud, { STATUS_OPTIONS } from "../_lib/crud-ui";

export default function TestimonialsAdmin() {
  return (
    <AdminCrud
      title="Testimonials"
      sub="Client testimonials. Items only appear publicly when permission is granted and status is Published."
      endpoint="/api/admin/testimonials"
      listKey="testimonials"
        previewFor={() => `/testimonials`}
      addLabel="Add Testimonial"
      columns={[
        { key: "author_name", label: "Author" },
        { key: "company", label: "Company" },
        { key: "quote", label: "Quote", render: (r) => (r.quote ? (r.quote.length > 60 ? r.quote.slice(0, 60) + "…" : r.quote) : "—") },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { key: "quote", label: "Quote", type: "textarea", rows: 4, required: true },
        { key: "author_name", label: "Author name", required: true },
        { key: "company", label: "Company" },
        { key: "photo_url", label: "Photo", type: "image" },
        { key: "permission_granted", label: "Permission granted to publish", type: "check", hint: "Required before this can go public." },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      ]}
      defaults={{ status: "draft", sort: 0, permission_granted: false }}
      validate={(f) => {
        if (!f.quote || !f.quote.trim()) return "Quote is required.";
        if (f.status === "published" && !f.permission_granted) return "Permission must be granted before publishing a testimonial.";
        return null;
      }}
    />
  );
}
