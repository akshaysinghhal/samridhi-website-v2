import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabaseServer";

// Verifies the request carries a valid Supabase user session.
// Returns the user object, or null.
export async function verifyAdmin(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function authedJson(user) {
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export function adminDb() {
  return supabaseAdmin();
}
