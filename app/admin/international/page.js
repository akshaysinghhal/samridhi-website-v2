"use client";
import AdminCrud, { STATUS_OPTIONS } from "../_lib/crud-ui";

export default function InternationalAdmin() {
  return (
    <AdminCrud
      title="International Shows"
      sub="Shows and events abroad — these power the interactive world map."
      endpoint="/api/admin/international-shows"
      listKey="shows"
        previewFor={() => `/international-shows`}
      addLabel="Add Show"
      columns={[
        { key: "title", label: "Show" },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        { key: "show_date", label: "Date" },
        { key: "status", label: "Status" },
        { key: "is_placeholder", label: "Flag" },
      ]}
      fields={[
        { key: "title", label: "Show title", required: true },
        { key: "country", label: "Country", required: true },
        { key: "city", label: "City" },
        { key: "show_date", label: "Show date", type: "date" },
        { key: "summary", label: "Summary", type: "textarea", rows: 4 },
        { key: "cover_image", label: "Cover image", type: "image" },
        { key: "gallery", label: "Gallery", type: "images" },
        { key: "video_url", label: "Video URL" },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        { key: "is_placeholder", label: "Mark as placeholder", type: "check" },
      ]}
      defaults={{ status: "published", sort: 0, is_placeholder: false, gallery: [] }}
      validate={(f) => (!f.title || !f.title.trim() ? "Title is required." : !f.country.trim() ? "Country is required." : null)}
    />
  );
}
