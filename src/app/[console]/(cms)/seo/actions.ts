"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/supabase";
import { getAdminUser } from "@/lib/supabase/server";
import { adminHref } from "@/lib/admin-path";
import { SITE_URL } from "@/data/profile";
import { auditSite, loadKeywords, saveAudit } from "@/lib/seo-audit";

export type RunAuditResult = { ok: true; pages: number; avg: number; base: string } | { ok: false; error: string };

/** "Run audit" on the SEO page: audit the deployment serving this request (production, preview or localhost). */
export async function runSeoAudit(target: "self" | "production" = "self"): Promise<RunAuditResult> {
  try {
    if (!(await getAdminUser())) throw new Error("Not signed in as an admin.");
    const db = adminDb();
    if (!db) throw new Error("Supabase service role is not configured.");
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
    const base = target === "production" || !host ? SITE_URL : `${proto}://${host}`;
    const run = await auditSite({ baseUrl: base, keywords: await loadKeywords(db) });
    const pages = await saveAudit(db, run);
    revalidatePath(adminHref("/seo"));
    return { ok: true, pages, avg: Math.round(run.pages.reduce((s, p) => s + p.score, 0) / Math.max(1, pages)), base: run.baseUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
