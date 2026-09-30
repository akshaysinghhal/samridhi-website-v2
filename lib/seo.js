// Shared SEO helpers: structured data builders used by public pages.
// All values come from the database (via lib/db.js) — nothing hardcoded.

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://samridhi-films.vercel.app").replace(/\/$/, "");
}

export function organizationJsonLd(settings = {}) {
  const get = (k, f = "") => (settings[k] === undefined ? f : settings[k]);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: get("company_name", "Samridhi Films & Television"),
    slogan: get("tagline2", "Creating Experiences. Delivering Excellence."),
    url: siteUrl(),
    logo: `${siteUrl()}/images/logo.png`,
    foundingDate: "1999",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: get("phone1", "+91 96022 28846"),
        contactType: "sales",
        areaServed: "IN",
      },
    ],
    sameAs: [get("instagram", ""), get("facebook", ""), get("youtube", "")].filter(Boolean),
    address: [
      {
        "@type": "PostalAddress",
        streetAddress: get("address_chittorgarh", ""),
        addressLocality: "Chittorgarh",
        addressRegion: "Rajasthan",
        postalCode: "312001",
        addressCountry: "IN",
      },
      {
        "@type": "PostalAddress",
        addressLocality: "Mumbai",
        addressRegion: "Maharashtra",
        addressCountry: "IN",
      },
    ],
  };
}

export function videoObjectJsonLd({ title, description, thumbnailUrl, uploadDate, contentUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: description || title,
    thumbnailUrl: thumbnailUrl ? [thumbnailUrl] : undefined,
    uploadDate: uploadDate || undefined,
    contentUrl: contentUrl || undefined,
  };
}

export function faqJsonLd(faqs = []) {
  const items = (faqs || [])
    .filter((f) => f.q && f.a)
    .map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    }));
  if (!items.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items };
}

export function breadcrumbJsonLd(crumbs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url ? `${siteUrl()}${c.url}` : undefined,
    })),
  };
}

export function serviceJsonLd({ name, description, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: url ? `${siteUrl()}${url}` : siteUrl(),
    provider: {
      "@type": "Organization",
      name: "Samridhi Films & Television",
      url: siteUrl(),
    },
    areaServed: "India",
  };
}

export function eventJsonLd({ name, startDate, location, description, image }) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    location: location ? { "@type": "Place", name: location } : undefined,
    description,
    image: image ? [image] : undefined,
    organizer: { "@type": "Organization", name: "Samridhi Films & Television", url: siteUrl() },
  };
}

export function jsonLdScript(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
