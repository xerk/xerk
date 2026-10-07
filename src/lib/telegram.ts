// Minimal Telegram Bot API client. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (your user or group id).
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

export const telegramEnabled = Boolean(TOKEN && CHAT);

export function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
}

export async function sendTelegram(html: string, chatId = CHAT) {
  if (!TOKEN || !chatId) return { ok: false, skipped: true };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: html.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) console.error("telegram: sendMessage failed", res.status, (await res.text()).slice(0, 300));
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
