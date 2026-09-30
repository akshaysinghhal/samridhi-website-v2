import { NextResponse } from "next/server";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// Authenticated draft preview for blog posts.
//
// The admin UI calls this with fetch (which attaches the Supabase session as a
// Bearer token — something a plain <a> link cannot do). We verify the admin
// session server-side, set a short-lived httpOnly preview cookie, and return
// the public URL; the client then opens it in a new tab. The cookie travels
// with the new tab because it is same-origin.
//
// No shared secret is ever exposed to the browser.
export async function GET(req) {
  const user = await verifyAdmin(req);
  const denied = authedJson(user);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  // Only allow previewing slugs that actually exist in posts (no open redirect).
  const { data: post } = await adminDb()
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const res = NextResponse.json({ url: `/blog/${slug}` });
  res.cookies.set("sb_preview", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
  return res;
}
