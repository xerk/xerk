import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/supabase";

// First-party event log (pageviews + key actions) so stats work without a PostHog personal key.
const ALLOWED = new Set(["pageview", "cv_download", "hire_click", "upwork_click", "linkedin_click", "github_click", "x_click", "book_call", "project_view", "demo_launch", "demo_cta", "video_play", "ask_cv_question", "lead_submit", "achievement_unlocked", "quests_open", "quest_go", "terminal_command", "palette_open"]);

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (/bot|crawl|spider|preview|headless|lighthouse/i.test(ua)) return new NextResponse(null, { status: 204 });
  const b = await req.json().catch(() => null);
  if (!b || !ALLOWED.has(b.name)) return new NextResponse(null, { status: 204 });
  // Never log the owner's own browsing (xk_owner cookie, set on sign-in).
  if (req.cookies.get("xk_owner")?.value === "1") return new NextResponse(null, { status: 204 });
  const db = adminDb();
  if (db) {
    const ref = String(b.referrer || "");
    let refHost: string | null = null;
    try { refHost = ref ? new URL(ref).hostname : null; } catch {}
    await db.from("events").insert({
      name: b.name, path: String(b.path || "").slice(0, 200), sid: String(b.sid || "").slice(0, 40), referrer: refHost, utm_source: b.utm_source ? String(b.utm_source).slice(0, 60) : null,
      country: req.headers.get("x-vercel-ip-country"), city: decodeURIComponent(req.headers.get("x-vercel-ip-city") || "") || null,
      props: b.props && typeof b.props === "object" ? JSON.parse(JSON.stringify(b.props).slice(0, 2000)) : null,
    }).then(() => {}, () => {});
  }
  return new NextResponse(null, { status: 204 });
}
