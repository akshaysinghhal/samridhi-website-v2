"use client";
import { useEffect, useState } from "react";

// Cookie consent banner. Loads analytics (GA4 / Meta Pixel) only after consent.
// Wired to the Cookie Policy page (/cookie-policy).
export default function CookieBanner({ ga4Id, pixelId, text }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("samridhi_cookie_consent")) setShow(true);
      else if (localStorage.getItem("samridhi_cookie_consent") === "accepted") loadAnalytics();
    } catch {
      setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnalytics = () => {
    if (ga4Id && !document.getElementById("ga4-tag")) {
      const s = document.createElement("script");
      s.id = "ga4-tag";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
      document.head.appendChild(s);
      const inline = document.createElement("script");
      inline.id = "ga4-init";
      inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`;
      document.head.appendChild(inline);
    }
    if (pixelId && !document.getElementById("fb-pixel")) {
      const inline = document.createElement("script");
      inline.id = "fb-pixel";
      inline.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
      document.head.appendChild(inline);
    }
  };

  const choose = (val) => {
    try {
      localStorage.setItem("samridhi_cookie_consent", val);
    } catch { /* ignore */ }
    if (val === "accepted") loadAnalytics();
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p>{text || "We use cookies to improve your experience and analyse site traffic. You can accept or decline."}</p>
      <div className="cookie-actions">
        <a href="/cookie-policy">Cookie Policy</a>
        <button className="btn btn-outline-dark" onClick={() => choose("declined")}>Decline</button>
        <button className="btn btn-primary" onClick={() => choose("accepted")}>Accept</button>
      </div>
    </div>
  );
}
