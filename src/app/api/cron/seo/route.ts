import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/supabase";
import { auditSite, loadKeywords, saveAudit } from "@/lib/seo-audit";

// On-page SEO audit of every sitemap page, stored in seo_audits for the dashboard's /seo page.
// Cron-friendly: send `Authorization: Bearer $CRON_SECRET` (Vercel does this for scheduled crons).
// Not scheduled in vercel.json yet; add { "path": "/api/cron/seo", "schedule": "0 5 * * 1" } to run it weekly.
// ?base=https://preview-url audits another deployment (defaults to the host that received the request).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, error: "Supabase service role not configured" }, { status: 500 });
  const base = req.nextUrl.searchParams.get("base") || req.nextUrl.origin;
  if (!/^https?:\/\//.test(base)) return NextResponse.json({ ok: false, error: "bad base" }, { status: 400 });
  const run = await auditSite({ baseUrl: base, keywords: await loadKeywords(db) });
  const saved = await saveAudit(db, run);
  const avg = Math.round(run.pages.reduce((s, p) => s + p.score, 0) / Math.max(1, run.pages.length));
  return NextResponse.json({ ok: true, runId: run.runId, base: run.baseUrl, pages: saved, avgScore: avg });
}
