import { verifyAdmin, authedJson, adminDb } from "../../../../lib/adminAuth";

const STATUSES = ["New", "Contacted", "Quote Sent", "Negotiation", "Won", "Lost"];

// GET /api/admin/leads?status=&q=&spam=true -> { leads: [...] }
export async function GET(request) {
  const user = await verifyAdmin(request);
  const denied = authedJson(user);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = (searchParams.get("q") || "").trim();
  const spam = searchParams.get("spam");

  let query = adminDb().from("leads").select("*").order("created_at", { ascending: false }).limit(500);
  if (status && STATUSES.includes(status)) query = query.eq("status", status);
  if (spam === "true") query = query.eq("spam", true);
  else if (spam === "false") query = query.eq("spam", false);
  if (q) {
    const like = `%${q.replace(/[%_,()]/g, "")}%`;
    query = query.or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like},company.ilike.${like},message.ilike.${like}`);
  }
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ leads: data });
}
