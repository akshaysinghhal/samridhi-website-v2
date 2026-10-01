import "./globals.css";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import CookieBanner from "../components/CookieBanner";
import Analytics from "../components/Analytics";
import AnnouncementBar from "../components/AnnouncementBar";
import PublicChrome from "./_public-chrome";
import { getSettings, setting } from "../lib/db";
import { organizationJsonLd, jsonLdScript, siteUrl } from "../lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://samridhi-films.vercel.app";

// Editorial luxury pairing: Cormorant Garamond for display serif headings,
// Manrope for clean modern sans body.
const inter = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const sora = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-head", display: "swap" });

export async function generateMetadata() {
  let indexing = false;
  let s = {};
  try {
    s = await getSettings();
    indexing = setting(s, "seo_indexing_enabled", false) === true;
  } catch { /* default stays noindex */ }
  // Website logo (Admin → Settings → Company) — used for share cards.
  const customLogo = String(setting(s, "logo_url", "") || "").trim();
  const ogImages = customLogo
    ? [{ url: customLogo, alt: "Samridhi Films & Television" }]
    : [{ url: "/images/logo.png", width: 1200, height: 567, alt: "Samridhi Films & Television" }];
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
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: "Samridhi Films & Television | Event Management, Weddings & Artist Management",
      description:
        "Weddings, celebrity shows, government & corporate events across Rajasthan since 1999. You Just Think & We Will Manage It!",
      images: [customLogo || "/images/logo.png"],
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
  const themeBrown = hex(setting(s, "theme_brown", ""));
  const themeFooter = hex(setting(s, "theme_footer", ""));
  const themeCss =
    themePrimary || themeDeep || themeGold || themeBrown || themeFooter
      ? `:root{${themePrimary ? `--terracotta:${themePrimary};` : ""}${themeDeep ? `--terracotta-deep:${themeDeep};` : ""}${themeGold ? `--gold:${themeGold};` : ""}${themeBrown ? `--brown:${themeBrown};` : ""}${themeFooter ? `--footer-bg:${themeFooter};` : ""}}`
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
        <PublicChrome wa={wa} waMsg={waMsg} tel={tel} />
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
