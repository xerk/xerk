import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-emails";
import { adminAlert } from "@/lib/admin-alert";
import { ADMIN_BASE } from "@/lib/admin-path";

// Magic-link landing. Handles the PKCE `code` flow (default email template) and the `token_hash` flow.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const raw = searchParams.get("next") || ADMIN_BASE;
  // Only ever land inside the dashboard: no open redirects, no bouncing elsewhere.
  const next = raw === ADMIN_BASE || raw.startsWith(`${ADMIN_BASE}/`) ? raw : ADMIN_BASE;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "magiclink") as EmailOtpType;
  const fail = (msg: string) => NextResponse.redirect(new URL(`${ADMIN_BASE}/login?error=${encodeURIComponent(msg)}`, origin));

  const supabase = await createClient();
  let error: string | null = null;
  if (code) error = (await supabase.auth.exchangeCodeForSession(code)).error?.message ?? null;
  else if (tokenHash) error = (await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error?.message ?? null;
  else error = searchParams.get("error_description") || "Missing login code";
  if (error) {
    await adminAlert("failed", "unknown", error);
    return fail(error);
  }

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email || "";
  if (!isAdminEmail(email)) {
    await supabase.auth.signOut();
    await adminAlert("blocked", email || "unknown", "Session created for a non-admin account and was revoked.");
    return fail("This account can't use the dashboard.");
  }
  await adminAlert("signed-in", email);
  return NextResponse.redirect(new URL(next, origin));
}
