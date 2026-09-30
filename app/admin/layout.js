"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { ADMIN_NAV } from "../../lib/adminNav";
import "./admin.css";

export default function AdminLayout({ children }) {
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const isLogin = path === "/admin/login";

  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/admin/login");
      else setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push("/admin/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [isLogin, router]);

  const logout = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/admin/login");
  };

  if (isLogin) return <>{children}</>;
  if (!ready) return <div style={{ padding: 60, textAlign: "center" }}>Loading…</div>;

  return (
    <div className="admin-shell">
      <div className="admin-mobilebar">
        <img src="/images/logo.png" alt="Samridhi" />
        <span className="mtitle">Admin</span>
        <button onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">{menuOpen ? "✕" : "☰"}</button>
      </div>
      {menuOpen && (
        <nav className="admin-mobilenav">
          {ADMIN_NAV.map(([icon, label, href]) => (
            <Link key={href} href={href} className={path === href ? "active" : ""} onClick={() => setMenuOpen(false)}>{icon} {label}</Link>
          ))}
          <a href="#" className="logout" onClick={(e) => { e.preventDefault(); setMenuOpen(false); logout(); }}>🚪 Sign Out</a>
        </nav>
      )}
      <aside className="admin-side">
        <img src="/images/logo.png" alt="Samridhi" />
        {ADMIN_NAV.map(([icon, label, href]) => (
          <Link key={href} href={href} className={path === href ? "active" : ""}>{icon} {label}</Link>
        ))}
        <a href="/" target="_blank" rel="noreferrer">🌐 View Website</a>
        <a href="#" className="logout" onClick={(e) => { e.preventDefault(); logout(); }}>🚪 Sign Out</a>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
