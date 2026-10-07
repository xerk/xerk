import { adminDb } from "./supabase";
import { ADMIN_BASE } from "./admin-path";

// Analytics for the dashboard Overview, computed from the site's own `events` + `leads` tables.
// Pulls the current range plus the range before it, so every number can show a trend.

export const RANGES = { "24h": { days: 1, label: "24 hours" }, "7d": { days: 7, label: "7 days" }, "30d": { days: 30, label: "30 days" }, "90d": { days: 90, label: "90 days" } } as const;
export type RangeKey = keyof typeof RANGES;
export const isRange = (r?: string): r is RangeKey => !!r && r in RANGES;

type Ev = { name: string; path: string | null; sid: string | null; referrer: string | null; utm_source: string | null; country: string | null; city: string | null; created_at: string };
type LeadRow = { id: string; name: string | null; email: string; service: string | null; budget: string | null; status: string | null; country: string | null; created_at: string };

export type Point = { t: string; label: string; visitors: number; pageviews: number; actions: number };
export type Kpi = { key: string; label: string; value: number; prev: number; delta: number | null; series: number[]; format?: "int" | "dec" };

// Dashboard traffic (current path, the old /admin, and the earlier random hq-… path) never counts as site traffic.
const isDashboardPath = (p: string | null) => !!p && (p === ADMIN_BASE || p.startsWith(`${ADMIN_BASE}/`) || /^\/(admin|hq-[0-9a-f]{6,})(\/|$)/.test(p));
const CONVERSIONS = ["hire_click", "upwork_click", "book_call", "lead_submit", "contact_submit"];
const host = (r: string) => r.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
const sourceOf = (e: Ev) => (e.utm_source ? `utm:${e.utm_source}` : e.referrer ? host(e.referrer) : "direct");
const pct = (a: number, b: number) => (b === 0 ? (a === 0 ? 0 : null) : Math.round(((a - b) / b) * 100));

function top(items: (string | null | undefined)[], n: number): [string, number][] {
  const m = new Map<string, number>();
  items.forEach((k) => { if (k) m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function fetchEvents(fromIso: string): Promise<Ev[]> {
  const db = adminDb();
  if (!db) return [];
  const out: Ev[] = [];
  for (let page = 0; page < 40; page++) {
    const { data, error } = await db.from("events").select("name,path,sid,referrer,utm_source,country,city,created_at").gte("created_at", fromIso).order("created_at", { ascending: true }).range(page * 1000, page * 1000 + 999);
    if (error || !data?.length) break;
    out.push(...(data as Ev[]).filter((e) => !isDashboardPath(e.path)));
    if (data.length < 1000) break;
  }
  return out;
}

export async function getDashboard(range: RangeKey = "7d") {
  const { days } = RANGES[range];
  const hourly = days === 1;
  const now = Date.now();
  const span = days * 864e5;
  const from = now - span, prevFrom = now - 2 * span;
  const db = adminDb();

  const [all, leadsRes] = await Promise.all([
    fetchEvents(new Date(prevFrom).toISOString()),
    db ? db.from("leads").select("id,name,email,service,budget,status,country,created_at").gte("created_at", new Date(prevFrom).toISOString()).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as LeadRow[] }),
  ]);
  const allLeads = ((leadsRes as { data: LeadRow[] | null }).data || []) as LeadRow[];
  const cur = all.filter((e) => Date.parse(e.created_at) >= from);
  const prev = all.filter((e) => Date.parse(e.created_at) < from);
  const leads = allLeads.filter((l) => Date.parse(l.created_at) >= from);
  const prevLeads = allLeads.filter((l) => Date.parse(l.created_at) < from);

  // Time buckets (hours for 24h, days otherwise), oldest first.
  const step = hourly ? 36e5 : 864e5;
  const n = hourly ? 24 : days;
  const start = hourly ? Math.floor(now / step) * step - (n - 1) * step : new Date(new Date(now).toISOString().slice(0, 10)).getTime() - (n - 1) * step;
  const bucketOf = (iso: string) => Math.floor((Date.parse(iso) - start) / step);
  const fmt = (t: number) => hourly
    ? new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  const buckets = Array.from({ length: n }, (_, i) => ({ t: start + i * step, sids: new Set<string>(), pageviews: 0, actions: 0, leads: 0, conv: 0, cv: 0 }));
  for (const e of cur) {
    const b = buckets[bucketOf(e.created_at)];
    if (!b) continue;
    if (e.sid) b.sids.add(e.sid);
    if (e.name === "pageview") b.pageviews++;
    else b.actions++;
    if (CONVERSIONS.includes(e.name)) b.conv++;
    if (e.name === "cv_download") b.cv++;
  }
  for (const l of leads) { const b = buckets[bucketOf(l.created_at)]; if (b) b.leads++; }
  const series: Point[] = buckets.map((b) => ({ t: new Date(b.t).toISOString(), label: fmt(b.t), visitors: b.sids.size, pageviews: b.pageviews, actions: b.actions }));

  const summarize = (evs: Ev[]) => {
    const sids = new Set(evs.map((e) => e.sid).filter(Boolean));
    const pv = evs.filter((e) => e.name === "pageview").length;
    return {
      visitors: sids.size,
      pageviews: pv,
      perVisit: sids.size ? +(pv / sids.size).toFixed(1) : 0,
      conversions: evs.filter((e) => CONVERSIONS.includes(e.name)).length,
      cv: evs.filter((e) => e.name === "cv_download").length,
    };
  };
  const a = summarize(cur), b = summarize(prev);
  const kpis: Kpi[] = [
    { key: "visitors", label: "Visitors", value: a.visitors, prev: b.visitors, delta: pct(a.visitors, b.visitors), series: buckets.map((x) => x.sids.size) },
    { key: "pageviews", label: "Pageviews", value: a.pageviews, prev: b.pageviews, delta: pct(a.pageviews, b.pageviews), series: buckets.map((x) => x.pageviews) },
    { key: "perVisit", label: "Pages / visit", value: a.perVisit, prev: b.perVisit, delta: pct(a.perVisit, b.perVisit), series: buckets.map((x) => (x.sids.size ? x.pageviews / x.sids.size : 0)), format: "dec" },
    { key: "conversions", label: "Hire clicks", value: a.conversions, prev: b.conversions, delta: pct(a.conversions, b.conversions), series: buckets.map((x) => x.conv) },
    { key: "leads", label: "Leads", value: leads.length, prev: prevLeads.length, delta: pct(leads.length, prevLeads.length), series: buckets.map((x) => x.leads) },
    { key: "cv", label: "CV downloads", value: a.cv, prev: b.cv, delta: pct(a.cv, b.cv), series: buckets.map((x) => x.cv) },
  ];

  // First event of each session = how they arrived.
  const firstBySid = new Map<string, Ev>();
  for (const e of cur) if (e.sid && !firstBySid.has(e.sid)) firstBySid.set(e.sid, e);
  const sessions = [...firstBySid.values()];
  const views = cur.filter((e) => e.name === "pageview");

  // Weekday × hour heat (UTC), from pageviews.
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  views.forEach((e) => { const d = new Date(e.created_at); heat[(d.getUTCDay() + 6) % 7][d.getUTCHours()]++; });

  // Live: anyone active in the last 5 minutes, plus the latest events.
  const liveSince = now - 5 * 60_000;
  const live = new Set(all.filter((e) => Date.parse(e.created_at) >= liveSince && e.sid).map((e) => e.sid)).size;
  const feed = [...cur].reverse().slice(0, 14).map((e) => ({ at: e.created_at, name: e.name, path: e.path, country: e.country, city: e.city, source: sourceOf(e) }));

  return {
    range, days, hourly, series, kpis, live, feed, heat,
    pages: top(views.map((e) => e.path), 8),
    sources: top(sessions.map(sourceOf), 6),
    countries: top(sessions.map((e) => e.country), 8),
    actions: top(cur.filter((e) => e.name !== "pageview").map((e) => e.name), 8),
    leads: leads.slice(0, 6),
    generatedAt: new Date(now).toISOString(),
    configured: Boolean(db),
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
