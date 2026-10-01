import "./globals.css";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import CookieBanner from "../components/CookieBanner";
import Analytics from "../components/Analytics";
import AnnouncementBar from "../components/AnnouncementBar";
import { getSettings, setting } from "../lib/db";
import { organizationJsonLd, jsonLdScript, siteUrl } from "../lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://samridhi-films.vercel.app";

// Editorial luxury pairing: Cormorant Garamond for display serif headings,
// Manrope for clean modern sans body.
const inter = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const sora = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-head", display: "swap" });

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
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      siteName: "Samridhi Films & Television",
      title: "Samridhi Films & Television | Event Management, Weddings & Artist Management",
      description:
        "Samridhi Films & Television — Chittorgarh's complete event management company since 1999. Weddings, celebrity shows, government & corporate events across Rajasthan.",
      images: [{ url: "/images/logo.png", width: 1200, height: 567, alt: "Samridhi Films & Television" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Samridhi Films & Television | Event Management, Weddings & Artist Management",
      description:
        "Weddings, celebrity shows, government & corporate events across Rajasthan since 1999. You Just Think & We Will Manage It!",
      images: ["/images/logo.png"],
    },
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

  // Announcement bar (Admin → Settings → Announcement bar). Only http(s) or
  // site-relative links are rendered — anything else is dropped.
  const annOn = setting(s, "announcement_enabled", false) === true;
  const annText = String(setting(s, "announcement_text", "")).trim();
  const annUrlRaw = String(setting(s, "announcement_link_url", "")).trim();
  const annUrl = /^(\/|https?:\/\/)/i.test(annUrlRaw) ? annUrlRaw : "";
  const annLabel = String(setting(s, "announcement_link_label", "")).trim();

  // Website theme colours — changeable from Admin → Settings → Website theme.
  // Only strict #rrggbb values are accepted, so this can never inject CSS.
  const hex = (v) => (/^#[0-9a-fA-F]{6}$/.test(String(v || "").trim()) ? String(v).trim() : null);
  const themePrimary = hex(setting(s, "theme_primary", ""));
  const themeDeep = hex(setting(s, "theme_deep", ""));
  const themeGold = hex(setting(s, "theme_gold", ""));
  const themeCss =
    themePrimary || themeDeep || themeGold
      ? `:root{${themePrimary ? `--terracotta:${themePrimary};` : ""}${themeDeep ? `--terracotta-deep:${themeDeep};` : ""}${themeGold ? `--gold:${themeGold};` : ""}}`
      : "";

  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(org) }}
        />
        {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      </head>
      <body>
        {annOn && annText ? (
          <AnnouncementBar text={annText} linkUrl={annUrl} linkLabel={annLabel} />
        ) : null}
        {children}
        <a
          className="wa-float"
          href={`https://wa.me/${wa}?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.14 15.06l-.31-.19-3 .87.88-2.9-.2-.32A8.1 8.1 0 0 1 12.04 3.8Zm-3.1 4.02c-.18 0-.46.06-.7.31-.24.25-.95.93-.95 2.27s.97 2.63 1.1 2.82c.14.18 1.9 3 4.7 4.04.56.2 1 .33 1.34.42.57.18 1.08.16 1.49.1.45-.07 1.4-.57 1.59-1.12.2-.55.2-1.02.14-1.12-.06-.1-.24-.16-.5-.28l-2.1-1.04c-.26-.13-.45-.19-.64.06l-.9 1.08c-.17.19-.33.22-.6.11a7.6 7.6 0 0 1-2.24-1.38 8.42 8.42 0 0 1-1.56-1.94c-.16-.28-.02-.43.13-.57l.42-.5c.13-.16.19-.27.28-.45.1-.18.05-.34-.02-.47l-.94-2.27c-.24-.6-.5-.52-.69-.53h-.59Z" />
          </svg>
        </a>
        <nav className="mobile-bottombar" aria-label="Quick actions">
          <a href={tel}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            Call
          </a>
          <a href={`https://wa.me/${wa}?text=${waMsg}`} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.14 15.06l-.31-.19-3 .87.88-2.9-.2-.32A8.1 8.1 0 0 1 12.04 3.8Zm-3.1 4.02c-.18 0-.46.06-.7.31-.24.25-.95.93-.95 2.27s.97 2.63 1.1 2.82c.14.18 1.9 3 4.7 4.04.56.2 1 .33 1.34.42.57.18 1.08.16 1.49.1.45-.07 1.4-.57 1.59-1.12.2-.55.2-1.02.14-1.12-.06-.1-.24-.16-.5-.28l-2.1-1.04c-.26-.13-.45-.19-.64.06l-.9 1.08c-.17.19-.33.22-.6.11a7.6 7.6 0 0 1-2.24-1.38 8.42 8.42 0 0 1-1.56-1.94c-.16-.28-.02-.43.13-.57l.42-.5c.13-.16.19-.27.28-.45.1-.18.05-.34-.02-.47l-.94-2.27c-.24-.6-.5-.52-.69-.53h-.59Z" />
            </svg>
            WhatsApp
          </a>
          <a href="/contact">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
              <path d="M14 2v6h6M9 13h6M9 17h4" />
            </svg>
            Get a Quote
          </a>
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
