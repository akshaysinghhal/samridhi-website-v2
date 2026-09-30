"use client";
import AdminCrud from "../_lib/crud-ui";

export default function SeoAdmin() {
  return (
    <>
      <h1>SEO & Redirects</h1>
      <p className="admin-sub">Manage URL redirects and check sitemap/robots status.</p>

      <div className="content-group">
        <h2>Sitemap & Robots</h2>
        <table className="admin-table" style={{ marginTop: 12 }}>
          <tbody>
            <tr><td><b>Sitemap</b></td><td><a href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a> — generated automatically from published content</td></tr>
            <tr><td><b>Robots</b></td><td><a href="/robots.txt" target="_blank" rel="noreferrer">/robots.txt</a> — respects the SEO indexing toggle in Settings</td></tr>
            <tr><td><b>Per-page SEO</b></td><td>Title, description and JSON-LD blocks are edited on each Service, Event and Landing Page (look for the SEO fields in their editors).</td></tr>
          </tbody>
        </table>
      </div>

      <AdminCrud
        title="URL Redirects"
        sub="Old or changed URLs that should forward elsewhere (301 permanent, 302 temporary)."
        endpoint="/api/admin/redirects"
        listKey="redirects"
        addLabel="Add Redirect"
        columns={[
          { key: "from_path", label: "From" },
          { key: "to_path", label: "To" },
          { key: "code", label: "Code" },
        ]}
        fields={[
          { key: "from_path", label: "From path", required: true, placeholder: "/old-page" },
          { key: "to_path", label: "To path", required: true, placeholder: "/new-page" },
          { key: "code", label: "Redirect code", type: "select", options: [{ value: 301, label: "301 — Permanent" }, { value: 302, label: "302 — Temporary" }] },
        ]}
        defaults={{ code: 301 }}
        validate={(f) => (!f.from_path || !f.from_path.trim() ? "From path is required." : !f.to_path.trim() ? "To path is required." : null)}
      />
    </>
  );
}
