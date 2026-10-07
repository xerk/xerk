"use client";
import posthog from "posthog-js";

// Visitor achievements — fun for visitors, and each unlock is an analytics event.
export const ACHIEVEMENTS = {
  explorer: { title: "Explorer", text: "Started the game", hint: "Open the site. You already did this one.", href: "/", cta: "Home", icon: "game-controller", xp: 50 },
  scout: { title: "Scout", text: "Opened 3 case studies", hint: "Open any three stages from the level select.", href: "/work", cta: "Pick a stage", icon: "map-trifold", xp: 150 },
  player: { title: "Hands-on", text: "Launched a live demo", hint: "Press Launch demo on the real-time platform case study.", href: "/work/realtime-device-platform#demo", cta: "Play the demo", icon: "cursor-click", xp: 100 },
  hacker: { title: "Hacker", text: "Opened the terminal", hint: "Click into the console on the play page.", href: "/play#console", cta: "Open console", icon: "terminal-window", xp: 75 },
  root: { title: "Root access", text: "Found sudo hire-me", hint: "There is a hidden command in the console. Try sudo with something.", href: "/play#console", cta: "Find it", icon: "skull", xp: 200 },
  curious: { title: "Curious", text: "Asked my CV a question", hint: "Ask the AI anything about my work.", href: "/ai#ask", cta: "Ask my CV", icon: "sparkle", xp: 75 },
  reader: { title: "Reader", text: "Read a blog post", hint: "Open any post on the blog.", href: "/blog", cta: "Read a post", icon: "book-open-text", xp: 50 },
  recruiter: { title: "Recruiter", text: "Visited the hire page", hint: "See the services and how we would work together.", href: "/hire", cta: "Open hire page", icon: "handshake", xp: 50 },
  party: { title: "Party formed", text: "Sent a message", hint: "Tell me about your project with the contact form.", href: "/hire#contact", cta: "Send a message", icon: "trophy", xp: 500 },
} as const;
export type AchievementId = keyof typeof ACHIEVEMENTS;

export function sessionId() {
  try {
    let id = sessionStorage.getItem("xk:sid");
    if (!id) { id = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("xk:sid", id); }
    return id;
  } catch { return ""; }
}

/** Sends to PostHog (if configured) and to the site's own event log in Supabase. */
/** Dashboard pages and the site owner's browser opt out of analytics (cookies set by src/proxy.ts). */
export const notTracked = () => typeof document !== "undefined" && /(?:^|; )(xk_nt|xk_owner)=1/.test(document.cookie);

export function track(event: string, props?: Record<string, unknown>) {
  if (notTracked()) return;
  try { if (posthog.__loaded) posthog.capture(event, props); } catch {}
  try {
    const q = new URLSearchParams(location.search);
    const body = JSON.stringify({ name: event, path: location.pathname, sid: sessionId(), referrer: document.referrer, utm_source: q.get("utm_source"), props });
    if (!navigator.sendBeacon?.("/api/event", new Blob([body], { type: "application/json" }))) fetch("/api/event", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
  } catch {}
}

export function unlock(id: AchievementId) {
  try {
    const got: string[] = JSON.parse(localStorage.getItem("xk:ach") || "[]");
    if (got.includes(id)) return;
    got.push(id);
    localStorage.setItem("xk:ach", JSON.stringify(got));
    track("achievement_unlocked", { achievement: id });
    window.dispatchEvent(new CustomEvent("xk:achievement", { detail: id }));
  } catch {}
}

export function unlockedList(): string[] {
  try { return JSON.parse(localStorage.getItem("xk:ach") || "[]"); } catch { return []; }
}

export function openQuests() {
  window.dispatchEvent(new Event("xk:quests"));
}
