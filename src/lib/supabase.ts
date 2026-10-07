import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export const supabaseEnabled = Boolean(url && anon);

/** Public, RLS-bound client (published content only). Null when Supabase isn't configured. */
export function publicDb(): SupabaseClient | null {
  return url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;
}

/** Server-only privileged client for writes (leads, visits, admin). Never import from client code. */
export function adminDb(): SupabaseClient | null {
  return url && service ? createClient(url, service, { auth: { persistSession: false } }) : null;
}
