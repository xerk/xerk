// Minimal Telegram Bot API client. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (a user, group or channel id).
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

export const telegramEnabled = Boolean(TOKEN && CHAT);

export function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
}

async function api(method: string, body: Record<string, unknown>) {
  if (!TOKEN) return { ok: false, skipped: true };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) console.error(`telegram: ${method} failed`, res.status, (await res.text()).slice(0, 300));
    return { ok: res.ok };
  } catch (e) {
    console.error(`telegram: ${method} error`, e);
    return { ok: false };
  }
}

export function sendTelegram(html: string, chatId = CHAT, replyMarkup?: unknown) {
  if (!chatId) return Promise.resolve({ ok: false, skipped: true });
  return api("sendMessage", { chat_id: chatId, text: html.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true, reply_markup: replyMarkup });
}

export function editTelegram(chatId: string | number, messageId: number, html: string, replyMarkup?: unknown) {
  return api("editMessageText", { chat_id: chatId, message_id: messageId, text: html.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true, reply_markup: replyMarkup });
}

export function answerCallback(id: string, text?: string) {
  return api("answerCallbackQuery", { callback_query_id: id, text });
}
