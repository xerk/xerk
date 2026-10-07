import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-emails";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;

/** Cookie-bound Supabase client for Server Components, Server Actions and Route Handlers. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, which can't set cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in admin's email, or null. Uses getUser() so the JWT is verified by Supabase Auth. */
export async function getAdminUser(): Promise<{ email: string } | null> {
  if (!url || !anon) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  return email && isAdminEmail(email) ? { email } : null;
}
