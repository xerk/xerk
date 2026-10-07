import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-emails";

// Gate /admin and /studio behind Supabase Auth (magic link). Refreshes the session cookie on every request.
// /admin/login is public; signed-in admins visiting it are sent to /admin.
export async function proxy(req: NextRequest) {
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
  const { pathname, search } = req.nextUrl;

  // Carry refreshed session cookies onto a redirect, otherwise the refresh is lost.
  const redirect = (to: URL) => {
    const r = NextResponse.redirect(to);
    res.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (pathname === "/admin/login") {
    return admin ? redirect(new URL("/admin", req.url)) : res;
  }
  if (!admin) {
    const to = new URL("/admin/login", req.url);
    to.searchParams.set("next", pathname + search);
    if (data.user) to.searchParams.set("error", "not-admin");
    return redirect(to);
  }
  return res;
}

export const config = { matcher: ["/admin", "/admin/:path*", "/studio", "/studio/:path*"] };
