import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { supabasePublic } from "../../lib/supabaseServer";

export const revalidate = 60;

export const metadata = {
  title: "Blog",
  description: "Stories, updates and behind-the-scenes from Samridhi Films & Television events across India.",
};

export default async function BlogIndex() {
  let posts = [];
  try {
    const sb = supabasePublic();
    const { data } = await sb.from("posts").select("title,slug,excerpt,cover_image,published_at")
      .eq("status", "published").order("published_at", { ascending: false });
    posts = data || [];
  } catch { /* ignore */ }

  return (
    <>
      <SiteHeader />
      <section className="section">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Blog</span>
            <h2 className="h2">Stories &amp; Updates</h2>
            <p className="lead">Event highlights, artist news and planning tips from our team.</p>
          </div>
          {posts.length === 0 ? (
            <p className="lead center" style={{ marginTop: 40 }}>No posts yet — our first stories are on the way.</p>
          ) : (
            <div className="blog-grid">
              {posts.map((p) => (
                <Link className="post-card" key={p.slug} href={`/blog/${p.slug}`}>
                  {p.cover_image && <img src={p.cover_image} alt={p.title} loading="lazy" />}
                  <div className="body">
                    <span className="date">{p.published_at ? new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                    <span className="read">Read more →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
