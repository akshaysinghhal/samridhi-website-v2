import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import LeadForm from "../components/LeadForm";
import CoupleStories from "../components/CoupleStories";
import Reveal from "../components/Reveal";
import HeroMedia from "../components/HeroMedia";
import TestimonialCard from "../components/TestimonialCard";
import { getContentMap, c } from "../lib/content";
import {
  getSettings, setting, getServices, getArtists, getEvents,
  getClients, getInternationalShows, getPressClippings, getTestimonials,
} from "../lib/db";

export const revalidate = 60;

const FALLBACK_STATS = [
  { value: "1999", label: "Since" },
  { value: "1000+", label: "Events Delivered" },
  { value: "20+", label: "Years of Experience" },
  { value: "ISO 9001:2015", label: "Certified" },
];

const WEDDING_POINTS = [
  "Wedding planning & coordination",
  "Destination weddings",
  "Sangeet, mehendi & choreography",
  "Celebrity artists & entertainment",
  "Décor & stage production",
  "Hospitality & guest management",
];

const STEP_FALLBACKS = [
  ["Share Your Vision", "Tell us the occasion, the scale and the feeling you want."],
  ["We Design & Propose", "Concepts, artists, décor and production — planned to the last detail."],
  ["You Relax, We Prepare", "One accountable team handles vendors, artists and logistics."],
  ["We Execute", "Show-calling, stage management and on-ground coordination."],
  ["You Celebrate", "You enjoy the evening. We make sure it is flawless."],
];

function svcImage(sv) {
  return sv.hero_image || sv.image_url || sv.cover_image || sv.image || "";
}

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
    ? setting(s, "stats", []).slice(0, 4)
    : FALLBACK_STATS;

  const heroVideo = setting(s, "hero_video", "");
  const heroVideoMobile = setting(s, "hero_video_mobile", "");
  const heroPoster = setting(s, "hero_poster", "/images/hero-concert.jpg");
  const wa = setting(s, "whatsapp", "919602228846");
  const waMsg = encodeURIComponent(setting(s, "whatsapp_msg", "Hi Samridhi Films! I want to plan an event."));
  const show = intl[0];
  const pressStrip = press.filter((p) => !p.is_placeholder).slice(0, 6);
  const pressFallback = pressStrip.length ? pressStrip : press.slice(0, 4);
  const videoTestimonials = (testimonials || []).filter((t) => t.video_url && String(t.video_url).trim()).slice(0, 4);

  const steps = [1, 2, 3, 4, 5].map((n, i) => ({
    title: c(map, "home", "steps", `step${n}_title`) || STEP_FALLBACKS[i][0],
    desc: c(map, "home", "steps", `step${n}_desc`) || STEP_FALLBACKS[i][1],
  }));

  const heroTitle = c(map, "home", "hero", "title") || "Creating Experiences. Delivering Excellence.";
  const [heroL1, heroL2] = heroTitle.split(/\.\s*/).filter(Boolean);

  return (
    <>
      <SiteHeader />

      {/* ============ HERO ============ */}
      <section className="hero">
        <HeroMedia
          video={heroVideo}
          mobileVideo={heroVideoMobile}
          poster={heroPoster}
          alt="A Samridhi Films & Television celebration — stage, lights and crowd"
        />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal>
            <span className="eyebrow">{c(map, "home", "hero", "eyebrow") || "Samridhi Films & Television — Since 1999"}</span>
          </Reveal>
          <Reveal delay={1}>
            <h1>
              {heroL1}.<br />
              <em>{(heroL2 || "Delivering Excellence").replace(/\.$/, "")}.</em>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="sub">{c(map, "home", "hero", "subtitle") || "You Just Think & We Will Manage It!"}</p>
          </Reveal>
          <Reveal delay={3}>
            <div className="hero-ctas">
              <Link className="btn btn-primary" href="/contact">
                {c(map, "home", "hero", "cta_primary") || "Plan Your Event"} <span className="arr">→</span>
              </Link>
              <Link className="btn btn-outline" href="/portfolio">Explore Our Work</Link>
            </div>
          </Reveal>
          <Reveal delay={3}>
            <div className="hero-meta">
              {stats.slice(0, 3).map((st, i) => (
                <div key={i}><b>{st.value}</b><span>{st.label}</span></div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={3}>
            <div className="hero-creds">
              <span className="hcred">
                <img src="/images/iso-badge.png" alt="ISO 9001:2015 certified" />
                <span className="hcred-tx">ISO 9001:2015 Certified</span>
              </span>
              <span className="hcred">
                <span className="hcred-gem">GeM</span>
                <span className="hcred-tx">GeM Registered</span>
              </span>
            </div>
          </Reveal>
        </div>
        <div className="scroll-hint" aria-hidden="true">Scroll<i /></div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="section" id="services" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <Reveal>
            <span className="eyebrow">Our Services</span>
            <h2 className="h2">One Team.<br />Every Celebration.</h2>
            <p className="lead">Eight specialised verticals, one accountable team — from the first concept note to the final applause.</p>
          </Reveal>
          <div className="svc-grid">
            {services.map((sv, i) => {
              const img = svcImage(sv);
              const size = i === 0 ? "svc-lg" : i <= 2 ? "svc-md" : i <= 5 ? "svc-sm" : "svc-md";
              return (
                <Reveal key={sv.slug || sv.id || i} delay={i % 3} className={`svc-card ${size}${img ? " has-img" : ""}`}>
                  <Link href={`/services/${sv.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%", justifyContent: "flex-end" }} aria-label={sv.title}>
                    {size === "svc-lg" && img ? (
                      <>
                        <img className="svc-img" src={img} alt={sv.title} loading="lazy" />
                        <span className="svc-shade" aria-hidden="true" />
                        <span className="svc-body">
                          <h3>{sv.title}</h3>
                          <p>{sv.summary}</p>
                          <span className="svc-link">Explore Service <span className="arr">→</span></span>
                        </span>
                      </>
                    ) : (
                      <>
                        <h3>{sv.title}</h3>
                        <p>{sv.summary}</p>
                        <span className="svc-link">Explore <span className="arr">→</span></span>
                      </>
                    )}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ ARTISTS ============ */}
      <section className="section artist-band" id="artists">
        <div className="container">
          <Reveal>
            <span className="eyebrow">Entertainment &amp; Artists</span>
            <h2 className="h2">Nights They&apos;ll<br />Never Forget</h2>
            <p className="lead">Singers, folk troupes, bands &amp; anchors — curated, contracted and stage-managed by us. Available for booking through Samridhi Films &amp; Television.</p>
          </Reveal>
          <div className="artist-rail">
            {artists.map((a) => (
              <Link
                key={a.id || a.slug || a.name}
                href={a.slug ? `/artists/${a.slug}` : "/artists"}
                className="artist-lux"
                aria-label={a.name}
              >
                {a.image_url ? (
                  <img src={a.image_url} alt={a.name} loading="lazy" />
                ) : (
                  <div className="aimg" aria-hidden="true">{a.category || "Artist"}</div>
                )}
                <span className="ashade">
                  <h4>{a.name}</h4>
                  {a.category && <span className="acat">{a.category}</span>}
                  <span className="aview">View Profile <span className="arr">→</span></span>
                </span>
              </Link>
            ))}
          </div>
          <Reveal>
            <div style={{ marginTop: 30, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/contact">Book an Artist <span className="arr">→</span></Link>
              <Link className="btn btn-outline" href="/artists">Meet All Artists</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PORTFOLIO ============ */}
      <section className="section" id="portfolio" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">Portfolio</span>
              <h2 className="h2">Events That Speak<br />for Themselves</h2>
              <p className="lead">Stages, crowds and celebrations we have produced — across India and beyond.</p>
            </div>
          </Reveal>
          {events.length > 0 && (
            <>
              <Reveal>
                <Link className="pf-feature" href={`/portfolio/${events[0].slug}`}>
                  <span className="pf-media">
                    {events[0].cover_image && <img src={events[0].cover_image} alt={events[0].title} loading="lazy" />}
                  </span>
                  <span className="pf-body">
                    <span className="pf-kicker">Featured Project</span>
                    <h3>{events[0].title}</h3>
                    {(events[0].location || events[0].category) && (
                      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "var(--terracotta)", fontWeight: 800 }}>
                        {[events[0].category, events[0].location].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {events[0].description && <p>{events[0].description.slice(0, 160)}{events[0].description.length > 160 ? "…" : ""}</p>}
                    <span className="pf-link">Explore Project <span className="arr">→</span></span>
                  </span>
                </Link>
              </Reveal>
              <div className="pf-grid">
                {events.slice(1, 6).map((e, i) => (
                  <Reveal key={e.id} delay={i % 3} className={`pf-card`}>
                    <Link href={`/portfolio/${e.slug}`} style={{ position: "absolute", inset: 0 }} aria-label={e.title}>
                      {e.cover_image && <img src={e.cover_image} alt={e.title} loading="lazy" />}
                      <span className="pf-shade">
                        {(e.category || e.location) && (
                          <span className="pf-meta">{[e.category, e.location].filter(Boolean).join(" · ")}</span>
                        )}
                        <h4>{e.title}</h4>
                        <span className="pf-view">View Project →</span>
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </>
          )}
          <Reveal>
            <div className="center" style={{ marginTop: 44 }}>
              <Link className="btn btn-dark" href="/portfolio">View Full Portfolio</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ WEDDING FEATURE ============ */}
      <section className="section" style={{ background: "var(--warm-white)" }}>
        <div className="container">
          <div className="wed-feature">
            <Reveal className="wed-media">
              <span className="wed-frame" aria-hidden="true" />
              <img className="main" src="/images/fb-floral-mandap-stage.jpg" alt="Floral mandap stage at a Samridhi wedding" loading="lazy" />
              <img className="inset" src="/images/ig-haldi-decor-collage.jpg" alt="Haldi décor details" loading="lazy" />
            </Reveal>
            <Reveal delay={1} className="wed-body">
              <span className="eyebrow">Weddings</span>
              <h2>Your Moments.<br /><em>Beautifully Managed.</em></h2>
              <hr className="gold-rule" />
              <p className="lead">From intimate family functions to grand destination weddings — décor, entertainment and complete coordination under one roof.</p>
              <ul className="wed-list">
                {WEDDING_POINTS.map((w) => <li key={w}>{w}</li>)}
              </ul>
              <Link className="btn btn-primary" href="/weddings">Plan Your Dream Wedding <span className="arr">→</span></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section className="section process-band">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">How It Works</span>
              <h2 className="h2">{c(map, "home", "steps", "title") || "From First Call to Final Applause"}</h2>
              <p className="lead">{c(map, "home", "steps", "subtitle") || "A simple, transparent process — refined over 20+ years and 1000+ events."}</p>
            </div>
          </Reveal>
          <div className="tl">
            {steps.map((st, i) => (
              <Reveal key={i} delay={i} className="tl-step">
                <span className="tl-dot" aria-hidden="true" />
                <h3>{st.title}</h3>
                <p>{st.desc}</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="center" style={{ marginTop: 54 }}>
              <Link className="btn btn-luxury" href="/contact">Start With Step 1 <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CLIENTS ============ */}
      {clients.length > 0 && (
        <section className="section" style={{ background: "var(--warm-white)" }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Clients</span>
                <h2 className="h2">Trusted by Leading Organisations</h2>
              </div>
            </Reveal>
            <Reveal delay={1}>
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
            <Reveal>
              <div className="center" style={{ marginTop: 40 }}>
                <Link className="btn btn-outline-terra" href="/clients">All Clients</Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ INTERNATIONAL ============ */}
      {show && (
        <section className="section" style={{ background: "var(--ivory)", paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="intl-split">
                <div className="intl-media">
                  {show.cover_image && <img src={show.cover_image} alt={show.title} loading="lazy" />}
                </div>
                <div className="intl-panel">
                  <span className="eyebrow">International Shows</span>
                  <h3>Taking Indian Entertainment Beyond Borders</h3>
                  <div className="intl-loc">{[show.city, show.country].filter(Boolean).join(", ") || "International"}</div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#fff" }}>{show.title}</p>
                  {show.summary && <p>{show.summary.slice(0, 200)}{show.summary.length > 200 ? "…" : ""}</p>}
                  <div>
                    <Link className="btn btn-luxury" href="/international-shows">Explore International Shows <span className="arr">→</span></Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ VIDEO TESTIMONIALS ============ */}
      {videoTestimonials.length > 0 && (
        <section className="section testi-band">
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Testimonials</span>
                <h2 className="h2">Hear It Straight From Our Clients</h2>
              </div>
            </Reveal>
            <div className="testi-video-grid">
              {videoTestimonials.map((t, i) => (
                <Reveal key={t.id} delay={i % 4}>
                  <TestimonialCard t={t} />
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="center" style={{ marginTop: 40 }}>
                <Link className="btn btn-luxury" href="/testimonials">All Testimonials</Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ PRESS ============ */}
      {pressFallback.length > 0 && (
        <section className="section" style={{ background: "var(--warm-white)" }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Press</span>
                <h2 className="h2">As Seen In</h2>
              </div>
            </Reveal>
            <div className="press-grid">
              {pressFallback.map((p, i) => (
                <Reveal key={p.id} delay={i % 3} className="press-clip">
                  <Link href="/press" style={{ textDecoration: "none" }} aria-label={p.headline || p.publication || "Press coverage"}>
                    <span className="pc-img">
                      <img src={p.image_url} alt={p.headline ? `${p.headline} — ${p.publication || "press"}` : `${p.publication || "Press"} clipping`} loading="lazy" />
                      <span className="pc-cap">
                        {p.publication && <span className="pc-pub">{p.publication}</span>}
                        <span className="pc-head">{p.headline || "Press coverage"}</span>
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="center" style={{ marginTop: 40 }}>
                <Link className="btn btn-dark" href="/press">All Press Coverage</Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ CLIENT STORIES ============ */}
      <CoupleStories />

      {/* ============ CONTACT ============ */}
      <section className="section contact-band" id="contact">
        <div className="container">
          <Reveal>
            <span className="eyebrow">Get in Touch</span>
            <h2 className="h2">{c(map, "home", "cta", "title") || "Let's Plan Your Celebration"}</h2>
            <p className="lead">{c(map, "home", "cta", "subtitle") || "Tell us about your event — a senior planner will call you back within one working day."}</p>
          </Reveal>
          <div className="contact-grid">
            <Reveal>
              <div className="contact-lines">
                <div className="contact-line">
                  <h4>Call</h4>
                  <p>
                    <a href={"tel:" + String(setting(s, "phone1", "+91 96022 28846")).replace(/\s/g, "")}>{setting(s, "phone1", "+91 96022 28846")}</a>
                    {"  ·  "}
                    <a href={"tel:" + String(setting(s, "phone2", "+91 77372 89938")).replace(/\s/g, "")}>{setting(s, "phone2", "+91 77372 89938")}</a>
                  </p>
                </div>
                <div className="contact-line">
                  <h4>Email</h4>
                  <p><a href={"mailto:" + setting(s, "email", "samridhifilms@yahoo.co.in")}>{setting(s, "email", "samridhifilms@yahoo.co.in")}</a></p>
                </div>
                <div className="contact-line">
                  <h4>Offices</h4>
                  <p>Chittorgarh · Mumbai</p>
                </div>
                <div className="contact-line">
                  <h4>Follow</h4>
                  <p>
                    <a href={setting(s, "instagram", "#")} target="_blank" rel="noreferrer">Instagram</a>
                    {"  ·  "}
                    <a href={setting(s, "facebook", "#")} target="_blank" rel="noreferrer">Facebook</a>
                    {"  ·  "}
                    <a href={setting(s, "youtube", "#")} target="_blank" rel="noreferrer">YouTube</a>
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <LeadForm type="quote" compact />
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
