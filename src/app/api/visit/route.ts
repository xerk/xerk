import { NextResponse, type NextRequest } from "next/server";
import { sendTelegram, esc } from "@/lib/telegram";
import { adminDb } from "@/lib/supabase";

// Called once per browser session. Pings Telegram for notable visits and logs to Supabase `visits`.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ua = req.headers.get("user-agent") || "";
  if (/bot|crawl|spider|preview|headless|lighthouse/i.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });
  const country = req.headers.get("x-vercel-ip-country") || "";
  const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "");
  const ref = String(body.referrer || "").slice(0, 300);
  const refHost = ref ? (() => { try { return new URL(ref).hostname; } catch { return ref; } })() : "direct";
  const visit = { sid: body.sid ? String(body.sid).slice(0, 40) : null, path: String(body.path || "/").slice(0, 200), referrer: refHost, utm_source: body.utm_source || null, utm_medium: body.utm_medium || null, country, city, lang: body.lang || null, tz: body.tz || null, ua: ua.slice(0, 200) };

  const db = adminDb();
  if (db) await db.from("visits").insert(visit).then(() => {}, () => {});

  // Ping on every session by default; set TELEGRAM_VISIT_PINGS=notable to only ping for external referrers/UTM traffic.
  const notable = refHost !== "direct" && !refHost.endsWith("xerk.io");
  if (process.env.TELEGRAM_VISIT_PINGS !== "off" && (process.env.TELEGRAM_VISIT_PINGS !== "notable" || notable || visit.utm_source)) {
    const flag = country ? String.fromCodePoint(...[...country.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "🌐";
    await sendTelegram(`👾 <b>New visitor</b> ${flag} ${esc(city || country)}\n📄 ${esc(visit.path)}\n↩️ ${esc(visit.utm_source ? `${visit.utm_source}/${visit.utm_medium || ""}` : refHost)}`);
  }
  return NextResponse.json({ ok: true });
}
