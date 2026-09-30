import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { getClients } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Our Clients",
  description: "Government bodies, corporates and brands that have trusted Samridhi Films & Television with their events.",
};

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#ff6f00,#7b1fa2)" }}>
        <img className="hero-bg" src="/images/fb-performer-big-audience.jpg" alt="Corporate event audience" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Clients</span>
          <h1>Trusted by Leading Organisations</h1>
          <p className="sub">Government departments, corporates and brands across India.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {clients.length === 0 ? (
            <p className="lead center">Our client list is being updated — check back soon.</p>
          ) : (
            <div className="clients-wall">
              {clients.map((cl) => (
                <span key={cl.id} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {cl.logo_url ? (
                    <img src={cl.logo_url} alt={cl.name} style={{ maxHeight: 44, maxWidth: 150, objectFit: "contain" }} loading="lazy" />
                  ) : (
                    <span className="client-wordmark">{cl.name}</span>
                  )}
                  {cl.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
                </span>
              ))}
            </div>
          )}
          <div className="center" style={{ marginTop: 44 }}>
            <Link className="btn btn-primary" href="/contact">Work With Us</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
