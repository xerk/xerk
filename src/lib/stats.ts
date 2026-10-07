import { adminDb } from "./supabase";
import { esc } from "./telegram";
import { ADMIN_BASE } from "./admin-path";

const PH_HOST = process.env.POSTHOG_API_HOST || (process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "https://eu.posthog.com" : "https://us.posthog.com");
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
    if (!res.ok) { console.error("posthog query failed", res.status); return null; }
    return (await res.json()).results as unknown[][];
  } catch {
    return null;
  }
}

type Row = { name: string; path: string | null; sid: string | null; referrer: string | null; utm_source: string | null; country: string | null; city: string | null; created_at: string; props: Record<string, unknown> | null };
type Lead = { name: string | null; email: string; budget: string | null; service: string | null; message: string | null; source: string | null; path: string | null; country: string | null; created_at: string };

const top = (items: (string | null | undefined)[], n = 5) => {
  const m = new Map<string, number>();
  items.forEach((k) => { if (k) m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
};

export async function getStats(days = 1) {
  const from = new Date(Date.now() - days * 864e5).toISOString();
  const db = adminDb();
  let events: Row[] = [], leads: Lead[] = [];
  if (db) {
    const [e, l] = await Promise.all([
      db.from("events").select("name,path,sid,referrer,utm_source,country,city,created_at,props").gte("created_at", from).order("created_at", { ascending: false }).limit(5000),
      db.from("leads").select("name,email,budget,service,message,source,path,country,created_at").gte("created_at", from).order("created_at", { ascending: false }),
    ]);
    events = (e.data as Row[]) || [];
    leads = (l.data as Lead[]) || [];
  }
  const views = events.filter((e) => e.name === "pageview");
  const sessions = new Map<string, Row[]>();
  events.forEach((e) => { if (e.sid) sessions.set(e.sid, [...(sessions.get(e.sid) || []), e]); });
  const firstOf = [...sessions.values()].map((rows) => rows[rows.length - 1]);

  const ph = await hogql(`SELECT count(DISTINCT person_id), count() FROM events WHERE event = '$pageview' AND ${HOST} AND timestamp > now() - INTERVAL ${days} DAY`);

  return {
    days,
    visitors: sessions.size,
    pageviews: views.length,
    posthog: ph ? { uniques: Number(ph[0]?.[0] || 0), pageviews: Number(ph[0]?.[1] || 0) } : null,
    pages: top(views.map((v) => v.path), 8),
    sources: top(firstOf.map((r) => (r.utm_source ? `utm:${r.utm_source}` : r.referrer || "direct")), 8),
    countries: top(firstOf.map((r) => r.country), 6),
    events: top(events.filter((e) => e.name !== "pageview").map((e) => e.name), 10),
    questions: events.filter((e) => e.name === "ask_cv_question").slice(0, 5).map((e) => String(e.props?.question || "")),
    live: firstOf.slice(0, 8).map((r) => ({ at: r.created_at, country: r.country, city: r.city, source: r.utm_source || r.referrer || "direct", pages: sessions.get(r.sid || "")?.filter((x) => x.name === "pageview").length || 0, landing: r.path })),
    leads,
    configured: Boolean(db),
  };
}

export type Stats = Awaited<ReturnType<typeof getStats>>;
export type View = "summary" | "pages" | "sources" | "leads" | "live";

const flag = (c?: string | null) => (c && c.length === 2 ? String.fromCodePoint(...[...c.toUpperCase()].map((x) => 127397 + x.charCodeAt(0))) : "🌐");
const label = (d: number) => (d === 1 ? "last 24h" : `last ${d} days`);
const bar = (n: number, max: number) => "▇".repeat(Math.max(1, Math.round((n / Math.max(1, max)) * 8)));
const list = (rows: [string, number][], fmt = (k: string) => esc(k)) => rows.length ? rows.map(([k, n]) => `${bar(n, rows[0][1])} ${n}  ${fmt(k)}`).join("\n") : "<i>nothing yet</i>";

export function formatStats(s: Stats, view: View = "summary") {
  const head = `📊 <b>xerk.io · ${label(s.days)}</b>`;
  if (!s.configured) return `${head}\n<i>Supabase isn't connected, so there is nothing to report.</i>`;
  if (view === "pages") return `${head}\n\n📄 <b>Top pages</b>\n${list(s.pages)}`;
  if (view === "sources") return `${head}\n\n↩️ <b>Sources</b>\n${list(s.sources)}\n\n🌍 <b>Countries</b>\n${list(s.countries, (k) => `${flag(k)} ${esc(k)}`)}`;
  if (view === "leads") return `${head}\n\n💌 <b>Leads (${s.leads.length})</b>\n` + (s.leads.length ? s.leads.slice(0, 8).map((l) => `• <b>${esc(l.name || "—")}</b> ${esc(l.email)}\n  ${esc(l.budget || "no budget")}${l.service ? " · " + esc(l.service) : ""} · ${flag(l.country)} · ${esc(l.created_at.slice(0, 16).replace("T", " "))}\n  <i>${esc((l.message || "").slice(0, 160))}</i>`).join("\n") : "<i>No leads yet.</i>");
  if (view === "live") return `${head}\n\n👀 <b>Recent visitors</b>\n` + (s.live.length ? s.live.map((v) => `${flag(v.country)} ${esc(v.city || v.country || "?")} · ${esc(v.source)} → ${esc(v.landing || "/")} · ${v.pages} pages · ${esc(v.at.slice(11, 16))} UTC`).join("\n") : "<i>No visitors yet.</i>");
  const lines = [head, "", `👥 <b>${s.visitors}</b> visitors · 📄 <b>${s.pageviews}</b> pageviews · 💌 <b>${s.leads.length}</b> leads`];
  if (s.posthog) lines.push(`<i>PostHog: ${s.posthog.uniques} people, ${s.posthog.pageviews} pageviews</i>`);
  lines.push("", "📄 <b>Top pages</b>", list(s.pages.slice(0, 5)));
  lines.push("", "↩️ <b>Sources</b>", list(s.sources.slice(0, 5)));
  if (s.countries.length) lines.push("", "🌍 " + s.countries.map(([c, n]) => `${flag(c)} ${n}`).join("  "));
  lines.push("", "🎯 <b>Actions</b>", s.events.length ? s.events.map(([e, n]) => `${n} × ${esc(e.replace(/_/g, " "))}`).join("\n") : "<i>none yet</i>");
  if (s.questions.length) lines.push("", "💬 <b>Asked my CV</b>", s.questions.map((q) => `• ${esc(q.slice(0, 120))}`).join("\n"));
  return lines.join("\n");
}

export function statsKeyboard(days: number, view: View = "summary") {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.xerk.io").replace(/\/$/, "");
  const b = (text: string, data: string) => ({ text: (data === `s:${days}:${view}` ? "• " : "") + text, callback_data: data });
  return {
    inline_keyboard: [
      [b("24h", `s:1:${view}`), b("7 days", `s:7:${view}`), b("30 days", `s:30:${view}`)],
      [b("Summary", `s:${days}:summary`), b("Pages", `s:${days}:pages`), b("Sources", `s:${days}:sources`)],
      [b("Leads", `s:${days}:leads`), b("Live", `s:${days}:live`), { text: "Dashboard ↗", url: `${site}${ADMIN_BASE}` }],
    ],
  };
}
