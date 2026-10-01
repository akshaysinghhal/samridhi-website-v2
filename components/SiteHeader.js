import Header from "./Header";
import { getNav, getSettings, setting } from "../lib/db";

// Async server wrapper: fetches nav + contact settings, renders the client Header.
export default async function SiteHeader() {
  let nav = [];
  let s = {};
  try {
    [nav, s] = await Promise.all([getNav("header"), getSettings()]);
  } catch {
    /* fallbacks inside Header */
  }
  return (
    <Header
      nav={nav}
      phone={setting(s, "phone1", "+91 96022 28846")}
      whatsapp={setting(s, "whatsapp", "919602228846")}
      logoUrl={String(setting(s, "logo_url", "") || "").trim() || "/images/logo.png"}
    />
  );
}
