import "./globals.css";
import CookieBanner from "../components/CookieBanner";
import Analytics from "../components/Analytics";
import { getSettings, setting } from "../lib/db";
import { organizationJsonLd, jsonLdScript, siteUrl } from "../lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://samridhi-films.vercel.app";

export async function generateMetadata() {
  let indexing = false;
  try {
    const s = await getSettings();
    indexing = setting(s, "seo_indexing_enabled", false) === true;
  } catch { /* default stays noindex */ }
  return {
    metadataBase: new URL(BASE),
    title: {
      default: "Samridhi Films & Television | Event Management, Weddings & Artist Management",
      template: "%s | Samridhi Films & Television",
    },
    description:
      "Samridhi Films & Television — Chittorgarh's complete event management company since 1999. Weddings, celebrity shows, government & corporate events. You Just Think & We Will Manage It!",
    keywords: ["event management", "wedding planner Rajasthan", "celebrity management", "Chittorgarh events", "corporate events"],
    robots: indexing ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
    openGraph: { type: "website", siteName: "Samridhi Films & Television" },
  };
}

export default async function RootLayout({ children }) {
  let s = {};
  try { s = await getSettings(); } catch { /* fallbacks below */ }
  const wa = setting(s, "whatsapp", "919602228846");
  const waMsg = encodeURIComponent(setting(s, "whatsapp_msg", "Hi Samridhi Films! I want to plan an event."));
  const phone1 = setting(s, "phone1", "+91 96022 28846");
  const tel = "tel:" + phone1.replace(/\s/g, "");
  const org = organizationJsonLd(s);

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(org) }}
        />
      </head>
      <body>
        {children}
        <a
          className="wa-float"
          href={`https://wa.me/${wa}?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
        >
          ✆
        </a>
        <nav className="mobile-bottombar" aria-label="Quick actions">
          <a href={tel}>📞 Call</a>
          <a href={`https://wa.me/${wa}?text=${waMsg}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
          <a href="/contact">📝 Get a Quote</a>
        </nav>
        <CookieBanner
          ga4Id={setting(s, "ga4_id", "")}
          pixelId={setting(s, "meta_pixel_id", "")}
          text={setting(s, "cookie_banner_text", "")}
        />
        <Analytics />
      </body>
    </html>
  );
}
