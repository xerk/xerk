import { headers } from "next/headers";
import { esc, sendTelegram } from "./telegram";

const mask = (email: string) => email.replace(/^(.{2}).*(@.*)$/, "$1•••$2");

/** Telegram ping for every sign-in event on the dashboard, so an unexpected login is noticed at once. */
export async function adminAlert(kind: "signed-in" | "link-sent" | "blocked" | "failed", email: string, detail?: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const where = [h.get("x-vercel-ip-city"), h.get("x-vercel-ip-country")].filter(Boolean).map((s) => decodeURIComponent(s!)).join(", ") || "unknown";
  const ua = (h.get("user-agent") || "").slice(0, 120);
  const title = { "signed-in": "🔓 <b>Dashboard sign-in</b>", "link-sent": "✉️ <b>Sign-in link requested</b>", blocked: "🚫 <b>Blocked sign-in attempt</b>", failed: "⚠️ <b>Sign-in failed</b>" }[kind];
  const who = kind === "blocked" ? mask(email) : email;
  await sendTelegram(`${title}\n${esc(who)}\n📍 ${esc(where)} · <code>${esc(ip)}</code>\n🖥 ${esc(ua)}${detail ? `\n<i>${esc(detail)}</i>` : ""}`);
}
