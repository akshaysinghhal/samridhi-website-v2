import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import EventsTabs from "../../components/EventsTabs";
import Reveal from "../../components/Reveal";
import { getEvents } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Events — Upcoming & Past",
  description:
    "Upcoming melas, celebrity shows and celebrations by Samridhi Films & Television — plus a look back at past events across Rajasthan and India.",
};

// Today in IST (the business's timezone) as YYYY-MM-DD.
const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default async function EventsPage() {
  const all = await getEvents({ limit: 200 });
  const today = todayIST();
  const upcoming = all
    .filter((e) => e.event_date && e.event_date >= today)
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1)); // soonest first
  const past = all.filter((e) => !e.event_date || e.event_date < today); // newest first (already sorted desc)

  const heroImg = upcoming[0]?.cover_image || "/images/fb-performer-big-audience.jpg";

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src={heroImg} alt="Samridhi Films & Television events" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Events</span></Reveal>
          <Reveal delay={1}><h1>Upcoming &amp; Past Events</h1></Reveal>
          <Reveal delay={2}>
            <p className="sub">
              Melas, celebrity nights and celebrations we&apos;re bringing to you — and the ones we&apos;ve already delivered.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <EventsTabs upcoming={upcoming} past={past} />
          <Reveal>
            <div className="center" style={{ marginTop: 48 }}>
              <Link className="btn btn-primary" href="/contact">
                Plan Your Event With Us <span className="arr">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
