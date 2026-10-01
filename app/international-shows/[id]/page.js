import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import ShowMedia from "../../../components/ShowMedia";
import Reveal from "../../../components/Reveal";
import { supabasePublic } from "../../../lib/supabaseServer";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { data } = await supabasePublic().from("international_shows").select("id").eq("status", "published");
    return (data || []).map((s) => ({ id: s.id }));
  } catch {
    return [];
  }
}

async function getShow(id) {
  try {
    const { data, error } = await supabasePublic()
      .from("international_shows")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const show = await getShow(params.id);
  if (!show) return { title: "Show not found" };
  return {
    title: show.title,
    description: show.summary || `Samridhi Films & Television international show in ${show.country || "abroad"}.`,
    openGraph: {
      title: show.title,
      description: show.summary || "",
      images: show.cover_image ? [{ url: show.cover_image }] : undefined,
    },
  };
}

export default async function InternationalShowPage({ params }) {
  const show = await getShow(params.id);
  if (!show) notFound();
  const loc = [show.city, show.country].filter(Boolean).join(", ");

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        {show.cover_image && <img className="hero-bg" src={show.cover_image} alt={show.title} />}
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">{show.country || "International"} · Show</span></Reveal>
          <Reveal delay={1}><h1>{show.title}</h1></Reveal>
          <Reveal delay={2}>
            <p className="sub">
              {loc}
              {show.show_date ? ` · ${new Date(show.show_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container" style={{ maxWidth: 920 }}>
          <Reveal>
            <Link href="/international-shows" className="back-link">← All international shows</Link>
          </Reveal>
          {show.summary && <Reveal><p className="lead" style={{ marginTop: 18 }}>{show.summary}</p></Reveal>}
          {show.highlights && <Reveal><div className="article-body" style={{ padding: 0 }}><p>{show.highlights}</p></div></Reveal>}
          <Reveal><ShowMedia show={show} /></Reveal>
          <Reveal>
            <div className="center" style={{ marginTop: 54 }}>
              <Link className="btn btn-primary" href="/contact">Take Our Shows to Your City <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
