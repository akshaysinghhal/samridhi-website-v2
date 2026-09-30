"use client";
import { useState } from "react";
import Link from "next/link";

// Props: { nav: [{label, href}], phone, whatsapp }
// Falls back to sensible defaults when props are missing.
export default function Header({ nav, phone, whatsapp }) {
  const [open, setOpen] = useState(false);
  const links = Array.isArray(nav) && nav.length
    ? nav
    : [
        { label: "Home", href: "/" },
        { label: "About", href: "/#about" },
        { label: "Weddings", href: "/weddings" },
        { label: "Artists", href: "/artists" },
        { label: "Gallery", href: "/#gallery" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/#contact" },
      ];
  const tel = phone || "+91 96022 28846";
  const telHref = "tel:" + String(tel).replace(/\s/g, "");

  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand brand-iso" aria-label="Samridhi Films & Television">
          <img src="/images/logo.png" alt="Samridhi Films & Television logo" />
          <img className="iso-badge" src="/images/iso-badge.png" alt="ISO 9001:2015 certified" />
        </Link>
        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation">
          {links.map((l) => (
            <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-cta">
          <a className="btn btn-outline-dark quote-btn" href="/contact">Get a Quote</a>
          <a className="btn btn-primary" href={telHref}>Call Now</a>
          <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>☰</button>
        </div>
      </div>
    </header>
  );
}
