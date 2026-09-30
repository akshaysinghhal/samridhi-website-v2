"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/adminApi";

export default function PostsList() {
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    try { setPosts((await api("/api/admin/posts")).posts); } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/api/admin/posts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1>Blog Posts</h1><p className="admin-sub">Write once — published with full SEO automatically.</p></div>
        <Link className="btn-sm btn-new" href="/admin/posts/new">+ New Post</Link>
      </div>
      {busy ? <p>Loading…</p> : posts.length === 0 ? (
        <div className="editor" style={{ textAlign: "center" }}>
          <p style={{ color: "#7a6a7c" }}>No posts yet. Write your first story!</p>
          <Link className="btn btn-primary" href="/admin/posts/new">+ New Post</Link>
        </div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Status</th><th>Published</th><th></th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td><b>{p.title}</b><br /><span style={{ color: "#7a6a7c", fontSize: 12.5 }}>/blog/{p.slug}</span></td>
                <td><span className={`badge ${p.status === "published" ? "pub" : "draft"}`}>{p.status}</span></td>
                <td>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN") : "—"}</td>
                <td><div className="row-actions">
                  <Link className="btn-sm btn-edit" href={`/admin/posts/${p.id}`}>Edit</Link>
                  <button className="btn-sm btn-del" onClick={() => remove(p.id, p.title)}>Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
