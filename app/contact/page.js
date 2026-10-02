import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import LeadForm from "../../components/LeadForm";
import Reveal from "../../components/Reveal";
import { getSettings, setting } from "../../lib/db";
import { getAddresses, mapLink } from "../../lib/addresses";

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
  const addresses = getAddresses(s);
  const wa = setting(s, "whatsapp", "919602228846");

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/ig-guests-celebrating.jpg" alt="Guests celebrating" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Contact</span></Reveal>
          <Reveal delay={1}><h1>Let&apos;s Create Something Amazing</h1></Reveal>
          <Reveal delay={2}><p className="sub">Planning an event? Let our team understand your requirement and create the right event solution.</p></Reveal>
          <Reveal delay={3}>
            <div className="hero-ctas" style={{ marginTop: 30 }}>
              <a className="btn btn-primary" href={"tel:" + phone1.replace(/\s/g, "")}>Call Our Team</a>
              <a className="btn btn-outline" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp Us</a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section contact-band">
        <div className="container">
          <Reveal>
            <span className="eyebrow">Enquire</span>
            <h2 className="h2">Let&apos;s Plan Your Celebration</h2>
            <p className="lead">A senior planner will call you back within one working day.</p>
          </Reveal>
          <div className="contact-grid">
            <Reveal>
              <div className="contact-lines">
                {addresses.map((a, i) => (
                  <div className="contact-line" key={i}>
                    <h4>{a.label || "Office"}</h4>
                    <p>{a.address}</p>
                    <p style={{ marginTop: 8 }}><a href={mapLink(a)} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>View on Google Maps →</a></p>
                  </div>
                ))}
                <div className="contact-line">
                  <h4>Call</h4>
                  <p>
                    <a href={"tel:" + phone1.replace(/\s/g, "")}>{phone1}</a>
                    {"  ·  "}
                    <a href={"tel:" + phone2.replace(/\s/g, "")}>{phone2}</a>
                  </p>
                </div>
                <div className="contact-line">
                  <h4>Email &amp; Social</h4>
                  <p><a href={"mailto:" + email}>{email}</a></p>
                  <p style={{ marginTop: 8 }}>
                    <a href={setting(s, "instagram", "#")} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>Instagram</a>
                    {"  ·  "}
                    <a href={setting(s, "facebook", "#")} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>Facebook</a>
                    {"  ·  "}
                    <a href={setting(s, "youtube", "#")} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>YouTube</a>
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <LeadForm type="contact" />
            </Reveal>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
