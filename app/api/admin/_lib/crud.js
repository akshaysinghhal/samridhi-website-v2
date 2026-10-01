import { revalidatePath } from "next/cache";
import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

// Shared factory for standard admin collection/item routes.
// Usage in app/api/admin/<name>/route.js:
//   import { makeCollection, pickFields } from "../_lib/crud";
//   const FIELDS = ["title", "sort", ...];
//   export const { GET, POST } = makeCollection({ table: "events", key: "events", map: (b) => pickFields(b, FIELDS) });
// Usage in app/api/admin/<name>/[id]/route.js:
//   export const { PUT, DELETE } = makeItem({ table: "events", map: (b) => pickFields(b, FIELDS) });

export function refresh() {
  try { revalidatePath("/", "layout"); } catch { /* ignore */ }
}

// Best-effort audit/revision logging — never breaks the mutation if it fails.
export async function logWrite({ table, entityId, action, actor, before, after }) {
  try {
    const db = adminDb();
    const diff = {};
    if (before && after) {
      for (const k of Object.keys(after)) {
        if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) diff[k] = { from: before[k] ?? null, to: after[k] ?? null };
      }
    }
    await db.from("audit_log").insert({
      actor: actor || "",
      action,
      entity: table,
      entity_id: String(entityId || ""),
      diff: action === "create" ? after : diff,
    });
    if ((action === "update" || action === "delete") && before) {
      await db.from("revisions").insert({
        entity: table,
        entity_id: String(entityId || ""),
        snapshot: before,
        author: actor || "",
      });
    }
  } catch { /* logging must never fail the request */ }
}

export function pickFields(b, fields) {
  const o = {};
  for (const f of fields) if (b[f] !== undefined) o[f] = b[f];
  return o;
}

export function makeCollection({ table, key, orderBy, map }) {
  const cols = orderBy || [["sort", "asc"], ["created_at", "desc"]];

  async function GET(request) {
    const user = await verifyAdmin(request);
    const denied = authedJson(user);
    if (denied) return denied;
    let q = adminDb().from(table).select("*");
    for (const [c, d] of cols) q = q.order(c, { ascending: d !== "desc" });
    const { data, error } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ [key]: data });
  }

  async function POST(request) {
    const user = await verifyAdmin(request);
    const denied = authedJson(user);
    if (denied) return denied;
    const b = await request.json().catch(() => ({}));
    const row = map ? map(b) : b;
    const { data, error } = await adminDb().from(table).insert(row).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await logWrite({ table, entityId: data.id, action: "create", actor: user.email, before: null, after: data });
    refresh();
    return Response.json({ item: data });
  }

  return { GET, POST };
}

export function makeItem({ table, map }) {
  async function PUT(request, { params }) {
    const user = await verifyAdmin(request);
    const denied = authedJson(user);
    if (denied) return denied;
    const b = await request.json().catch(() => ({}));
    const row = map ? map(b) : { ...b };
    delete row.id;
    delete row.created_at;
    const { data: before } = await adminDb().from(table).select("*").eq("id", params.id).single();
    const { data, error } = await adminDb().from(table).update(row).eq("id", params.id).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await logWrite({ table, entityId: params.id, action: "update", actor: user.email, before, after: data });
    refresh();
    return Response.json({ item: data });
  }

  async function DELETE(request, { params }) {
    const user = await verifyAdmin(request);
    const denied = authedJson(user);
    if (denied) return denied;
    const { data: before } = await adminDb().from(table).select("*").eq("id", params.id).single();
    const { error } = await adminDb().from(table).delete().eq("id", params.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await logWrite({ table, entityId: params.id, action: "delete", actor: user.email, before, after: null });
    refresh();
    return Response.json({ ok: true });
  }

  return { PUT, DELETE };
}
