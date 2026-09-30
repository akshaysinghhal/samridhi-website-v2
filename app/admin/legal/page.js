"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/adminApi";
import { revalidateSite } from "../_lib/ui";

export default function LegalAdmin() {
  const [pages, setPages] = useState([]);
  const [active, setActive] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    try {
      const r = await api("/api/admin/legal-pages");
      setPages(r.pages || []);
      const first = active || (r.pages[0] && r.pages[0].slug);
      const p = (r.pages || []).find((x) => x.slug === first) || r.pages[0];
      if (p) { setActive(p.slug); setTitle(p.title); setBody(p.body); }
    } catch { /* ignore */ }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const pick = (slug) => {
    const p = pages.find((x) => x.slug === slug);
    if (p) { setActive(p.slug); setTitle(p.title); setBody(p.body); setMsg(""); setOkMsg(""); }
  };

  const save = async () => {
    setMsg(""); setOkMsg("");
    try {
      await api(`/api/admin/legal-pages/${active}`, { method: "PUT", body: { title, body } });
      await revalidateSite(["/privacy-policy", "/terms-and-conditions", "/cancellation-refund-policy", "/shipping-policy"]);
      setOkMsg(`Saved. Last updated timestamp set to ${new Date().toLocaleString("en-IN")}.`);
      load();
    } catch (e) { setMsg("Failed: " + e.message); }
  };

  if (busy) return (<><h1>Legal Pages</h1><p>Loading…</p></>);

  return (
    <>
      <h1>Legal Pages</h1>
      <p className="admin-sub">Privacy Policy, Terms, Cancellation & Refund, and Shipping policies. Content is Markdown.</p>
      <div className="admin-warn" style={{ marginBottom: 20 }}>
        ⚠️ <b>Drafts generated for convenience.</b> Have a qualified lawyer review these pages before launch.
      </div>
      {msg && <div className="login-err" style={{ marginBottom: 16 }}>{msg}</div>}
      {okMsg && <div className="admin-ok" style={{ marginBottom: 16 }}>{okMsg}</div>}

      <div className="tab-row">
        {pages.map((p) => (
          <button key={p.slug} className={`tab-btn ${active === p.slug ? "active" : ""}`} onClick={() => pick(p.slug)}>
            {p.title}
          </button>
        ))}
      </div>

      <div className="editor">
        <div className="field"><label>Page title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>Content (Markdown)</label>
          <textarea rows={22} style={{ fontFamily: "ui-monospace, monospace", fontSize: 13.5, lineHeight: 1.6 }} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save}>Save Page</button>
      </div>
    </>
  );
}
