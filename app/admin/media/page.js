"use client";
import { useEffect, useState } from "react";
import { api, uploadFile } from "../../../lib/adminApi";
import { revalidateSite, useBulk, BulkBar, CheckCell } from "../_lib/ui";

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");

  const load = async (silent) => {
    if (!silent) setBusy(true);
    try { setMedia((await api("/api/admin/media")).media); } catch { /* ignore */ }
    if (!silent) setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const bulk = useBulk({
    rows: media,
    patchRows: setMedia,
    endpoint: "/api/admin/media",
    deleteOne: (id) => api(`/api/admin/media?id=${id}`, { method: "DELETE" }),
  });

  const onFiles = async (e) => {
    setUploading(true);
    for (const file of e.target.files) {
      try { await uploadFile(file); } catch { /* ignore */ }
    }
    setUploading(false);
    e.target.value = "";
    await revalidateSite(); load(true);
  };

  const copy = async (url) => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  };

  const remove = async (id) => {
    if (!confirm("Delete this file from Cloudinary and the library?")) return;
    await api(`/api/admin/media?id=${id}`, { method: "DELETE" });
    await revalidateSite();
    setMedia((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1>Media Library</h1><p className="admin-sub">Photos &amp; videos — hosted on Cloudinary, optimised automatically.</p></div>
        <label className="btn-sm btn-new" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading…" : "+ Upload"}
          <input type="file" accept="image/*,video/*" multiple hidden onChange={onFiles} />
        </label>
      </div>
      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}
      {busy ? <p>Loading…</p> : media.length === 0 ? (
        <div className="editor" style={{ textAlign: "center" }}><p style={{ color: "#7a6a7c" }}>Nothing here yet — upload your first photo or video.</p></div>
      ) : (
        <div className="media-grid">
          {media.map((m) => (
            <div className="media-item" key={m.id} style={bulk.selected.has(m.id) ? { outline: "3px solid var(--brand)" } : undefined}>
              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 4 }}>
                <CheckCell checked={bulk.selected.has(m.id)} onChange={() => bulk.toggleOne(m.id)} label="Select media" />
              </div>
              {m.kind === "video" ? <video src={m.url} /> : <img src={m.url} alt={m.alt || ""} loading="lazy" />}
              <div className="meta">
                <button className="btn-sm btn-edit" onClick={() => copy(m.url)}>{copied === m.url ? "Copied ✓" : "Copy URL"}</button>
                <button className="btn-sm btn-del" onClick={() => remove(m.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
