import Link from "next/link";
import { getAddresses, mapLink } from "../lib/addresses";

// Props: { nav: [{label, href}] (footer location), settings }
// Sophisticated dark-brown footer: 4 columns, champagne-gold divider,
// compliance details kept in a discreet disclosure.
export default function Footer({ nav, settings }) {
  const s = settings || {};
  const get = (k, f = "") => (s[k] === undefined || s[k] === null ? f : s[k]);
  const legal = get("legal_entity", {}) || {};
  const go = legal.grievance_officer || {};
  const explore = Array.isArray(nav) && nav.length
    ? nav
    : [
        { label: "About Us", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Weddings", href: "/weddings" },
        { label: "Artist Management", href: "/artists" },
        { label: "Events", href: "/events" },
        { label: "Portfolio", href: "/portfolio" },
        { label: "Contact", href: "/contact" },
      ];
  const services = [
    { label: "Government Events", href: "/services" },
    { label: "Corporate Events", href: "/services" },
    { label: "Weddings & Destination Weddings", href: "/weddings" },
    { label: "Celebrity & Artist Management", href: "/artists" },
    { label: "Entertainment & Live Shows", href: "/services" },
    { label: "International Shows", href: "/international-shows" },
  ];
  const company = [
    { label: "About Us", href: "/about" },
    { label: "Clients", href: "/clients" },
    { label: "Gallery", href: "/gallery" },
    { label: "Press", href: "/press" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Blog", href: "/blog" },
  ];
  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Booking & Cancellation", href: "/booking-and-cancellation-policy" },
  ];

  const legalRows = [
    legal.legal_name && ["Legal name", legal.legal_name],
    legal.trade_name && ["Trade name", legal.trade_name],
    legal.gstin && ["GSTIN", legal.gstin],
    legal.pan && ["PAN", legal.pan],
    legal.address && ["Registered address", legal.address],
    legal.state && ["State", legal.state],
    legal.email && ["Email", legal.email],
    legal.phone && ["Phone", legal.phone],
  ].filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/images/logo.png" alt="Samridhi Films & Television" />
            <p>
              {get("tagline2", "Creating Experiences. Delivering Excellence.")} A complete event
              management company since 1999 — weddings, celebrity shows, government &amp; corporate
              events across India. A Group of Navratan Jain. ISO 9001:2015 certified.
            </p>
            <p className="footer-legal">{get("disclaimer", "")}</p>
          </div>
          <div>
            <h4>Company</h4>
            {company.map((l) => (
              <Link key={l.href + l.label} href={l.href}>{l.label}</Link>
            ))}
          </div>
          <div>
            <h4>Services</h4>
            {services.map((l) => (
              <Link key={l.href + l.label} href={l.href}>{l.label}</Link>
            ))}
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            {getAddresses(s).map((a, i) => (
              <p key={i} style={i ? { marginTop: 12 } : undefined}>
                {a.label ? (<><strong>{a.label}</strong><br /></>) : null}
                <a href={mapLink(a)} target="_blank" rel="noreferrer" style={{ display: "inline" }}>{a.address}</a>
              </p>
            ))}
            <p style={{ marginTop: 12 }}>
              <a href={"tel:" + String(get("phone1", "+91 96022 28846")).replace(/\s/g, "")} style={{ display: "inline" }}>{get("phone1", "+91 96022 28846")}</a>
            </p>
            <p>
              <a href={"mailto:" + get("email", "samridhifilms@yahoo.co.in")} style={{ display: "inline" }}>{get("email", "samridhifilms@yahoo.co.in")}</a>
            </p>
            <p style={{ marginTop: 12 }}>
              <a href={get("instagram", "https://www.instagram.com/samridhi_films_and_television/")} target="_blank" rel="noreferrer" style={{ display: "inline" }}>Instagram</a>
              {"  ·  "}
              <a href={get("facebook", "https://www.facebook.com/SamridhiFilmsAndTelevision")} target="_blank" rel="noreferrer" style={{ display: "inline" }}>Facebook</a>
              {"  ·  "}
              <a href={get("youtube", "https://www.youtube.com/@SONAMUSICLIVE")} target="_blank" rel="noreferrer" style={{ display: "inline" }}>YouTube</a>
            </p>
            <h4 style={{ marginTop: 26 }}>Explore</h4>
            {explore.slice(0, 4).map((l) => (
              <Link key={l.href + l.label} href={l.href}>{l.label}</Link>
            ))}
          </div>
        </div>

        {legalRows.length > 0 && (
          <details className="footer-legal" style={{ marginBottom: 34 }}>
            <summary>Legal entity &amp; compliance</summary>
            <div style={{ marginTop: 14 }}>
              {legalRows.map(([k, v]) => (
                <span key={k} style={{ marginRight: 24, whiteSpace: "nowrap" }}>
                  <strong style={{ color: "var(--gold-soft)" }}>{k}:</strong> {v}
                </span>
              ))}
              {(go.name || go.email || go.phone) && (
                <span style={{ marginRight: 24, whiteSpace: "nowrap" }}>
                  <strong style={{ color: "var(--gold-soft)" }}>Grievance officer:</strong> {[go.name, go.email, go.phone].filter(Boolean).join(" • ")}
                </span>
              )}
            </div>
          </details>
        )}
      </div>

      <hr className="footer-divider" />

      <div className="container">
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Samridhi Films &amp; Television • Since 1999</span>
          <nav aria-label="Legal">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
