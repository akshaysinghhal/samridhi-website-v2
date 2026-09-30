import ReactMarkdown from "react-markdown";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import { supabasePublic } from "../../../lib/supabaseServer";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const sb = supabasePublic();
    const { data } = await sb.from("posts").select("slug").eq("status", "published");
    return (data || []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// When the sb_preview cookie is present (set by the authenticated
// /api/admin/preview endpoint), drafts are visible too so unpublished posts
// can be previewed by admins.
function previewing() {
  try { return cookies().get("sb_preview")?.value === "1"; } catch { return false; }
}

async function getPost(slug) {
  try {
    const sb = supabasePublic();
    let q = sb.from("posts").select("*").eq("slug", slug);
    if (!previewing()) q = q.eq("status", "published");
    const { data, error } = await q.single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post not found" };
  const og = post.og_image || post.cover_image;
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    keywords: post.keywords ? post.keywords.split(",").map((k) => k.trim()) : undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || "",
      type: "article",
      publishedTime: post.published_at || undefined,
      images: og ? [{ url: og }] : undefined,
    },
  };
}

function youTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  const yt = youTubeId(post.video_url);
  const isPreview = previewing() && post.status !== "published";

  return (
    <>
      {isPreview && (
        <div style={{ background: "#fff3e0", color: "#8a4b00", textAlign: "center", padding: "10px 16px", fontSize: 14, fontWeight: 700, borderBottom: "2px solid #f59e0b" }}>
          Preview mode — this post is a <b>{post.status}</b> draft and is not visible to the public.
        </div>
      )}
      <SiteHeader />
      <div className="article-hero">
        {post.cover_image && <img src={post.cover_image} alt={post.title} />}
        <div className="container"><div className="inner">
          <span className="eyebrow" style={{ color: "#ffe082" }}>Blog</span>
          <h1>{post.title}</h1>
          <p style={{ opacity: 0.9 }}>
            {post.author || "Samridhi Films & Television"}
            {post.published_at && " • " + new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div></div>
      </div>
      <article className="article-body">
        <ReactMarkdown>{post.content || ""}</ReactMarkdown>
        {post.gallery && post.gallery.length > 0 && (
          <div className="article-gallery">
            {post.gallery.map((g) => <img key={g} src={g} alt={post.title} loading="lazy" />)}
          </div>
        )}
        {yt ? (
          <div className="video-wrap">
            <iframe src={`https://www.youtube.com/embed/${yt}`} title={post.title} allowFullScreen />
          </div>
        ) : post.video_url ? (
          <p><a className="btn btn-dark" href={post.video_url} target="_blank" rel="noreferrer">Watch the video</a></p>
        ) : null}
      </article>
      <SiteFooter />
    </>
  );
}
