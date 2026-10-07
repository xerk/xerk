import { NextResponse, type NextRequest } from "next/server";
import { getStats, formatStats } from "@/lib/stats";
import { sendTelegram } from "@/lib/telegram";

// Daily Telegram digest. Scheduled in vercel.json; Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const stats = await getStats(1);
  const res = await sendTelegram(formatStats(stats, "xerk.io, last 24h"));
  return NextResponse.json({ ok: true, sent: res.ok, stats });
}
