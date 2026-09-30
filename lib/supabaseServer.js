import { createClient } from "@supabase/supabase-js";

// Server-side client. Uses the service-role key so the admin API can
// read/write everything regardless of RLS. NEVER import this in client code.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Public read-only server client (respects RLS: published posts only).
export function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}
