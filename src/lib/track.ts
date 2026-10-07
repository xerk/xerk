"use client";
import posthog from "posthog-js";

// Visitor achievements — fun for visitors, and each unlock is an analytics event.
export const ACHIEVEMENTS = {
  explorer: { title: "Explorer", text: "Started the game", icon: "game-controller", xp: 50 },
  scout: { title: "Scout", text: "Opened 3 case studies", icon: "map-trifold", xp: 150 },
  player: { title: "Hands-on", text: "Launched a live demo", icon: "cursor-click", xp: 100 },
  hacker: { title: "Hacker", text: "Opened the terminal", icon: "terminal-window", xp: 75 },
  root: { title: "Root access", text: "Found sudo hire-me", icon: "skull", xp: 200 },
  curious: { title: "Curious", text: "Asked my CV a question", icon: "sparkle", xp: 75 },
  reader: { title: "Reader", text: "Opened a field note", icon: "book-open-text", xp: 50 },
  recruiter: { title: "Recruiter", text: "Visited the hire page", icon: "handshake", xp: 50 },
  party: { title: "Party formed", text: "Sent a message", icon: "trophy", xp: 500 },
} as const;
export type AchievementId = keyof typeof ACHIEVEMENTS;

export function track(event: string, props?: Record<string, unknown>) {
  try { if (posthog.__loaded) posthog.capture(event, props); } catch {}
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
