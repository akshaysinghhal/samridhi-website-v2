import Link from "next/link";

// Props: { nav: [{label, href}] (footer location), settings }
// Renders the legal-entity/GST block from settings.legal_entity — only filled fields.
export default function Footer({ nav, settings }) {
  const s = settings || {};
  const get = (k, f = "") => (s[k] === undefined || s[k] === null ? f : s[k]);
  const legal = get("legal_entity", {}) || {};
  const go = legal.grievance_officer || {};
  const links = Array.isArray(nav) && nav.length
    ? nav
    : [
        { label: "About Us", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Weddings", href: "/weddings" },
        { label: "Artist Management", href: "/artists" },
        { label: "Portfolio", href: "/portfolio" },
        { label: "Contact", href: "/contact" },
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
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="brand-iso">
              <img src="/images/logo.png" alt="Samridhi Films & Television" />
              <img className="iso-badge" src="/images/iso-badge.png" alt="ISO 9001:2015 certified" style={{ height: 52 }} />
            </span>
            <p style={{ fontSize: 14.5, maxWidth: 340 }}>
              {get("tagline2", "Creating Experiences. Delivering Excellence.")} A complete event
              management company since 1999 — weddings, celebrity shows, government &amp; corporate
              events across India. A Group of Navratan Jain. ISO 9001:2015 certified.
            </p>
            <p className="footer-legal">{get("disclaimer", "")}</p>
          </div>
          <div>
            <h4>Explore</h4>
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href}>{l.label}</Link>
            ))}
          </div>
          <div>
            <h4>Reach Us</h4>
            <a href={"tel:" + String(get("phone1", "+91 96022 28846")).replace(/\s/g,)}>{get("phone1", "+91 96022 28846")}</a>
            <a href={"tel:" + String(get("phone2", "+91 77372 89938")).replace(/\s/g,)}>{get("phone2", "+91 77372 89938")}</a>
            <a href={"mailto:" + get("email", "samridhifilms@yahoo.co.in")}>{get("email", "samridhifilms@yahoo.co.in")}</a>
            <a href={get("instagram", "https://www.instagram.com/samridhi_films_and_television/")} target="_blank" rel="noreferrer">Instagram</a>
            <a href={get("facebook", "https://www.facebook.com/SamridhiFilmsAndTelevision")} target="_blank" rel="noreferrer">Facebook</a>
            <a href={get("youtube", "https://www.youtube.com/@SONAMUSICLIVE")} target="_blank" rel="noreferrer">YouTube</a>
          </div>
          <div>
            <h4>Offices</h4>
            <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>
              <strong style={{ color: "var(--yellow)" }}>Chittorgarh</strong><br />
              {get("address_chittorgarh", "230/4, Main Collectorate Circle, Gandhi Nagar, Chittorgarh 312001, Rajasthan")}
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>
              <strong style={{ color: "var(--yellow)" }}>Mumbai</strong><br />
              {get("address_mumbai", "Mumbai, Maharashtra")}
            </p>
            <h4 style={{ marginTop: 22 }}>Legal</h4>
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </div>
        </div>

        {legalRows.length > 0 && (
          <div className="footer-legal" style={{ marginTop: 34, borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 20 }}>
            {legalRows.map(([k, v]) => (
              <span key={k} style={{ marginRight: 22, whiteSpace: "nowrap" }}>
                <strong>{k}:</strong> {v}
              </span>
            ))}
            {(go.name || go.email || go.phone) && (
              <span style={{ marginRight: 22, whiteSpace: "nowrap" }}>
                <strong>Grievance officer:</strong> {[go.name, go.email, go.phone].filter(Boolean).join(" • ")}
              </span>
            )}
          </div>
        )}

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Samridhi Films And Television • Since 1999</span>
          <span>Mumbai &amp; Chittorgarh, Rajasthan</span>
        </div>
      </div>
    </footer>
  );
}
