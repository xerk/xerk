import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-emails";
import { ADMIN_BASE, ADMIN_SEGMENT } from "@/lib/admin-path";

// Gates the dashboard (src/app/[console], served at the private ADMIN_PATH) behind Supabase Auth.
// Everything else passes straight through. <base>/login is public; signed-in admins are sent on to <base>.
const HARDEN: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer", // never leak the private path to sites linked from the dashboard
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.split("/")[1] !== ADMIN_SEGMENT) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) return new NextResponse("Not found", { status: 404 });

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  // getUser() verifies the JWT with Supabase Auth (getSession() would trust the cookie as-is).
  const { data } = await supabase.auth.getUser();
  const admin = isAdminEmail(data.user?.email);

  const finish = (r: NextResponse) => {
    if (r !== res) res.cookies.getAll().forEach((c) => r.cookies.set(c)); // keep refreshed session cookies
    Object.entries(HARDEN).forEach(([k, v]) => r.headers.set(k, v));
    // Analytics opt-out: nothing on dashboard pages is tracked, and once signed in, the owner's own
    // visits to the public site aren't counted either (read by src/lib/track.ts and PostHog's before_send).
    r.cookies.set("xk_nt", "1", { path: ADMIN_BASE, sameSite: "lax", secure: req.nextUrl.protocol === "https:" });
    if (admin) r.cookies.set("xk_owner", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: req.nextUrl.protocol === "https:" });
    return r;
  };

  if (pathname === `${ADMIN_BASE}/login`) return finish(admin ? NextResponse.redirect(new URL(ADMIN_BASE, req.url)) : res);
  if (!admin) {
    const to = new URL(`${ADMIN_BASE}/login`, req.url);
    if (pathname !== ADMIN_BASE) to.searchParams.set("next", pathname + search);
    if (data.user) to.searchParams.set("error", "not-admin");
    return finish(NextResponse.redirect(to));
  }
  return finish(res);
}

// Matcher must be static, so run on every page request and bail out early for anything that isn't the dashboard.
export const config = { matcher: ["/((?!_next/|api/|ingest|auth/|demos/|.*\\.[a-z0-9]+$).*)"] };
