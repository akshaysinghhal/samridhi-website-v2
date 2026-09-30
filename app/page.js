import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import LeadForm from "../components/LeadForm";
import CoupleStories from "../components/CoupleStories";
import { getContentMap, c } from "../lib/content";
import {
  getSettings, setting, getServices, getArtists, getEvents,
  getClients, getInternationalShows, getPressClippings, getTestimonials,
} from "../lib/db";

export const revalidate = 60;

const GRADS = [
  "linear-gradient(135deg,#7c3aed,#6d28d9)",
  "linear-gradient(135deg,#6d28d9,#d97706)",
  "linear-gradient(135deg,#0e7490,#7c3aed)",
  "linear-gradient(135deg,#d97706,#ffc107)",
];

const FALLBACK_STATS = [
  { value: "1999", label: "Serving Since" },
  { value: "1000+", label: "Events Delivered" },
  { value: "20+", label: "Years in Event Planning" },
];

export default async function Home() {
  const [map, s] = await Promise.all([getContentMap(), getSettings()]);
  const [services, artistsF, eventsF, clients, intl, press, testimonials] = await Promise.all([
    getServices(),
    getArtists({ featured: true, limit: 12 }),
    getEvents({ featured: true, limit: 6 }),
    getClients(),
    getInternationalShows(),
    getPressClippings(),
    getTestimonials(),
  ]);

  const artists = artistsF.length ? artistsF : await getArtists({ limit: 10 });
  const events = eventsF.length ? eventsF : await getEvents({ limit: 6 });
  const stats = Array.isArray(setting(s, "stats", null)) && setting(s, "stats", []).length
    ? setting(s, "stats", [])
    : FALLBACK_STATS;

  const heroVideo = setting(s, "hero_video", "");
  const heroPoster = setting(s, "hero_poster", "/images/hero-concert.jpg");
  const wa = setting(s, "whatsapp", "919602228846");
  const waMsg = encodeURIComponent(setting(s, "whatsapp_msg", "Hi Samridhi Films! I want to plan an event."));
  const show = intl[0];
  const pressStrip = press.slice(0, 4);

  const steps = [1, 2, 3, 4, 5].map((n) => ({
    title: c(map, "home", "steps", `step${n}_title`),
    desc: c(map, "home", "steps", `step${n}_desc`),
  }));

  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="hero">
        {heroVideo ? (
          <video className="hero-bg" autoPlay muted loop playsInline poster={heroPoster}>
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <img className="hero-bg" src={heroPoster} alt="Celebration by Samridhi Films & Television" />
        )}
        <div className="container hero-inner">
          <span className="eyebrow" style={{ color: "#ffe082" }}>{c(map, "home", "hero", "eyebrow")}</span>
          <h1>{c(map, "home", "hero", "title")}</h1>
          <p className="sub">{c(map, "home", "hero", "subtitle")}</p>
          <div className="hero-ctas">
            <Link className="btn btn-white" href="/contact">{c(map, "home", "hero", "cta_primary")}</Link>
            <Link className="btn btn-outline" href="/contact">Get a Quote</Link>
            <a className="btn btn-outline" href={`https://wa.me/${wa}?text=${waMsg}`} target="_blank" rel="noreferrer">WhatsApp Now</a>
          </div>
          <div className="trust-chips">
            <span className="chip">★ Since 1999</span>
            <span className="chip">★ 20+ Years in Event Planning</span>
            <span className="chip">★ 1000+ Events</span>
            <span className="chip"><img src="/images/iso-badge.png" alt="ISO 9001:2015" /> ISO 9001:2015</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section stats-band">
        <div className="container">
          <div className="stats-grid">
            {stats.map((st, i) => (
              <div key={i}>
                <div className="num">{st.value}</div>
                <div className="lbl">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section" id="services">
        <div className="container">
          <div className="center">
            <span className="eyebrow">What We Do</span>
            <h2 className="h2">One Team, Every Celebration</h2>
            <p className="lead">Eight signature services — pick your flavour, we handle the rest.</p>
          </div>
          <div className="services-grid">
            {services.map((sv, i) => (
              <Link key={sv.slug} href={`/services/${sv.slug}`} className="service-tile"
                style={{ background: GRADS[i % GRADS.length], textDecoration: "none" }}>
                <div className="icon">{sv.icon || "✨"}</div>
                <h3>{sv.title}</h3>
                <p>{sv.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ARTISTS */}
      <section className="section artist-band" id="artists">
        <div className="container">
          <span className="eyebrow">Entertainment &amp; Artists</span>
          <h2 className="h2" style={{ color: "#fff" }}>Nights They&apos;ll Never Forget</h2>
          <p className="lead">Singers, folk troupes, bands &amp; anchors — curated and stage-managed by us.</p>
          <div className="artist-cards">
            {artists.map((a, i) => (
              <Link className="artist-card" key={a.id || a.slug || a.name}
                href={a.slug ? `/artists/${a.slug}` : "/artists"}
                style={{ textDecoration: "none" }}>
                {a.image_url ? (
                  <img src={a.image_url} alt={a.name} loading="lazy" />
                ) : (
                  <div className="aimg" style={{ background: GRADS[i % GRADS.length] }}>
                    {a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div className="ainfo">
                  <h4>{a.name}</h4>
                  {a.category && <span className="acat">{a.category}</span>}
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/artists">Meet All Artists</Link>
            <Link className="btn btn-outline" href="/contact">Book an Artist</Link>
          </div>
        </div>
      </section>

      {/* FEATURED PORTFOLIO */}
      <section className="section" id="portfolio">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Portfolio</span>
            <h2 className="h2">Events That Speak for Themselves</h2>
            <p className="lead">A glimpse of the stages, crowds and celebrations we&apos;ve produced.</p>
          </div>
          <div className="wedding-grid">
            {events.map((e) => (
              <Link key={e.id} href={`/portfolio/${e.slug}`} className="wedding-card" style={{ textDecoration: "none", color: "inherit" }}>
                {e.cover_image && <img src={e.cover_image} alt={e.title} loading="lazy" />}
                <div className="body">
                  {e.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
                  <h3>{e.title}</h3>
                  {(e.location || e.category) && (
                    <div className="wmeta">{[e.category, e.location].filter(Boolean).join(" • ")}</div>
                  )}
                  {e.description && <p>{e.description.slice(0, 110)}{e.description.length > 110 ? "…" : ""}</p>}
                </div>
              </Link>
            ))}
          </div>
          <div className="center" style={{ marginTop: 34 }}>
            <Link className="btn btn-dark" href="/portfolio">View Full Portfolio</Link>
          </div>
        </div>
      </section>

      {/* COUPLE STORIES */}
      <CoupleStories />

      {/* APPROACH / STEPS */}
      <section className="section steps-band">
        <div className="container">
          <div className="center">
            <span className="eyebrow" style={{ color: "#d97706" }}>{c(map, "home", "steps", "eyebrow")}</span>
            <h2 className="h2">{c(map, "home", "steps", "title")}</h2>
            <p className="lead">{c(map, "home", "steps", "subtitle")}</p>
          </div>
          <div className="steps">
            {steps.map((st, i) => (
              <div className="step-card" key={i}>
                <div className="step-num">{i + 1}</div>
                <h3>{st.title}</h3>
                <p>{st.desc}</p>
              </div>
            ))}
          </div>
          <div className="center" style={{ marginTop: 36 }}>
            <Link className="btn btn-primary" href="/contact">Start With Step 1</Link>
          </div>
        </div>
      </section>

      {/* CLIENTS */}
      {clients.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="center">
              <span className="eyebrow">Clients</span>
              <h2 className="h2">Trusted by Leading Organisations</h2>
            </div>
            <div className="marquee"><div className="marquee-track">
              {[...clients, ...clients].map((cl, i) => (
                <span key={cl.id + "-" + i} className="marquee-item">
                  {cl.name}
                  {cl.is_placeholder && <span className="placeholder-badge" style={{ marginLeft: 8 }}>Placeholder</span>}
                </span>
              ))}
            </div></div>
            <div className="center" style={{ marginTop: 26 }}>
              <Link className="btn btn-dark" href="/clients">All Clients</Link>
            </div>
          </div>
        </section>
      )}

      {/* INTERNATIONAL TEASER */}
      {show && (
        <section className="section" style={{ background: "#fff" }}>
          <div className="container">
            <div className="about-grid">
              <div>
                {show.cover_image && <img className="main" src={show.cover_image} alt={show.title} loading="lazy" />}
              </div>
              <div>
                <span className="eyebrow">International Shows</span>
                <h2 className="h2">Taking Indian Entertainment Beyond Borders</h2>
                <h3 style={{ margin: "6px 0 10px" }}>{show.title}</h3>
                <p className="lead">{show.summary}</p>
                <div style={{ marginTop: 24 }}>
                  <Link className="btn btn-primary" href="/international-shows">Explore International Shows</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRESS STRIP */}
      {pressStrip.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="center">
              <span className="eyebrow">Press</span>
              <h2 className="h2">In the News</h2>
            </div>
            <div className="press-grid">
              {pressStrip.map((p) => (
                <figure key={p.id}>
                  <img src={p.image_url} alt={p.headline || p.publication || "Press clipping"} loading="lazy" />
                  <figcaption>
                    {p.is_placeholder && <span className="placeholder-badge">Placeholder</span>}{" "}
                    {[p.publication, p.headline].filter(Boolean).join(" — ")}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="center" style={{ marginTop: 30 }}>
              <Link className="btn btn-dark" href="/press">All Press Coverage</Link>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="section" style={{ background: "#fff" }}>
          <div className="container">
            <div className="center">
              <span className="eyebrow">Testimonials</span>
              <h2 className="h2">What Our Clients Say</h2>
            </div>
            <div className="testi-grid">
              {testimonials.slice(0, 3).map((t) => (
                <div className="testi-card" key={t.id}>
                  <p className="tquote">“{t.quote}”</p>
                  <p className="tauthor">{t.author_name}{t.company ? `, ${t.company}` : ""}</p>
                </div>
              ))}
            </div>
            <div className="center" style={{ marginTop: 30 }}>
              <Link className="btn btn-dark" href="/testimonials">All Testimonials</Link>
            </div>
          </div>
        </section>
      )}

      {/* CLOSING CTA + LEAD FORM */}
      <section className="section" id="contact" style={{ background: "linear-gradient(135deg,#fff5f8,#fff9f3)" }}>
        <div className="container">
          <div className="center">
            <span className="eyebrow" style={{ color: "#d97706" }}>Get in Touch</span>
            <h2 className="h2">{c(map, "home", "cta", "title")}</h2>
            <p className="lead">{c(map, "home", "cta", "subtitle")}</p>
          </div>
          <div className="contact-grid">
            <div className="contact-cards">
              <div className="contact-card"><h4>Call Us</h4><p><a href={"tel:" + String(setting(s, "phone1", "+91 96022 28846")).replace(/\s/g,)}>{setting(s, "phone1", "+91 96022 28846")}</a> • <a href={"tel:" + String(setting(s, "phone2", "+91 77372 89938")).replace(/\s/g,)}>{setting(s, "phone2", "+91 77372 89938")}</a></p></div>
              <div className="contact-card" style={{ borderTopColor: "#0e7490" }}><h4 style={{ color: "#0e7490" }}>Email</h4><p><a href={"mailto:" + setting(s, "email", "samridhifilms@yahoo.co.in")}>{setting(s, "email", "samridhifilms@yahoo.co.in")}</a></p></div>
              <div className="contact-card" style={{ borderTopColor: "#d97706" }}><h4 style={{ color: "#d97706" }}>Visit</h4><p>{setting(s, "address_chittorgarh", "")}</p></div>
              <div className="contact-card" style={{ borderTopColor: "#7c3aed" }}><h4 style={{ color: "#7c3aed" }}>Follow</h4><p><a href={setting(s, "instagram", "#")} target="_blank" rel="noreferrer">Instagram</a> • <a href={setting(s, "facebook", "#")} target="_blank" rel="noreferrer">Facebook</a> • <a href={setting(s, "youtube", "#")} target="_blank" rel="noreferrer">YouTube</a></p></div>
            </div>
            <LeadForm type="quote" compact />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
