"use client";
import AdminCrud, { STATUS_OPTIONS, SIZE_HINTS } from "../_lib/crud-ui";

export default function InternationalAdmin() {
  return (
    <AdminCrud
      title="International Shows"
      sub="Shows and events abroad — these power the interactive world map."
      endpoint="/api/admin/international-shows"
      listKey="shows"
      slugFrom="title"
        previewFor={(row) => (row.slug || row.id ? `/international-shows/${row.slug || row.id}` : `/international-shows`)}
      revalidatePaths={(saved) => [
        "/international-shows",
        ...(saved && (saved.slug || saved.id) ? [`/international-shows/${saved.slug || saved.id}`] : []),
      ]}
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
        { key: "slug", label: "URL slug", hint: "Auto-created from the title — e.g. /international-shows/china-diwali-festival-2024. Edit only if you need a custom URL." },
        { key: "country", label: "Country", required: true },
        { key: "city", label: "City" },
        { key: "show_date", label: "Show date", type: "date" },
        { key: "summary", label: "Summary", type: "textarea", rows: 4 },
        { key: "cover_image", label: "Cover image", type: "image", sizeHint: SIZE_HINTS.cover },
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
