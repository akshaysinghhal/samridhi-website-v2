"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/adminApi";
import { ADMIN_NAV } from "../../lib/adminNav";
import { AdminLoader } from "./_lib/ui";

const STATUSES = ["New", "Contacted", "Quote Sent", "Negotiation", "Won", "Lost"];

export default function AdminDashboard() {
  const [leadStats, setLeadStats] = useState({ newToday: 0, byStatus: {} });
  const [launch, setLaunch] = useState({ total: 0, areas: [] });
  const [drafts, setDrafts] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [leads, lch, posts, events, stories] = await Promise.all([
          api("/api/admin/leads"), api("/api/admin/launch"),
          api("/api/admin/posts"), api("/api/admin/events"), api("/api/admin/couple-stories"),
        ]);
        const today = new Date().toISOString().slice(0, 10);
        const byStatus = {};
        let newToday = 0;
        for (const l of leads.leads || []) {
          byStatus[l.status] = (byStatus[l.status] || 0) + 1;
          if (l.status === "New" && !l.spam && (l.created_at || "").slice(0, 10) === today) newToday++;
        }
        const awaiting = (leads.leads || []).filter((l) => l.status === "New" && !l.spam).length;
        setLeadStats({ newToday, byStatus, awaiting });
        setLaunch({ total: lch.total || 0, areas: lch.areas || [] });
        const d =
          (posts.posts || []).filter((p) => p.status !== "published").length +
          (events.events || []).filter((e) => e.status !== "published").length +
          (stories.stories || []).filter((s) => s.status !== "published").length;
        setDrafts(d);
      } catch { /* ignore */ }
      setBusy(false);
    })();
  }, []);

  const modules = ADMIN_NAV.filter(([, , href]) => href !== "/admin");

  return (
    <>
      <h1>Dashboard</h1>
      <p className="admin-sub">Everything on your website lives here — edit it and it goes live within a minute.</p>

      {busy ? <AdminLoader /> : (
        <>
          <div className="dash-cards">
            <Link className="dash-card" href="/admin/leads">
              <div className="n">{leadStats.newToday}</div><div className="l">New leads today</div>
            </Link>
            <Link className="dash-card" href="/admin/launch">
              <div className="n" style={{ color: launch.total > 0 ? "#e65100" : "#2e7d32" }}>{launch.total}</div>
              <div className="l">Placeholders remaining</div>
            </Link>
            <div className="dash-card"><div className="n">{drafts}</div><div className="l">Unpublished drafts</div></div>
            <Link className="dash-card" href="/admin/leads">
              <div className="n">{leadStats.awaiting || 0}</div><div className="l">Leads awaiting action</div>
            </Link>
          </div>

          <div className="content-group" style={{ marginTop: 24 }}>
            <h2>Leads pipeline</h2>
            <div className="pipeline-row">
              {STATUSES.map((s) => (
                <Link key={s} href={`/admin/leads`} className="pipeline-chip">
                  <span className="n">{leadStats.byStatus[s] || 0}</span><span className="l">{s}</span>
                </Link>
              ))}
            </div>
          </div>

          <h2 style={{ marginTop: 28 }}>Modules</h2>
          <div className="dash-cards">
            {modules.map(([icon, label, href]) => (
              <Link key={href} className="dash-card dash-link" href={href}>
                <div style={{ fontSize: 26 }}>{icon}</div>
                <div className="l" style={{ marginTop: 8 }}>{label}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
