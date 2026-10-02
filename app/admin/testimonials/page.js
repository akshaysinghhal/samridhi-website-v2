"use client";
import AdminCrud, { STATUS_OPTIONS, SIZE_HINTS } from "../_lib/crud-ui";

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
        { key: "photo_url", label: "Photo", type: "image", sizeHint: SIZE_HINTS.portrait, hint: "Shown when no video is set — pick one, not both." },
        { key: "_or_media", label: "OR", type: "divider" },
        { key: "video_url", label: "Video testimonial", type: "video", hint: "Upload a video file, paste a URL, or choose from the library — then tap “✨ Describe video with AI” to auto-fill the quote. Shown instead of the photo. Goes public only with permission + Published status.", aiDescribe: { fields: ["quote", "author_name", "company"] } },
        { key: "permission_granted", label: "Permission granted to publish", type: "check", hint: "Required before this can go public." },
        { key: "sort", label: "Display order", type: "number" },
        { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      ]}
      defaults={{ status: "draft", sort: 0, permission_granted: true }}
      aiFillHint="Write rough notes — who said it, about which event, and their words in any language. The AI will polish it into a proper testimonial and fill the name."
      aiInstructions="You are a testimonial copywriter for Samridhi Films & Television, an Indian wedding and event management company. The admin pastes rough notes about what a client said (often in broken English or Hinglish). Rewrite the notes as a polished, natural first-person testimonial quote of 2-4 sentences. Fix grammar and flow, keep every fact, name and event from the notes, and never invent praise, events, names or details that are not in the notes. Use the company name 'Samridhi Films & Television'. Also extract the author's name (the person giving the testimonial) and the company or organisation if one is mentioned."
      aiPlaceholder='e.g. "The groom’s father, Manish Toshwani ji, said Samridhi Films managed everything smoothly at his son Aayush’s wedding to Rashi. He praised Sunil Jain and Rajkumari ji."'
      aiFillFields={[
        { key: "quote", label: "Testimonial quote" },
        { key: "author_name", label: "Author name" },
        { key: "company", label: "Company" },
      ]}
      validate={(f) => {
        if (!f.quote || !f.quote.trim()) return "Quote is required.";
        if (f.status === "published" && !f.permission_granted) return "Permission must be granted before publishing a testimonial.";
        return null;
      }}
    />
  );
}
