import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson } from "../../../../lib/adminAuth";

// Authenticated on-demand revalidation for the admin UI.
//
// Verifies the admin session server-side, so the browser never needs to know
// the REVALIDATE_SECRET. The public /api/revalidate endpoint (secret-based,
// for external webhooks/CI) is untouched.
export async function POST(req) {
  const user = await verifyAdmin(req);
  const denied = authedJson(user);
  if (denied) return denied;

  const { paths, type } = await req.json().catch(() => ({}));
  const list = Array.isArray(paths) && paths.length ? paths : ["/", "/blog"];
  const safe = list
    .filter((p) => typeof p === "string" && p.startsWith("/") && !p.includes(".."))
    .slice(0, 20);
  // type "layout" revalidates the shared layout too (theme colours, header,
  // footer); otherwise only the pages themselves.
  const rtype = type === "layout" ? "layout" : "page";
  for (const p of safe) {
    try { revalidatePath(p, rtype); } catch { /* ignore one bad path */ }
  }
  return Response.json({ ok: true, revalidated: safe, type: rtype });
}
