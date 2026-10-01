// Shared address helpers — Admin → Settings → Addresses stores a single
// `addresses` setting: [{ label, address, map_url }]. Older installs used two
// fixed keys (address_chittorgarh / address_mumbai); those are used as a
// fallback so nothing is lost when upgrading.
import { setting } from "./db";

const DEFAULTS = [
  {
    label: "Chittorgarh Office",
    address: "230/4, Main Collectorate Circle, Gandhi Nagar, Chittorgarh 312001, Rajasthan",
    map_url: "",
  },
];

export function getAddresses(s = {}) {
  const raw = setting(s, "addresses", null);
  if (Array.isArray(raw)) {
    const list = raw
      .filter((a) => a && String(a.address || "").trim())
      .map((a) => ({
        label: String(a.label || "").trim(),
        address: String(a.address || "").trim(),
        map_url: String(a.map_url || "").trim(),
      }));
    if (list.length) return list;
    return []; // explicitly emptied — show nothing
  }
  // Legacy: two fixed keys.
  const out = [];
  const c = String(setting(s, "address_chittorgarh", "")).trim();
  const m = String(setting(s, "address_mumbai", "")).trim();
  if (c) out.push({ label: "Chittorgarh Office", address: c, map_url: "" });
  if (m) out.push({ label: "Mumbai Office", address: m, map_url: "" });
  return out.length ? out : DEFAULTS;
}

// Google Maps link for an address entry: the saved map URL wins, otherwise a
// maps search for the address text.
export function mapLink(a) {
  if (a.map_url && /^https?:\/\//i.test(a.map_url)) return a.map_url;
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(a.address + ", India")
  );
}
