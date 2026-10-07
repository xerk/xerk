import { NextResponse, type NextRequest } from "next/server";
import { getStats, formatStats, statsKeyboard, type View } from "@/lib/stats";
import { answerCallback, editTelegram, sendTelegram } from "@/lib/telegram";

// Telegram bot webhook (private chat or the alerts channel).
// Register: setWebhook url=https://www.xerk.io/api/telegram, secret_token=$TELEGRAM_WEBHOOK_SECRET,
//           allowed_updates=["message","channel_post","callback_query"]
// Commands: /stats /week /month /leads /live /pages /sources /help — every report has buttons.
const VIEWS: View[] = ["summary", "pages", "sources", "leads", "live"];
const owner = () => String(process.env.TELEGRAM_CHAT_ID);

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const update = await req.json().catch(() => ({}));

  // Button presses: re-render the same message in place.
  const cb = update.callback_query;
  if (cb) {
    const chat = String(cb.message?.chat?.id || "");
    if (chat !== owner()) { await answerCallback(cb.id); return NextResponse.json({ ok: true }); }
    const [, d, v] = String(cb.data || "").split(":");
    const days = [1, 7, 30].includes(Number(d)) ? Number(d) : 1;
    const view = (VIEWS.includes(v as View) ? v : "summary") as View;
    await answerCallback(cb.id, "Updating…");
    await editTelegram(chat, cb.message.message_id, formatStats(await getStats(days), view), statsKeyboard(days, view));
    return NextResponse.json({ ok: true });
  }

  const msg = update.message || update.channel_post;
  const chat = String(msg?.chat?.id || "");
  if (!msg || chat !== owner()) {
    console.log("telegram: ignored update", { chat, hasMsg: !!msg });
    return NextResponse.json({ ok: true });
  }
  const cmd = String(msg.text || "").trim().split(/\s|@/)[0].toLowerCase();
  if (!cmd.startsWith("/")) return NextResponse.json({ ok: true });
  const map: Record<string, [number, View]> = { "/stats": [1, "summary"], "/today": [1, "summary"], "/week": [7, "summary"], "/month": [30, "summary"], "/leads": [30, "leads"], "/live": [1, "live"], "/pages": [7, "pages"], "/sources": [7, "sources"] };
  const hit = map[cmd];
  if (hit) await sendTelegram(formatStats(await getStats(hit[0]), hit[1]), chat, statsKeyboard(hit[0], hit[1]));
  else await sendTelegram("Commands: /stats · /week · /month · /pages · /sources · /leads · /live\nOr just tap the buttons under any report.", chat, statsKeyboard(1, "summary"));
  return NextResponse.json({ ok: true });
}
