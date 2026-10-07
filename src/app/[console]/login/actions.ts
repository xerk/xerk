"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-emails";
import { adminAlert } from "@/lib/admin-alert";
import { ADMIN_BASE } from "@/lib/admin-path";

// The admin allow-list never leaves the server. Every request gets the same answer, so the form can't be
// used to find out which address is the owner's; only allow-listed addresses actually receive a link.

const hits = new Map<string, number[]>();
function limited(key: string, max = 5, windowMs = 15 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

export type LinkResult = { ok: true } | { ok: false; error: string };

export async function requestSignInLink(form: { email: string; next?: string; company?: string }): Promise<LinkResult> {
  const email = String(form.email || "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (form.company) return { ok: true }; // honeypot: bots fill every field

  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (limited(ip)) return { ok: false, error: "Too many attempts. Try again in a few minutes." };

  if (!isAdminEmail(email)) {
    await adminAlert("blocked", email);
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400)); // similar timing to a real send
    return { ok: true };
  }

  const raw = form.next || ADMIN_BASE;
  const next = raw === ADMIN_BASE || raw.startsWith(`${ADMIN_BASE}/`) ? raw : ADMIN_BASE;
  const origin = `${h.get("x-forwarded-proto") || "https"}://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: false },
  });
  if (error) {
    console.error("sign-in link failed", error.message);
    return { ok: false, error: /rate/i.test(error.message) ? "Email limit reached. Wait a bit, then try again." : "Couldn't send the link. Try again shortly." };
  }
  await adminAlert("link-sent", email);
  return { ok: true };
}
