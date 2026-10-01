"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { ADMIN_NAV } from "../../lib/adminNav";
import { AiFloatHelper } from "./_lib/AiAssist";
import { AdminLoader, Toaster } from "./_lib/ui";
import "./admin.css";

export default function AdminLayout({ children }) {
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const isLogin = path === "/admin/login";

  useEffect(() => {
    // Mark body as admin so public mobile chrome CSS (bottom-bar padding) never applies here.
    document.body.classList.add("is-admin");
    return () => document.body.classList.remove("is-admin");
  }, []);

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

  const navHere =
    [...ADMIN_NAV].reverse().find(([, , href]) => href !== "/admin" && path.startsWith(href)) ||
    ADMIN_NAV.find(([, , href]) => href === "/admin");
  const sectionLabel = navHere ? `${navHere[0]} ${navHere[1]}` : "Admin";

  if (isLogin) return <>{children}</>;
  if (!ready) return <AdminLoader />;

  return (
    <div className="admin-shell">
      <div className="admin-mobilebar">
        <img src="/images/logo.png" alt="Samridhi" />
        <span className="mtitle">{sectionLabel}</span>
        <button onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">{menuOpen ? "✕" : "☰"}</button>
      </div>
      {menuOpen && (
        <nav className="admin-mobilenav">
          {ADMIN_NAV.map(([icon, label, href]) => (
            <Link key={href} href={href} className={path === href ? "active" : ""} onClick={() => setMenuOpen(false)}>{icon} {label}</Link>
          ))}
          <a href="/" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>🌐 View Website</a>
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
      <AiFloatHelper />
      <Toaster />
    </div>
  );
}
