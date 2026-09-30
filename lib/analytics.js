// Client-side analytics events. Fires to GA4 (gtag) and Meta Pixel (fbq) only
// when they are loaded — i.e. after the visitor accepts cookies.
export function trackEvent(name, params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...params });
  } catch { /* ignore */ }
  try {
    if (typeof window.fbq === "function") window.fbq("trackCustom", name, params);
  } catch { /* ignore */ }
}
