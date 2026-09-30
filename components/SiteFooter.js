import Footer from "./Footer";
import { getNav, getSettings } from "../lib/db";

// Async server wrapper: fetches footer nav + settings, renders the client-safe Footer.
export default async function SiteFooter() {
  let nav = [];
  let s = {};
  try {
    [nav, s] = await Promise.all([getNav("footer"), getSettings()]);
  } catch {
    /* fallbacks inside Footer */
  }
  return <Footer nav={nav} settings={s} />;
}
