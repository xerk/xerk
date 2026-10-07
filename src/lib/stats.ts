import { adminDb } from "./supabase";

const PH_HOST = process.env.POSTHOG_API_HOST || "https://us.posthog.com";
const PH_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PH_PROJECT = process.env.POSTHOG_PROJECT_ID;
// The PostHog project may be shared with other apps — only count this site's traffic.
const HOST = `properties.$host ILIKE '%${(process.env.POSTHOG_HOST_FILTER || "xerk.io").replace(/'/g, "")}%'`;

async function hogql(query: string): Promise<unknown[][] | null> {
  if (!PH_KEY || !PH_PROJECT) return null;
  try {
    const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${PH_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()).results as unknown[][];
  } catch {
    return null;
  }
}

/** Visitors, top referrers, key events and leads for the last `days` days — PostHog first, Supabase `visits` as fallback. */
export async function getStats(days = 1) {
  const since = `now() - INTERVAL ${days} DAY`;
  const [visitors, refs, events] = await Promise.all([
    hogql(`SELECT count(DISTINCT person_id), count() FROM events WHERE event = '$pageview' AND ${HOST} AND timestamp > ${since}`),
    hogql(`SELECT properties.$referring_domain AS r, count(DISTINCT person_id) AS c FROM events WHERE event = '$pageview' AND ${HOST} AND timestamp > ${since} GROUP BY r ORDER BY c DESC LIMIT 5`),
    hogql(`SELECT event, count() FROM events WHERE event IN ('cv_download','hire_click','upwork_click','book_call','demo_launch','ask_cv_question','lead_submit','achievement_unlocked') AND ${HOST} AND timestamp > ${since} GROUP BY event ORDER BY count() DESC`),
  ]);
  const db = adminDb();
  let leads: { name: string | null; email: string; budget: string | null; created_at: string }[] = [];
  let sbVisits: number | null = null;
  if (db) {
    const from = new Date(Date.now() - days * 864e5).toISOString();
    const l = await db.from("leads").select("name,email,budget,created_at").gte("created_at", from).order("created_at", { ascending: false });
    leads = l.data || [];
    if (!visitors) { const v = await db.from("visits").select("id", { count: "exact", head: true }).gte("created_at", from); sbVisits = v.count ?? null; }
  }
  return {
    source: visitors ? "posthog" : db ? "supabase" : "none",
    uniques: visitors ? Number(visitors[0]?.[0] || 0) : sbVisits,
    pageviews: visitors ? Number(visitors[0]?.[1] || 0) : null,
    referrers: (refs || []).map((r) => ({ host: String(r[0] || "direct"), count: Number(r[1]) })),
    events: (events || []).map((e) => ({ event: String(e[0]), count: Number(e[1]) })),
    leads,
  };
}

export function formatStats(s: Awaited<ReturnType<typeof getStats>>, title: string) {
  const lines = [`📊 <b>${title}</b>`];
  lines.push(`👥 Visitors: <b>${s.uniques ?? "n/a"}</b>${s.pageviews != null ? ` · 📄 ${s.pageviews} pageviews` : ""}`);
  if (s.referrers.length) lines.push(`↩️ ${s.referrers.map((r) => `${r.host || "direct"} (${r.count})`).join(", ")}`);
  if (s.events.length) lines.push(`🎯 ${s.events.map((e) => `${e.event} ${e.count}`).join(" · ")}`);
  lines.push(`💌 Leads: <b>${s.leads.length}</b>${s.leads.length ? "\n" + s.leads.slice(0, 5).map((l) => `• ${l.name || "—"} ${l.email} ${l.budget || ""}`).join("\n") : ""}`);
  if (s.source === "none") lines.push("<i>Connect PostHog (POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID) or Supabase for numbers.</i>");
  return lines.join("\n");
}
