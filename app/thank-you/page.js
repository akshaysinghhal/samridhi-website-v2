import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { getSettings, setting } from "../../lib/db";

export const metadata = {
  title: "Thank You",
  description: "Thank you for your enquiry — Samridhi Films & Television will get back to you shortly.",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage() {
  const s = await getSettings();
  const wa = setting(s, "whatsapp", "919602228846");
  const msg = encodeURIComponent("Hi Samridhi Films! I just sent an enquiry on your website.");

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container center" style={{ maxWidth: 640, padding: "40px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <span className="eyebrow">Enquiry Received</span>
          <h1 className="h2">Thank You!</h1>
          <p className="lead" style={{ margin: "0 auto 30px" }}>
            Your enquiry has reached our team. We usually reply within one working day —
            sooner on call or WhatsApp.
          </p>
          <div className="hero-ctas" style={{ justifyContent: "center" }}>
            <a className="btn btn-primary" href={`https://wa.me/${wa}?text=${msg}`} target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </a>
            <Link className="btn btn-dark" href="/">Back to Home</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
