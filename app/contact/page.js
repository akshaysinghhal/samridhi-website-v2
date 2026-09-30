import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import LeadForm from "../../components/LeadForm";
import { getSettings, setting } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Contact Us",
  description: "Let's create something amazing — call, WhatsApp or send an enquiry to Samridhi Films & Television, Chittorgarh & Mumbai.",
};

export default async function ContactPage() {
  const s = await getSettings();
  const phone1 = setting(s, "phone1", "+91 96022 28846");
  const phone2 = setting(s, "phone2", "+91 77372 89938");
  const email = setting(s, "email", "samridhifilms@yahoo.co.in");
  const addrC = setting(s, "address_chittorgarh", "230/4, Main Collectorate Circle, Gandhi Nagar, Chittorgarh 312001, Rajasthan");
  const addrM = setting(s, "address_mumbai", "Mumbai, Maharashtra");
  const mapsC = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addrC);
  const mapsM = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addrM + ", India");

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#6d28d9,#d97706)" }}>
        <img className="hero-bg" src="/images/ig-guests-celebrating.jpg" alt="Guests celebrating" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Contact</span>
          <h1>Let&apos;s Create Something Amazing</h1>
          <p className="sub">Planning an event? Let our team understand your requirement and create the right event solution.</p>
          <div className="hero-ctas">
            <a className="btn btn-white" href={"tel:" + phone1.replace(/\s/g,)}>Call Our Team</a>
            <a className="btn btn-outline" href={`https://wa.me/${setting(s, "whatsapp", "919602228846")}`} target="_blank" rel="noreferrer">WhatsApp Us</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div>
              <LeadForm type="contact" />
            </div>
            <div className="contact-cards">
              <div className="contact-card">
                <h4>Chittorgarh Office</h4>
                <p>{addrC}</p>
                <p><a href={mapsC} target="_blank" rel="noreferrer">View on Google Maps →</a></p>
              </div>
              <div className="contact-card" style={{ borderTopColor: "#0e7490" }}>
                <h4 style={{ color: "#0e7490" }}>Mumbai Office</h4>
                <p>{addrM}</p>
                <p><a href={mapsM} target="_blank" rel="noreferrer">View on Google Maps →</a></p>
              </div>
              <div className="contact-card" style={{ borderTopColor: "#d97706" }}>
                <h4 style={{ color: "#d97706" }}>Call</h4>
                <p><a href={"tel:" + phone1.replace(/\s/g,)}>{phone1}</a><br /><a href={"tel:" + phone2.replace(/\s/g,)}>{phone2}</a></p>
              </div>
              <div className="contact-card" style={{ borderTopColor: "#7c3aed" }}>
                <h4 style={{ color: "#7c3aed" }}>Online</h4>
                <p><a href={"mailto:" + email}>{email}</a></p>
                <p>
                  <a href={setting(s, "instagram", "#")} target="_blank" rel="noreferrer">Instagram</a> •{" "}
                  <a href={setting(s, "facebook", "#")} target="_blank" rel="noreferrer">Facebook</a> •{" "}
                  <a href={setting(s, "youtube", "#")} target="_blank" rel="noreferrer">YouTube</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
