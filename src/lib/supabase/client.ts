import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client (anon key; session lives in cookies shared with the server). */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!);
}
