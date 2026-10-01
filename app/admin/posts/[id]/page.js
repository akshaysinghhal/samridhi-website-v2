"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { api, uploadFile } from "../../../../lib/adminApi";
import { openPreview, toast } from "../../_lib/ui";
import { AiFormFill } from "../../_lib/AiFormFill";
import MediaPicker from "../../_lib/MediaPicker";
import PreviewModal from "../../_lib/PreviewModal";
import { AiFieldButton } from "../../_lib/AiAssist";

const empty = {
  title: "", slug: "", excerpt: "", content: "",
  cover_image: "", gallery: [], video_url: "",
  meta_title: "", meta_description: "", keywords: "", og_image: "",
  status: "draft", author: "Samridhi Films & Television",
};

function slugify(t) {
  return (t || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function SeoMeter({ len, good, max, label }) {
  const pct = Math.min(100, (len / max) * 100);
  const color = len >= good[0] && len <= good[1] ? "#2e7d32" : len === 0 ? "#ccc" : "#e65100";
  return (
    <div>
      <div className="seo-hint">{label}: {len} chars {len > 0 && (len < good[0] || len > good[1]) ? `— aim for ${good[0]}–${good[1]}` : len > 0 ? "— looks good ✓" : ""}</div>
      <div className="seo-bar"><i style={{ width: pct + "%", background: color }} /></div>
    </div>
  );
}

export default function PostEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const router = useRouter();
  const [f, setF] = useState(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [picker, setPicker] = useState(null); // { kind, multi, target }
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isNew) api(`/api/admin/posts/${id}`).then(({ post }) => setF({ ...empty, ...post, gallery: post.gallery || [] })).catch(() => {});
  }, [id, isNew]);

  const set = (k) => (e) => {
    const v = e.target.value;
    setF((p) => {
      const n = { ...p, [k]: v };
      if (k === "title" && !slugTouched) n.slug = slugify(v);
      return n;
    });
  };
  // Fill a field directly from the AI helper (set() expects an event).
  const fill = (k) => (t) => set(k)({ target: { value: t } });

  const doUpload = async (file, kind) => {
    setUploading(kind);
    try {
      const m = await uploadFile(file);
      setF((p) => kind === "cover" ? { ...p, cover_image: m.url }
        : kind === "og" ? { ...p, og_image: m.url }
        : { ...p, gallery: [...p.gallery, m.url] });
    } catch (e) { setMsg("Upload failed: " + e.message); }
    setUploading("");
  };

  const save = async (status) => {
    setBusy(true); setMsg("");
    try {
      const payload = { ...f, status };
      if (isNew) {
        const { post } = await api("/api/admin/posts", { method: "POST", body: payload });
        router.push(`/admin/posts/${post.id}`);
      } else {
        await api(`/api/admin/posts/${id}`, { method: "PUT", body: payload });
        setF((p) => ({ ...p, status }));
        setMsg("Saved ✓ — the website will refresh within a minute.");
        toast("Post saved — live on the website now.");
      }
    } catch (e) { setMsg("Save failed: " + e.message); }
    setBusy(false);
  };

  const applyPick = (items) => {
    if (!picker) return;
    const arr = Array.isArray(items) ? items : [items];
    const t = picker.target;
    if (t === "gallery") setF((p) => ({ ...p, gallery: [...p.gallery, ...arr.map((i) => i.url)] }));
    else if (t === "og") setF((p) => ({ ...p, og_image: arr[0] ? arr[0].url : "" }));
    else setF((p) => ({ ...p, cover_image: arr[0] ? arr[0].url : "" }));
  };
  const ogPreview = f.og_image || f.cover_image;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1>{isNew ? "New Post" : "Edit Post"}</h1><p className="admin-sub">Fields marked * are required.</p></div>
        <Link className="btn-sm btn-edit" href="/admin/posts">← Back</Link>
      </div>
      {msg && <div className="login-err" style={{ background: "#e8f5e9", color: "#2e7d32" }}>{msg}</div>}

      <div className="editor" style={{ marginBottom: 20 }}>
        <AiFormFill
          title="Describe the post — AI fills the fields"
          hint="Describe the topic in a line or two — AI drafts the title, excerpt and body."
          fields={[
            { key: "title", label: "Blog title" },
            { key: "excerpt", label: "Excerpt (one or two lines)" },
            { key: "content", label: "Body (Markdown allowed)" },
            { key: "keywords", label: "Keywords (comma separated)" },
            { key: "meta_description", label: "Meta description" },
          ]}
          context="Samridhi Films & Television, an event and wedding planning company in Chittorgarh, Rajasthan."
          onFill={(values) => setF((p) => ({ ...p, ...values }))}
        />
        <h2 style={{ marginTop: 0 }}>Content</h2>
        <div className="field"><div className="ai-field-row"><label>Title *</label><AiFieldButton onInsert={fill("title")} label="Write blog title with AI" seedPrompt="Write a catchy blog post title for an event company blog" /></div><input value={f.title} onChange={set("title")} placeholder="e.g. A Royal Wedding in Udaipur" /></div>
        <div className="field"><label>URL slug *</label><input value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug")(e); }} placeholder="a-royal-wedding-in-udaipur" />
          <div className="seo-hint">Your post will live at /blog/{f.slug || "your-slug"}</div></div>
        <div className="field"><div className="ai-field-row"><label>Excerpt</label><AiFieldButton onInsert={fill("excerpt")} label="Write excerpt with AI" seedPrompt={`Write a one-line blog excerpt for "${f.title || "this post"}"`} /></div><textarea rows={2} value={f.excerpt} onChange={set("excerpt")} placeholder="One or two lines shown on the blog listing page." /></div>
        <div className="field"><div className="ai-field-row"><label>Body (Markdown supported)</label><AiFieldButton onInsert={fill("content")} label="Write blog body with AI" seedPrompt={`Write a full blog post in Markdown for "${f.title || "this post"}" — headings, short paragraphs, practical tips`} /></div>
          <div className="md-split">
            <textarea value={f.content} onChange={set("content")} placeholder={"# Heading\n\nWrite your story here…\n\n- bullet points\n- **bold** and *italic* work too"} />
            <div className="md-preview"><ReactMarkdown>{f.content || "*Live preview appears here…*"}</ReactMarkdown></div>
          </div>
        </div>
      </div>

      <div className="editor" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Photos &amp; Video</h2>
        <div className="field"><label>Cover image</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && doUpload(e.target.files[0], "cover")} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => setPicker({ kind: "image", target: "cover" })}>📚 Choose from library</button>
          </div>
          {uploading === "cover" && <div className="seo-hint">Uploading…</div>}
          <div className="seo-hint">📐 Suggested: 1600 × 900 px (16:9)</div>
          {f.cover_image && <div className="img-preview"><div className="img-thumb"><img src={f.cover_image} alt="cover" onClick={() => setPreview({ url: f.cover_image, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" /><button onClick={() => setF((p) => ({ ...p, cover_image: "" }))}>×</button></div></div>}
        </div>
        <div className="field"><label>Photo gallery</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept="image/*" multiple onChange={(e) => { for (const file of e.target.files) doUpload(file, "gallery"); }} style={{ flex: "1 1 200px" }} />
            <button type="button" className="btn-sm btn-edit" onClick={() => setPicker({ kind: "image", target: "gallery", multi: true })}>📚 Choose from library</button>
          </div>
          {uploading === "gallery" && <div className="seo-hint">Uploading…</div>}
          <div className="img-preview">{f.gallery.map((g) => (
            <span className="img-thumb" key={g}><img src={g} alt="" onClick={() => setPreview({ url: g, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" /><button onClick={() => setF((p) => ({ ...p, gallery: p.gallery.filter((x) => x !== g) }))}>×</button></span>
          ))}</div>
        </div>
        <div className="field"><label>Video URL (YouTube link)</label><input value={f.video_url} onChange={set("video_url")} placeholder="https://www.youtube.com/watch?v=…" /></div>
      </div>

      <div className="editor" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>SEO</h2>
        <div className="field"><label>Meta title</label><input value={f.meta_title} onChange={set("meta_title")} placeholder={f.title || "Shown in Google results & browser tabs"} />
          <SeoMeter len={f.meta_title.length} good={[40, 60]} max={70} label="Meta title" /></div>
        <div className="field"><label>Meta description</label><textarea rows={2} value={f.meta_description} onChange={set("meta_description")} placeholder="The snippet shown under your title in Google." />
          <SeoMeter len={f.meta_description.length} good={[120, 160]} max={170} label="Meta description" /></div>
        <div className="field"><label>Keywords (comma separated)</label><input value={f.keywords} onChange={set("keywords")} placeholder="wedding planner udaipur, sangeet choreography, …" /></div>
        <div className="field"><label>Social share image (OG)</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && doUpload(e.target.files[0], "og")} />
          <div className="seo-hint">Leave empty to reuse the cover image. Shown when the post is shared on WhatsApp / Facebook.</div>
          {f.og_image && <div className="img-preview"><div className="img-thumb"><img src={f.og_image} alt="og" onClick={() => setPreview({ url: f.og_image, kind: "image" })} style={{ cursor: "zoom-in" }} title="Click to preview" /><button onClick={() => setF((p) => ({ ...p, og_image: "" }))}>×</button></div></div>}
        </div>
        <div style={{ background: "#f7f4f8", borderRadius: 12, padding: 18, marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "#5f6b6d", marginBottom: 4 }}>Google preview</div>
          <div style={{ color: "#1a0dab", fontSize: 18, fontWeight: 500 }}>{f.meta_title || f.title || "Your post title"}</div>
          <div style={{ color: "#006621", fontSize: 13 }}>{typeof window !== "undefined" ? window.location.host : ""} › blog › {f.slug || "your-slug"}</div>
          <div style={{ color: "#545454", fontSize: 13.5 }}>{f.meta_description || f.excerpt || "Your meta description will appear here."}</div>
          {ogPreview && <img src={ogPreview} alt="" style={{ width: 220, borderRadius: 8, marginTop: 10 }} />}
        </div>
      </div>

      <div className="editor">
        <h2 style={{ marginTop: 0 }}>Publish</h2>
        <div className="form-row">
          <div className="field"><label>Status</label>
            <select value={f.status} onChange={set("status")}><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div className="field"><label>Author</label><input value={f.author} onChange={set("author")} /></div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-dark" disabled={busy} onClick={() => save("draft")}>{busy ? "Saving…" : "Save as Draft"}</button>
          <button className="btn btn-primary" disabled={busy} onClick={() => save("published")}>{busy ? "Saving…" : "🚀 Publish"}</button>
          {!isNew && f.slug && (
            <button
              className="btn btn-outline-dark"
              style={{ border: "2px solid var(--brand)", color: "var(--brand-dark)", background: "#fff" }}
              onClick={() => openPreview(f.slug, setMsg)}
            >
              👁 Preview
            </button>
          )}
        </div>
        {isNew && <div className="seo-hint" style={{ marginTop: 10 }}>Save the post first — preview becomes available after the first save.</div>}
      </div>
      {picker && <MediaPicker open={!!picker} kind={picker.kind} multi={!!picker.multi} onClose={() => setPicker(null)} onSelect={applyPick} />}
      {preview && <PreviewModal url={preview.url} kind={preview.kind} onClose={() => setPreview(null)} />}
    </>
  );
}
