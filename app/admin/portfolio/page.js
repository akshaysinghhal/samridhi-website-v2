"use client";
import AdminCrud, { STATUS_OPTIONS, SIZE_HINTS } from "../_lib/crud-ui";

const CATS = ["Government", "Corporate", "Weddings", "Destination Weddings", "Celebrity Shows", "Cultural Programs", "Brand Promotions", "International"];

export default function PortfolioAdmin() {
  return (
    <AdminCrud
      title="Portfolio / Events"
      sub="Event portfolio entries. Verify details against the event poster before publishing."
      endpoint="/api/admin/events"
      listKey="events"
        previewFor={(r) => r.slug ? `/portfolio/${r.slug}` : null}
      slugFrom="title"
      addLabel="Add Event"
      columns={[
        { key: "title", label: "Event" },
        { key: "category", label: "Category" },
        { key: "client", label: "Client" },
        { key: "status", label: "Status" },
        { key: "is_placeholder", label: "Flag" },
      ]}
      fields={[
        { key: "title", label: "Event name", required: true },
        { key: "slug", label: "URL slug", hint: "Auto-filled from the name." },
        { key: "client", label: "Client" },
        { key: "location", label: "Location" },
        { key: "event_date", label: "Event date", type: "date" },
        { key: "category", label: "Category", type: "select", options: CATS },
        { key: "services", label: "Services provided", type: "list", placeholder: "e.g. Stage Production" },
        { key: "description", label: "Description", type: "textarea", rows: 5 },
        { key: "cover_image", label: "Cover photo", type: "image", sizeHint: SIZE_HINTS.cover },
        { key: "gallery", label: "Photo gallery", type: "images" },
        { key: "video_url", label: "Video URL (YouTube / mp4)" },
        { key: "featured", label: "Featured on homepage", type: "check" },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        { key: "is_placeholder", label: "Mark as placeholder", type: "check", hint: "Shows an amber PLACEHOLDER badge until replaced." },
      ]}
      defaults={{ category: "Corporate", status: "draft", sort: 0, featured: false, is_placeholder: false, services: [], gallery: [] }}
      validate={(f) => (!f.title || !f.title.trim() ? "Event name is required." : null)}
    />
  );
}
