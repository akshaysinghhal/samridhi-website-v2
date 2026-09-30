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

  const { paths } = await req.json().catch(() => ({}));
  const list = Array.isArray(paths) && paths.length ? paths : ["/", "/blog"];
  const safe = list
    .filter((p) => typeof p === "string" && p.startsWith("/") && !p.includes(".."))
    .slice(0, 20);
  for (const p of safe) {
    try { revalidatePath(p, "page"); } catch { /* ignore one bad path */ }
  }
  return Response.json({ ok: true, revalidated: safe });
}
