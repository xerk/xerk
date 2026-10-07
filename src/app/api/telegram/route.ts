import { NextResponse, type NextRequest } from "next/server";
import { getStats, formatStats } from "@/lib/stats";
import { sendTelegram } from "@/lib/telegram";

// Telegram bot webhook. Register once:
//   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://www.xerk.io/api/telegram&secret_token=$TELEGRAM_WEBHOOK_SECRET"
// Commands (owner chat only): /stats, /week, /leads, /help
export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const update = await req.json().catch(() => ({}));
  const msg = update.message || update.channel_post; // works in a private chat or the alerts channel
  const chat = String(msg?.chat?.id || "");
  if (!msg || chat !== String(process.env.TELEGRAM_CHAT_ID)) {
    console.log("telegram: ignored update", { chat, hasMsg: !!msg, configured: !!process.env.TELEGRAM_CHAT_ID });
    return NextResponse.json({ ok: true });
  }
  const cmd = String(msg.text || "").trim().split(/\s|@/)[0].toLowerCase();
  console.log("telegram: command", cmd);
  if (cmd === "/stats") await sendTelegram(formatStats(await getStats(1), "Last 24h"), chat);
  else if (cmd === "/week") await sendTelegram(formatStats(await getStats(7), "Last 7 days"), chat);
  else if (cmd === "/leads") { const s = await getStats(30); await sendTelegram(s.leads.length ? `💌 <b>Leads (30d)</b>\n${s.leads.map((l) => `• ${l.created_at.slice(0, 10)} ${l.name || "—"} ${l.email} ${l.budget || ""}`).join("\n")}` : "No leads in the last 30 days.", chat); }
  else if (cmd.startsWith("/")) await sendTelegram("Commands: /stats · /week · /leads", chat);
  return NextResponse.json({ ok: true });
}
