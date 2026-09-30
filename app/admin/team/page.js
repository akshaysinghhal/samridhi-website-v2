"use client";
import AdminCrud, { STATUS_OPTIONS } from "../_lib/crud-ui";

export default function TeamAdmin() {
  return (
    <AdminCrud
      title="Team"
      sub="Leadership and team members shown on the About / Team section."
      endpoint="/api/admin/team-members"
      listKey="members"
      addLabel="Add Member"
      columns={[
        { key: "name", label: "Name", render: (r) => (<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{r.photo_url && <img src={r.photo_url} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "50%" }} />}<b>{r.name}</b></span>) },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
        { key: "is_placeholder", label: "Flag" },
      ]}
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "role", label: "Role", placeholder: "e.g. Founder & Managing Director" },
        { key: "bio", label: "Bio", type: "textarea", rows: 5 },
        { key: "photo_url", label: "Photo", type: "image" },
        { key: "instagram", label: "Instagram handle", placeholder: "@username" },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        { key: "is_placeholder", label: "Mark as placeholder", type: "check" },
      ]}
      defaults={{ status: "published", sort: 0, is_placeholder: false }}
      validate={(f) => (!f.name || !f.name.trim() ? "Name is required." : null)}
    />
  );
}
