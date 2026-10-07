import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Magic-link landing. Handles the PKCE `code` flow (default email template) and the `token_hash` flow
// (works even when the link is opened in a different browser than the one that requested it).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const raw = searchParams.get("next") || "/admin";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin"; // no open redirects
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "magiclink") as EmailOtpType;

  const supabase = await createClient();
  let error: string | null = null;
  if (code) error = (await supabase.auth.exchangeCodeForSession(code)).error?.message ?? null;
  else if (tokenHash) error = (await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error?.message ?? null;
  else error = searchParams.get("error_description") || "Missing login code";

  if (error) return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(error)}`, origin));
  return NextResponse.redirect(new URL(next, origin));
}
