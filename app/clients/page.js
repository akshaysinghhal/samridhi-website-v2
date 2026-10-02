import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import { getContentMap, ci } from "../../lib/content";
import { getClients } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Our Clients",
  description: "Government bodies, corporates and brands that have trusted Samridhi Films & Television with their events.",
};

export default async function ClientsPage() {
  const [map, clients] = await Promise.all([getContentMap(), getClients()]);

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src={ci(map, "clients", "hero", "image") || "/images/fb-performer-big-audience.jpg"} alt="Corporate event audience" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Clients</span></Reveal>
          <Reveal delay={1}><h1>Trusted by Leading Organisations</h1></Reveal>
          <Reveal delay={2}><p className="sub">Government departments, corporates and brands across India.</p></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {clients.length === 0 ? (
            <p className="lead center">Our client list is being updated — check back soon.</p>
          ) : (
            <Reveal>
              <div className="logo-wall">
                {clients.map((cl) => (
                  cl.logo_url ? (
                    <img key={cl.id} className="limg" src={cl.logo_url} alt={cl.name} loading="lazy" />
                  ) : (
                    <span key={cl.id} className="lword">{cl.name}</span>
                  )
                ))}
              </div>
            </Reveal>
          )}
          <Reveal>
            <div className="center" style={{ marginTop: 52 }}>
              <p className="lead" style={{ margin: "0 auto 26px" }}>Join the organisations that trust us with their most important evenings.</p>
              <Link className="btn btn-primary" href="/contact">Work With Us <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
