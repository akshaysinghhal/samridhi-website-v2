"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Props: { nav: [{label, href}], phone, whatsapp }
// Luxury navbar: ivory bar, gold hairline, uppercase links,
// terracotta CTA, full-height mobile drawer. Shrinks softly on scroll.
export default function Header({ nav, phone, whatsapp }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const links = Array.isArray(nav) && nav.length
    ? nav
    : [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Weddings", href: "/weddings" },
        { label: "Artists", href: "/artists" },
        { label: "Events", href: "/events" },
        { label: "Gallery", href: "/gallery" },
        { label: "Contact", href: "/contact" },
      ];
  const tel = phone || "+91 96022 28846";
  const telHref = "tel:" + String(tel).replace(/\s/g, "");
  const wa = whatsapp || "919602228846";

  const closeRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      closeRef.current?.focus();
    } else {
      burgerRef.current?.focus();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav">
          <Link href="/" className="brand" aria-label="Samridhi Films & Television — home">
            <img src="/images/logo.png" alt="Samridhi Films & Television logo" />
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="nav-cta">
            <Link className="btn btn-primary" href="/contact">Plan Your Event</Link>
            <button className="burger" ref={burgerRef} onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" aria-hidden="true">
                <path d="M3 7h18M3 12h18M3 17h12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className={`nav-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-veil" onClick={() => setOpen(false)} />
        <div className="drawer-panel" role="dialog" aria-label="Menu">
          <div className="drawer-head">
            <img src="/images/logo.png" alt="Samridhi Films & Television" />
            <button className="drawer-close" ref={closeRef} onClick={() => setOpen(false)} aria-label="Close menu">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>
          <nav className="drawer-links" aria-label="Mobile navigation">
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)}>
                {l.label}<span className="darr">→</span>
              </Link>
            ))}
          </nav>
          <div className="drawer-cta">
            <Link className="btn btn-primary" href="/contact" onClick={() => setOpen(false)}>Plan Your Event</Link>
            <a className="btn btn-outline-terra" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp Us</a>
          </div>
          <div className="drawer-contact">
            <p>Prefer to talk? <a href={telHref}>{tel}</a></p>
            <p style={{ marginTop: 6 }}>Chittorgarh • Mumbai • Since 1999</p>
          </div>
        </div>
      </div>
    </>
  );
}
