"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../lib/adminApi";
import { revalidateSite, STATUS_OPTIONS, SaveButton, AdminLoader, toast } from "../../_lib/ui";

const CATEGORIES = ["Venue Entry", "Stage & Decor", "Events", "Weddings", "Corporate", "Government", "Celebrity Shows", "Cultural", "Behind the Scenes", "Press", "Highlight Videos", "Other"];

export default function GalleryItemEditor() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [origTitle, setOrigTitle] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api(`/api/admin/gallery-items?id=${id}`)
      .then(({ item }) => { setItem(item); setOrigTitle(item.title || ""); })
      .catch(() => setMsg("Could not load this item — it may have been deleted."))
      .finally(() => setBusy(false));
  }, [id]);

  const set = (k, v) => setItem((p) => ({ ...p, [k]: v }));

  // AI looks at the photo and suggests title, caption and category.
  const aiFill = async () => {
    const src = item?.image_url || "";
    if (!src || aiBusy) return;
    setAiBusy(true); setMsg("");
    try {
      const r = await api("/api/admin/ai-image", { method: "POST", body: { imageUrl: src, categories: CATEGORIES } });
      const patch = {};
      if (r.title) patch.title = r.title;
      if (r.caption) patch.caption = r.caption;
      if (r.category) patch.category = r.category;
      if (Object.keys(patch).length) {
        setItem((p) => ({ ...p, ...patch }));
        toast("AI suggested a title & description — review, then Save.");
      } else {
        setMsg("AI could not describe that photo.");
      }
    } catch (e) { setMsg("AI failed: " + (e.message || "try again")); }
    setAiBusy(false);
  };

  const save = async () => {
    if (!item || saving) return;
    setSaving(true); setMsg("");
    try {
      await api("/api/admin/gallery-items", {
        method: "PUT",
        body: { id: item.id, title: item.title, caption: item.caption || "", category: item.category || "Events", status: item.status || "published", is_placeholder: !!item.is_placeholder, sort: item.sort || 0 },
      });
      // Rename the Cloudinary file from the title automatically when the
      // title changed (slugified, capped at 80 characters).
      let extra = "";
      const newTitle = (item.title || "").trim();
      if (item.kind === "photo" && newTitle && newTitle !== (origTitle || "").trim()) {
        try {
          const r = await api("/api/admin/gallery-items/rename", { method: "POST", body: { id: item.id } });
          if (r.renamed) {
            setItem((p) => ({ ...p, image_url: r.image_url }));
            extra = ` File renamed to “${r.file_name}”.`;
          }
        } catch (e) { extra = " (File rename skipped: " + (e.message || "try again") + ")"; }
      }
      setOrigTitle(item.title || "");
      await revalidateSite();
      toast("Saved." + extra);
    } catch (e) { setMsg("Failed: " + e.message); toast("Failed: " + e.message, "error"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm("Delete this item from the gallery?")) return;
    await api(`/api/admin/gallery-items?id=${id}`, { method: "DELETE" });
    await revalidateSite();
    window.location.href = "/admin/gallery";
  };

  if (busy) return <AdminLoader label="Loading…" />;
  if (!item) return <div className="editor"><p>{msg || "Item not found."}</p><Link href="/admin/gallery" className="btn-sm btn-edit">← Back to gallery</Link></div>;

  const mediaUrl = item.kind === "photo" ? item.image_url : (item.video_url || item.image_url);

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <Link href="/admin/gallery" className="btn-sm btn-edit">← Back to gallery</Link>
        <button className="btn-sm btn-del" onClick={remove}>Delete</button>
      </div>

      {msg && <div className="admin-msg" style={{ marginBottom: 12 }}>{msg}</div>}

      {/* Photo at its natural shape — never squashed. */}
      <div style={{ background: "#f5f0e8", borderRadius: 12, overflow: "hidden", marginBottom: 18, textAlign: "center" }}>
        {item.kind === "photo"
          ? <img src={item.image_url} alt={item.title || ""} style={{ maxHeight: 480, width: "auto", maxWidth: "100%", display: "inline-block" }} />
          : (mediaUrl
            ? <video src={mediaUrl} controls preload="metadata" style={{ maxHeight: 480, maxWidth: "100%" }} />
            : <div style={{ padding: 40, color: "var(--text-muted)" }}>No media</div>)}
      </div>

      <div className="editor">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <button type="button" className="btn-sm btn-edit" disabled={aiBusy || !item.image_url} onClick={aiFill}>
            {aiBusy ? "✨ AI is looking…" : "✨ AI title & description"}
          </button>
        </div>
        <div className="field"><label>Title</label>
          <input value={item.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sangeet night highlights" />
          <span className="seo-hint">Saving renames the image file from this title automatically (max 80 characters).</span>
        </div>
        <div className="g-details-row">
          <div className="field"><label>Category</label>
            <select value={item.category || "Events"} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label>Status</label>
            <select value={item.status || "published"} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Description</label>
          <textarea value={item.caption || ""} onChange={(e) => set("caption", e.target.value)} placeholder="Shown under the photo on the website" rows={3} />
          <span className="seo-hint">Shows under the title on the website gallery.</span>
        </div>
        <label className="check-row">
          <input type="checkbox" checked={!!item.is_placeholder} onChange={(e) => set("is_placeholder", e.target.checked)} /> Placeholder
        </label>
        <div className="g-details-actions">
          <SaveButton onClick={save} className="btn-new" disabled={saving}>{saving ? "Saving…" : "Save changes"}</SaveButton>
          <Link href="/admin/gallery" className="btn-sm btn-edit">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
