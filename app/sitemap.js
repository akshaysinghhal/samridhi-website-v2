import { siteUrl } from "../lib/seo";
import { getServices, getEvents, getArtists, getLandingPages, getPublishedPosts, getInternationalShows } from "../lib/db";

const STATIC = [
  "", "/about", "/services", "/artists", "/weddings", "/couple-stories",
  "/portfolio", "/gallery", "/press", "/clients", "/testimonials",
  "/international-shows", "/contact",
  "/privacy-policy", "/terms-and-conditions", "/cookie-policy",
  "/booking-and-cancellation-policy",
];

export default async function sitemap() {
  const base = siteUrl();
  const urls = STATIC.map((p) => ({ url: base + (p || "/"), lastModified: new Date() }));

  try {
    const [services, events, artists, landing, posts, intlShows] = await Promise.all([
      getServices(), getEvents({ limit: 200 }), getArtists({ limit: 200 }),
      getLandingPages(), getPublishedPosts(200), getInternationalShows(),
    ]);
    for (const s of services) urls.push({ url: `${base}/services/${s.slug}`, lastModified: new Date(s.updated_at || Date.now()) });
    for (const e of events) urls.push({ url: `${base}/portfolio/${e.slug}`, lastModified: new Date(e.updated_at || Date.now()) });
    for (const a of artists) urls.push({ url: `${base}/artists/${a.slug}`, lastModified: new Date(a.updated_at || Date.now()) });
    for (const l of landing) urls.push({ url: `${base}/${l.slug}`, lastModified: new Date(l.updated_at || Date.now()) });
    for (const p of posts) urls.push({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updated_at || p.published_at || Date.now()) });
    for (const sh of intlShows) urls.push({ url: `${base}/international-shows/${sh.slug || sh.id}`, lastModified: new Date(sh.updated_at || sh.created_at || Date.now()) });
  } catch { /* ignore */ }

  return urls;
}
