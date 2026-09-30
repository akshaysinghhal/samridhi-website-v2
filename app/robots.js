import { siteUrl } from "../lib/seo";
import { getSettings, setting } from "../lib/db";

// Search indexing defaults to OFF until the admin enables it in Settings.
export default async function robots() {
  const base = siteUrl();
  let indexing = false;
  try {
    const s = await getSettings();
    indexing = setting(s, "seo_indexing_enabled", false) === true;
  } catch { /* default: disallow */ }

  return {
    rules: [{ userAgent: "*", ...(indexing ? { allow: "/" } : { disallow: "/" }) }],
    sitemap: indexing ? `${base}/sitemap.xml` : undefined,
  };
}
