// Rank check: where does xerk.io show up for each keyword in seo_keywords? Writes one seo_ranks row per keyword.
//   node --env-file-if-exists=.env.local --experimental-strip-types scripts/seo-rank-check.ts [--dry] [--limit=10] [--priority=1] [--backend=serper]
//
// Backends, first configured one wins (or force with --backend=):
//   gsc       Google Search Console, real average Google positions for queries with impressions (free, preferred).
//             GSC_SERVICE_ACCOUNT_JSON = the service account key JSON (raw or base64); add the account's email as a
//             user on the property. GSC_SITE_URL = "sc-domain:xerk.io" or "https://www.xerk.io/".
//   serper    serper.dev Google SERP, top 100. SERPER_API_KEY.
//   serpapi   serpapi.com Google SERP, top 100. SERPAPI_API_KEY.
//   firecrawl Firecrawl web search, top 20. FIRECRAWL_API_KEY. A proxy, not Google: stored as engine "web".
// SEO_RANK_LOCATION (optional, serper/serpapi) e.g. "United States".
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SEO_KEYWORDS } from "../src/data/seo-keywords.ts";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? "true"]));
const DRY = args.dry === "true";
const HOSTS = new Set(["xerk.io", "www.xerk.io"]);
const isOurs = (u: string) => { try { return HOSTS.has(new URL(u).hostname); } catch { return false; } };

type Result = { keyword: string; engine: string; position: number | null; url: string | null; depth: number; source: string; notes?: string };
type Backend = { name: string; engine: string; depth: number; check: (kws: string[]) => Promise<Result[]> };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

/** Position of the first xerk.io result in an ordered list of URLs. */
const firstOurs = (links: string[]) => { const i = links.findIndex(isOurs); return i < 0 ? { position: null, url: null } : { position: i + 1, url: links[i] }; };

const serper: Backend = {
  name: "serper", engine: "google", depth: 100,
  async check(kws) {
    const out: Result[] = [];
    for (const q of kws) {
      const r = await fetch("https://google.serper.dev/search", { method: "POST", headers: { "X-API-KEY": process.env.SERPER_API_KEY!, "content-type": "application/json" }, body: JSON.stringify({ q, num: 100, ...(process.env.SEO_RANK_LOCATION ? { location: process.env.SEO_RANK_LOCATION } : {}) }) });
      if (!r.ok) { out.push({ keyword: q, engine: "google", position: null, url: null, depth: 0, source: "serper", notes: `error ${r.status}` }); continue; }
      const j = (await r.json()) as { organic?: { link: string; position: number }[] };
      const hit = (j.organic || []).find((o) => isOurs(o.link));
      out.push({ keyword: q, engine: "google", position: hit?.position ?? null, url: hit?.link ?? null, depth: 100, source: "serper" });
    }
    return out;
  },
};

const serpapi: Backend = {
  name: "serpapi", engine: "google", depth: 100,
  async check(kws) {
    const out: Result[] = [];
    for (const q of kws) {
      const p = new URLSearchParams({ engine: "google", q, num: "100", api_key: process.env.SERPAPI_API_KEY!, ...(process.env.SEO_RANK_LOCATION ? { location: process.env.SEO_RANK_LOCATION } : {}) });
      const r = await fetch(`https://serpapi.com/search.json?${p}`);
      if (!r.ok) { out.push({ keyword: q, engine: "google", position: null, url: null, depth: 0, source: "serpapi", notes: `error ${r.status}` }); continue; }
      const j = (await r.json()) as { organic_results?: { link: string; position: number }[] };
      const hit = (j.organic_results || []).find((o) => isOurs(o.link));
      out.push({ keyword: q, engine: "google", position: hit?.position ?? null, url: hit?.link ?? null, depth: 100, source: "serpapi" });
    }
    return out;
  },
};

const firecrawl: Backend = {
  name: "firecrawl", engine: "web", depth: 20,
  async check(kws) {
    const out: Result[] = [];
    for (const q of kws) {
      const r = await fetch("https://api.firecrawl.dev/v2/search", { method: "POST", headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ query: q, limit: 20, sources: ["web"] }) });
      if (!r.ok) { out.push({ keyword: q, engine: "web", position: null, url: null, depth: 0, source: "firecrawl", notes: `error ${r.status}` }); continue; }
      const j = (await r.json()) as { data?: { web?: { url: string }[] } | { url: string }[] };
      const list = Array.isArray(j.data) ? j.data : j.data?.web || [];
      out.push({ keyword: q, engine: "web", ...firstOurs(list.map((x) => x.url)), depth: 20, source: "firecrawl", notes: "firecrawl_search proxy, not a Google SERP" });
    }
    return out;
  },
};

async function gscToken() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON!.trim();
  const sa = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) as { client_email: string; private_key: string };
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }) });
  const j = (await r.json()) as { access_token?: string; error_description?: string };
  if (!j.access_token) throw new Error(`GSC auth failed: ${j.error_description || r.status}`);
  return j.access_token;
}

const gsc: Backend = {
  name: "gsc", engine: "gsc", depth: 0,
  async check(kws) {
    const token = await gscToken();
    const site = process.env.GSC_SITE_URL || "sc-domain:xerk.io";
    const end = new Date(Date.now() - 2 * 864e5), start = new Date(end.getTime() - 27 * 864e5);
    const d = (x: Date) => x.toISOString().slice(0, 10);
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ startDate: d(start), endDate: d(end), dimensions: ["query", "page"], rowLimit: 5000 }) });
    if (!r.ok) throw new Error(`GSC query failed: ${r.status} ${await r.text()}`);
    const rows = ((await r.json()) as { rows?: { keys: [string, string]; position: number; impressions: number; clicks: number }[] }).rows || [];
    return kws.map((k) => {
      const best = rows.filter((x) => x.keys[0].toLowerCase() === k.toLowerCase()).sort((a, b) => a.position - b.position)[0];
      return best
        ? { keyword: k, engine: "gsc", position: Math.max(1, Math.round(best.position)), url: best.keys[1], depth: 0, source: "gsc", notes: `${best.impressions} impressions, ${best.clicks} clicks, ${d(start)} to ${d(end)}` }
        : { keyword: k, engine: "gsc", position: null, url: null, depth: 0, source: "gsc", notes: `no impressions ${d(start)} to ${d(end)}` };
    });
  },
};

const available: [Backend, boolean][] = [[gsc, !!process.env.GSC_SERVICE_ACCOUNT_JSON], [serper, !!process.env.SERPER_API_KEY], [serpapi, !!process.env.SERPAPI_API_KEY], [firecrawl, !!process.env.FIRECRAWL_API_KEY]];
const backend = args.backend ? available.find(([b, on]) => b.name === args.backend && on)?.[0] : available.find(([, on]) => on)?.[0];
if (!backend) {
  console.error(`No rank backend configured${args.backend ? ` for "${args.backend}"` : ""}. Set one of: GSC_SERVICE_ACCOUNT_JSON (+ GSC_SITE_URL), SERPER_API_KEY, SERPAPI_API_KEY, FIRECRAWL_API_KEY.`);
  process.exit(1);
}

let keywords: { keyword: string; priority: number }[] = SEO_KEYWORDS;
if (db) {
  const { data } = await db.from("seo_keywords").select("keyword,priority");
  if (data?.length) keywords = data;
}
if (args.priority) keywords = keywords.filter((k) => k.priority <= Number(args.priority));
keywords = keywords.sort((a, b) => a.priority - b.priority).slice(0, args.limit ? Number(args.limit) : undefined);

console.log(`Checking ${keywords.length} keywords with ${backend.name}${DRY ? " (dry run)" : ""}`);
const results = await backend.check(keywords.map((k) => k.keyword));
for (const r of results) console.log(`${String(r.position ?? "-").padStart(4)}  ${r.keyword}${r.url ? `  ${r.url}` : ""}${r.notes ? `  (${r.notes})` : ""}`);
if (!DRY) {
  if (!db) { console.error("Supabase not configured; results not saved."); process.exit(1); }
  const checked_at = new Date().toISOString();
  const { error } = await db.from("seo_ranks").insert(results.map((r) => ({ ...r, cited: null, checked_at })));
  console.log(error ? `seo_ranks: ${error.message}` : `seo_ranks: ${results.length} rows saved`);
}
