"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/adminApi";
import { useBulk, BulkBar, CheckCell, revalidateSite, openPreview, StatusFilter, AdminLoader } from "../_lib/ui";

// Draft preview goes through the authenticated /api/admin/preview endpoint
// (sets a short-lived cookie and returns the public URL); published posts
// link directly. Returns a click handler — never a secret-bearing URL.
function previewAction(post, setMsg) {
  if (!post.slug) return null;
  if (post.status === "published") return () => window.open(`/blog/${post.slug}`, "_blank", "noopener");
  return () => openPreview(post.slug, setMsg);
}

export default function PostsList() {
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  const load = async (silent) => {
    if (!silent) setBusy(true);
    try { setPosts((await api("/api/admin/posts")).posts); } catch { /* ignore */ }
    if (!silent) setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const shown = posts.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    const needle = q.trim().toLowerCase();
    if (needle && !`${p.title || ""} ${p.slug || ""}`.toLowerCase().includes(needle)) return false;
    return true;
  });

  const bulk = useBulk({ rows: shown, patchRows: setPosts, endpoint: "/api/admin/posts" });

  const remove = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/api/admin/posts/${id}`, { method: "DELETE" });
    await revalidateSite();
    // Remove in place — no list reload flash.
    setPosts((ps) => ps.filter((p) => p.id !== id));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1>Blog Posts</h1><p className="admin-sub">Write once — published with full SEO automatically.</p></div>
        <Link className="btn-sm btn-new" href="/admin/posts/new">+ New Post</Link>
      </div>
      {bulk.selected.size > 0 && <BulkBar bulk={bulk} onDone={revalidateSite} />}
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {posts.length > 0 && (
        <div className="list-bar">
          <input className="list-filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug…" aria-label="Search posts" style={{ flex: 1, minWidth: 180 }} />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          {(q.trim() || statusFilter) && <span className="seo-hint" style={{ margin: 0, whiteSpace: "nowrap" }}>{shown.length} of {posts.length}</span>}
        </div>
      )}
      {busy ? <AdminLoader /> : posts.length === 0 ? (
        <div className="editor" style={{ textAlign: "center" }}>
          <p style={{ color: "#7a6a7c" }}>No posts yet. Write your first story!</p>
          <Link className="btn btn-primary" href="/admin/posts/new">+ New Post</Link>
        </div>
      ) : shown.length === 0 ? (
        <p style={{ color: "#7a6a7c" }}>No posts match this filter.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th style={{ width: 40 }}><CheckCell checked={bulk.allChecked} onChange={bulk.toggleAll} label="Select all posts" /></th><th>Title</th><th>Status</th><th>Published</th><th></th></tr></thead>
          <tbody>
            {shown.map((p) => {
              const onPreview = previewAction(p, setMsg);
              return (
                <tr key={p.id} className={bulk.selected.has(p.id) ? "row-selected" : ""}>
                  <td><CheckCell checked={bulk.selected.has(p.id)} onChange={() => bulk.toggleOne(p.id)} label={`Select ${p.title}`} /></td>
                  <td><b>{p.title}</b><br /><span style={{ color: "#7a6a7c", fontSize: 12.5 }}>/blog/{p.slug}</span></td>
                  <td><span className={`badge ${p.status === "published" ? "pub" : "draft"}`}>{p.status}</span></td>
                  <td>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td><div className="row-actions">
                    {onPreview && <button className="btn-sm btn-view" onClick={onPreview}>Preview</button>}
                    <Link className="btn-sm btn-edit" href={`/admin/posts/${p.id}`}>Edit</Link>
                    <button className="btn-sm btn-del" onClick={() => remove(p.id, p.title)}>Delete</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
