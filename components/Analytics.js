"use client";
import { useEffect } from "react";
import { trackEvent } from "../lib/analytics";

// Global delegated click tracking (WhatsApp buttons, tel: links). Rendered once in app/layout.js.
export default function Analytics() {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest ? e.target.closest("a") : null;
      if (!a || !a.href) return;
      if (a.href.includes("wa.me") || a.href.includes("api.whatsapp.com")) {
        trackEvent("whatsapp_click", { link_url: a.href });
      } else if (a.href.startsWith("tel:")) {
        trackEvent("phone_click", { link_url: a.href });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
