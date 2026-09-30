import { revalidatePath } from "next/cache";

export async function POST(request) {
  const { secret, paths } = await request.json().catch(() => ({}));
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: "Invalid secret" }, { status: 401 });
  }
  const list = Array.isArray(paths) && paths.length ? paths : ["/", "/blog"];
  for (const p of list) revalidatePath(p, "page");
  return Response.json({ ok: true, revalidated: list });
}
