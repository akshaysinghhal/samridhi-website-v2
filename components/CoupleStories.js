import Link from "next/link";
import CoupleCard from "./CoupleCard";
import { getCoupleStories } from "../lib/db";
import { getContentMap, c } from "../lib/content";

// Home-page Couple Stories section (master brief §5A). Hidden when no published stories.
export default async function CoupleStories() {
  let stories = [];
  let map = {};
  try {
    [stories, map] = await Promise.all([getCoupleStories({ home: true }), getContentMap()]);
  } catch {
    return null;
  }
  if (!stories.length) return null;

  const eyebrow = c(map, "home", "couples", "eyebrow") || "COUPLE STORIES";
  const title = c(map, "home", "couples", "title") || "HEAR IT STRAIGHT FROM OUR COUPLES";

  return (
    <section className="section couple-section">
      <div className="container">
        <div className="center">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="h2">{title}</h2>
        </div>
        <div className="couple-grid">
          {stories.map((s) => (
            <CoupleCard key={s.id} story={s} />
          ))}
        </div>
        <div className="center" style={{ marginTop: 34 }}>
          <Link className="btn btn-dark" href="/couple-stories">Watch All Stories</Link>
        </div>
      </div>
    </section>
  );
}
