"use client";
import AdminCrud from "../_lib/crud-ui";
import { SIZE_HINTS } from "../_lib/crud-ui";

export default function ClientsAdmin() {
  return (
    <AdminCrud
      title="Clients"
      sub="Key clients shown on the logo wall. Only clients with 'permission to display' appear on the website."
      endpoint="/api/admin/clients"
      listKey="clients"
        previewFor={() => `/clients`}
      addLabel="Add Client"
      columns={[
        { key: "name", label: "Client", render: (r) => (<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{r.logo_url && <img src={r.logo_url} alt="" style={{ height: 30, width: "auto" }} />}<b>{r.name}</b></span>) },
        { key: "sector", label: "Sector" },
        { key: "permission_to_display", label: "Permission", render: (r) => (r.permission_to_display ? "✅ Yes" : "❌ No") },
        { key: "is_placeholder", label: "Flag" },
      ]}
      fields={[
        { key: "name", label: "Client name", required: true },
        { key: "logo_url", label: "Logo", type: "image", hint: "Until the real logo is uploaded, the name renders as an elegant text wordmark.", sizeHint: SIZE_HINTS.logo },
        { key: "sector", label: "Sector", placeholder: "e.g. Cement" },
        { key: "permission_to_display", label: "Permission to display granted", type: "check", hint: "Only checked clients appear publicly." },
        { key: "is_placeholder", label: "Logo is a placeholder", type: "check" },
        { key: "sort", label: "Display order", type: "number" },
      ]}
      defaults={{ permission_to_display: false, is_placeholder: true, sort: 0 }}
      validate={(f) => (!f.name || !f.name.trim() ? "Client name is required." : null)}
    />
  );
}
