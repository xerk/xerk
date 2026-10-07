import { cache } from "react";
import * as base from "@/data/profile";
import type { Achievement, Quest, Social, Stat } from "@/data/profile";
import { publicDb } from "./supabase";

/**
 * Site copy (profile, experience, skills, services…) lives in the Supabase `site_content` table, one row per
 * section, edited from the dashboard. src/data/profile.ts is the seed and the fallback for any missing row.
 */
export const CONTENT_KEYS = ["profile", "socials", "stats", "ticker", "achievements", "experience", "skillTree", "skills", "aiStack", "services", "process", "hireFaq", "github"] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

export type Profile = typeof base.profile & { bookingUrl?: string; upworkUrl?: string };

export type SiteContent = {
  profile: Profile;
  socials: Social[];
  stats: Stat[];
  ticker: typeof base.ticker;
  achievements: Achievement[];
  experience: Quest[];
  skillTree: typeof base.skillTree;
  skills: Record<string, string[]>;
  aiStack: typeof base.aiStack;
  services: typeof base.services;
  process: typeof base.process_;
  hireFaq: typeof base.hireFaq;
  github: typeof base.github;
};

export const DEFAULTS: SiteContent = {
  profile: { ...base.profile, upworkUrl: base.upworkUrl || "", bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL || "" },
  socials: base.socials.filter((s) => s.brand !== "upwork"),
  stats: base.stats,
  ticker: base.ticker,
  achievements: base.achievements,
  experience: base.experience,
  skillTree: base.skillTree,
  skills: base.skills,
  aiStack: base.aiStack,
  services: base.services,
  process: base.process_,
  hireFaq: base.hireFaq,
  github: base.github,
};

export type Site = SiteContent & {
  /** Upwork profile when set, else /hire. */
  upworkHref: string;
  /** Booking link, else a mailto. */
  bookingUrl: string;
  /** Socials with Upwork first when it's set. */
  links: Social[];
  socialHref: (brand: Social["brand"]) => string;
};

export function withDerived(c: SiteContent): Site {
  const upworkUrl = c.profile.upworkUrl || base.upworkUrl || "";
  const links: Social[] = [...(upworkUrl ? [{ brand: "upwork" as const, label: "Upwork", href: upworkUrl, handle: "Hire me" }] : []), ...c.socials.filter((s) => s.brand !== "upwork")];
  return {
    ...c,
    links,
    upworkHref: upworkUrl || "/hire",
    bookingUrl: c.profile.bookingUrl || process.env.NEXT_PUBLIC_BOOKING_URL || `mailto:${c.profile.email}?subject=Project%20call`,
    socialHref: (brand) => links.find((s) => s.brand === brand)?.href || "/hire",
  };
}

/** Raw rows from the DB (no fallbacks). Used by the dashboard to show which sections are stored. */
export async function readContentRows(): Promise<Partial<Record<ContentKey, { value: unknown; updated_at: string }>>> {
  const db = publicDb();
  if (!db) return {};
  const { data, error } = await db.from("site_content").select("key,value,updated_at");
  if (error || !data) return {};
  return Object.fromEntries(data.filter((r) => (CONTENT_KEYS as readonly string[]).includes(r.key)).map((r) => [r.key, { value: r.value, updated_at: r.updated_at }]));
}

/** The whole site's copy, DB first, then the file defaults per section. Cached per request. */
export const getSite = cache(async (): Promise<Site> => {
  let rows: Awaited<ReturnType<typeof readContentRows>> = {};
  try { rows = await readContentRows(); } catch { /* fall back to defaults */ }
  const merged = { ...DEFAULTS } as Record<ContentKey, unknown>;
  for (const k of CONTENT_KEYS) {
    const v = rows[k]?.value;
    if (v === undefined || v === null) continue;
    // Profile merges over defaults so newly added fields keep a value; lists replace wholesale.
    merged[k] = k === "profile" || k === "github" ? { ...(DEFAULTS[k] as object), ...(v as object) } : v;
  }
  return withDerived(merged as SiteContent);
});
