"use client";
import AdminCrud from "../_lib/crud-ui";

export default function NavigationAdmin() {
  return (
    <AdminCrud
      title="Navigation"
      sub="Header and footer menu links. The 'Request a Quote' button in the header is fixed; everything else is editable here."
      endpoint="/api/admin/nav-items"
      listKey="items"
      addLabel="Add Link"
      columns={[
        { key: "label", label: "Label" },
        { key: "href", label: "Link" },
        { key: "location", label: "Menu" },
        { key: "visible", label: "Visible", render: (r) => (r.visible ? "Yes" : "No") },
      ]}
      fields={[
        { key: "label", label: "Label", required: true, placeholder: "e.g. Weddings" },
        { key: "href", label: "Link", required: true, placeholder: "e.g. /weddings" },
        { key: "location", label: "Menu", type: "select", options: [{ value: "header", label: "Header" }, { value: "footer", label: "Footer" }] },
        { key: "visible", label: "Visible", type: "check" },
        { key: "sort", label: "Order", type: "number" },
      ]}
      defaults={{ location: "header", visible: true, sort: 0 }}
      validate={(f) => (!f.label || !f.label.trim() ? "Label is required." : !f.href.trim() ? "Link is required." : null)}
    />
  );
}
