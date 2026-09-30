import Link from "next/link";
import CoupleCard from "./CoupleCard";
import Reveal from "./Reveal";
import { getCoupleStories } from "../lib/db";
import { getContentMap, c } from "../lib/content";

// Home-page Client Stories section. Only real, published stories are shown —
// placeholder entries are never presented as testimonials.
export default async function CoupleStories() {
  let stories = [];
  let map = {};
  try {
    [stories, map] = await Promise.all([getCoupleStories({ home: true }), getContentMap()]);
  } catch {
    return null;
  }
  const real = stories.filter((s) => !s.is_placeholder);
  if (!real.length) return null;

  const eyebrow = c(map, "home", "couples", "eyebrow") || "Client Stories";
  const title = c(map, "home", "couples", "title") || "Stories From Our Celebrations";

  return (
    <section className="section story-band">
      <div className="container">
        <Reveal>
          <div className="center">
            <span className="eyebrow"><span className="sec-num">08</span> {eyebrow}</span>
            <h2 className="h2">{title}</h2>
          </div>
        </Reveal>
        <div className="couple-grid">
          {real.map((s, i) => (
            <Reveal key={s.id} delay={i % 3}>
              <CoupleCard story={s} />
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="center" style={{ marginTop: 40 }}>
            <Link className="btn btn-dark" href="/couple-stories">Watch All Stories</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
