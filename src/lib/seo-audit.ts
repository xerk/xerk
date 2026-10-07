import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/data/profile";
import { keywordForPath, SEO_KEYWORDS } from "@/data/seo-keywords";

/**
 * On-page SEO audit. Fetches each public page's rendered HTML (from the sitemap of `baseUrl`), measures what search
 * engines and AI crawlers read, and scores it 0-100. No HTML parser dependency: the checks are regexes over
 * server-rendered markup, which is what crawlers see too.
 */

export type Severity = "error" | "warn" | "info";
export type AuditIssue = { id: string; severity: Severity; message: string };
export type AuditMeta = {
  status: number;
  title?: string;
  titleLength?: number;
  description?: string;
  descriptionLength?: number;
  h1: number;
  h1Text?: string;
  h2: number;
  words: number;
  internalLinks: number;
  images: number;
  imagesMissingAlt: number;
  canonical?: string;
  ogImage?: boolean;
  jsonLdTypes: string[];
  inSitemap: boolean;
  inLlms: boolean;
  keyword?: string;
  keywordIn?: { title: boolean; h1: boolean; description: boolean; body: boolean };
  noindex?: boolean;
  ms: number;
};
export type PageAudit = { path: string; url: string; score: number; issues: AuditIssue[]; meta: AuditMeta };
export type AuditRun = { runId: string; baseUrl: string; startedAt: string; pages: PageAudit[] };

const PENALTY: Record<Severity, number> = { error: 15, warn: 6, info: 2 };
const STOP = new Set(["a", "an", "and", "the", "for", "to", "of", "in", "on", "with", "or", "vs", "is", "what", "how", "when"]);

/** JSON-LD types each kind of page should carry. */
function expectedTypes(path: string): string[] {
  if (path === "/") return ["Person", "WebSite", "ProfilePage"];
  if (path.startsWith("/hire")) return ["ProfessionalService", "FAQPage", "BreadcrumbList"];
  if (/^\/work\/.+/.test(path)) return ["CreativeWork", "BreadcrumbList"];
  if (/^\/blog\/.+/.test(path)) return ["BlogPosting", "BreadcrumbList"];
  if (path === "/blog") return ["Blog"];
  return ["Person"];
}
/** Pages meant to bring in search traffic; thin-content and keyword checks are stricter there. */
const isMoneyPage = (path: string) => path === "/" || path.startsWith("/hire") || path.startsWith("/work/") || path === "/ai";

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.slice(2).find((x) => x !== undefined);
const metaContent = (html: string, key: string, by = "name") => {
  const tag = html.match(new RegExp(`<meta[^>]*\\s${by}=["']${key}["'][^>]*>`, "i"))?.[0];
  return tag ? decode(attr(tag, "content") || "") : undefined;
};
const text = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function jsonLdTypes(html: string): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      const t = (v as Record<string, unknown>)["@type"];
      (Array.isArray(t) ? t : [t]).forEach((x) => typeof x === "string" && out.add(x));
      Object.values(v).forEach(walk);
    }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1])); } catch { out.add("(invalid JSON-LD)"); }
  }
  return [...out];
}

function keywordCoverage(keyword: string, fields: { title: string; h1: string; description: string; body: string }) {
  const tokens = keyword.toLowerCase().split(/[^a-z0-9.+#]+/).filter((t) => t && !STOP.has(t));
  // Crude stemming so "scale" matches "scaling" and "connections" matches "connection".
  const stem = (t: string) => t.replace(/\.$/, "").replace(/(ing|ed|es|s)$/, "").replace(/e$/, "");
  const has = (s: string) => {
    const hay = s.toLowerCase();
    return tokens.length > 0 && tokens.every((t) => hay.includes(stem(t)));
  };
  // "On the page" counts the title and description too: crawlers read both.
  return { title: has(fields.title), h1: has(fields.h1), description: has(fields.description), body: has(`${fields.title} ${fields.description} ${fields.body}`) };
}

export async function auditPage(baseUrl: string, path: string, ctx: { sitemap: Set<string>; llms: string; keyword?: string }): Promise<PageAudit> {
  const local = /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl);
  const url = `${baseUrl}${path}`;
  const issues: AuditIssue[] = [];
  const add = (id: string, severity: Severity, message: string) => issues.push({ id, severity, message });
  const t0 = Date.now();
  let status = 0;
  let html = "";
  try {
    const res = await fetch(url, { headers: { "user-agent": "xerk-seo-audit/1.0", accept: "text/html" }, redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(30000) });
    status = res.status;
    html = await res.text();
  } catch (e) {
    add("fetch", "error", `Could not fetch the page: ${e instanceof Error ? e.message : String(e)}`);
  }
  const ms = Date.now() - t0;
  const inSitemap = ctx.sitemap.has(path);
  const inLlms = path === "/" || ctx.llms.includes(`${SITE_URL}${path})`) || ctx.llms.includes(`${SITE_URL}${path} `) || ctx.llms.includes(`(${path})`);
  const base: AuditMeta = { status, h1: 0, h2: 0, words: 0, internalLinks: 0, images: 0, imagesMissingAlt: 0, jsonLdTypes: [], inSitemap, inLlms, ms };
  if (status !== 200 || !html) {
    if (status) add("status", "error", `HTTP ${status}`);
    return { path, url, score: 0, issues, meta: base };
  }

  const head = html.slice(0, html.search(/<body[\s>]/i) > 0 ? html.search(/<body[\s>]/i) : html.length);
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
  const title = decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "");
  const description = metaContent(head, "description") || "";
  const canonicalTag = head.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  const canonical = canonicalTag ? attr(canonicalTag, "href") : undefined;
  const ogImage = !!metaContent(head, "og:image", "property");
  const robots = metaContent(head, "robots") || "";
  const h1s = [...main.matchAll(/<h1[\s>][\s\S]*?<\/h1>/gi)].map((m) => text(m[0]));
  const h2 = (main.match(/<h2[\s>]/gi) || []).length;
  const body = text(main);
  const words = body ? body.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  const imgs = [...main.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imagesMissingAlt = imgs.filter((t) => attr(t, "alt") === undefined).length;
  const site = new URL(SITE_URL);
  const links = new Set<string>();
  for (const m of main.matchAll(/<a\b[^>]*href=["']([^"'#]+)[^"']*["']/gi)) {
    const href = m[1];
    if (href.startsWith("/") && !href.startsWith("//")) links.add(href.split("?")[0]);
    else { try { const u = new URL(href); if (u.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "")) links.add(u.pathname); } catch { /* external or bad */ } }
  }
  links.delete(path);
  const types = jsonLdTypes(html);
  const keyword = ctx.keyword;
  const keywordIn = keyword ? keywordCoverage(keyword, { title, h1: h1s.join(" "), description, body }) : undefined;
  const money = isMoneyPage(path);

  if (/noindex/i.test(robots)) add("noindex", "error", "Page is marked noindex.");
  if (!title) add("title-missing", "error", "No <title>.");
  else if (title.length > 65) add("title-long", "warn", `Title is ${title.length} characters; Google shows about 60.`);
  else if (title.length < 25) add("title-short", "warn", `Title is only ${title.length} characters.`);
  if (!description) add("desc-missing", "error", "No meta description.");
  else if (description.length > 160) add("desc-long", "warn", `Meta description is ${description.length} characters; keep it under 160.`);
  else if (description.length < 70) add("desc-short", "warn", `Meta description is only ${description.length} characters.`);
  if (h1s.length === 0) add("h1-missing", "error", "No <h1>.");
  else if (h1s.length > 1) add("h1-multiple", "warn", `${h1s.length} <h1> elements; use one.`);
  if (h2 === 0 && words > 150) add("h2-missing", "warn", "No <h2> subheadings.");
  if (words < (money ? 300 : 200)) add("thin", money ? "warn" : "info", `Only ${words} words of visible text.`);
  if (links.size < 5) add("few-links", "warn", `Only ${links.size} internal links.`);
  if (imagesMissingAlt) add("img-alt", "warn", `${imagesMissingAlt} of ${imgs.length} images have no alt attribute.`);
  if (!canonical) add("canonical-missing", "error", "No canonical link.");
  else {
    try {
      const c = new URL(canonical, SITE_URL);
      if (c.pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")) add("canonical-mismatch", "warn", `Canonical points to ${c.pathname}.`);
    } catch { add("canonical-bad", "warn", `Canonical "${canonical}" is not a valid URL.`); }
  }
  if (!types.length) add("jsonld-missing", "error", "No JSON-LD structured data.");
  else {
    const missing = expectedTypes(path).filter((t) => !types.includes(t));
    if (missing.length) add("jsonld-types", "warn", `Missing JSON-LD types: ${missing.join(", ")}.`);
    if (types.includes("(invalid JSON-LD)")) add("jsonld-invalid", "error", "A JSON-LD block does not parse.");
  }
  if (!ogImage) add("og-image", "warn", "No og:image for social and chat previews.");
  if (!inSitemap) add("sitemap", "warn", "Not listed in sitemap.xml.");
  if (!inLlms) add("llms", money ? "warn" : "info", "Not linked from llms.txt.");
  if (keyword && keywordIn) {
    if (!keywordIn.body) add("kw-body", "error", `Target keyword "${keyword}" doesn't appear on the page.`);
    else if (!keywordIn.title && !keywordIn.h1) add("kw-title", "warn", `Target keyword "${keyword}" is not in the title or H1.`);
    else if (!keywordIn.description) add("kw-desc", "info", `Target keyword "${keyword}" is not in the meta description.`);
  }
  if (ms > 3000 && !local) add("slow", "info", `HTML took ${(ms / 1000).toFixed(1)}s to load.`);

  const score = Math.max(0, Math.min(100, 100 - issues.reduce((s, i) => s + PENALTY[i.severity], 0)));
  return {
    path, url, score, issues,
    meta: { ...base, title, titleLength: title.length, description, descriptionLength: description.length, h1: h1s.length, h1Text: h1s[0], h2, words, internalLinks: links.size, images: imgs.length, imagesMissingAlt, canonical, ogImage, jsonLdTypes: types, keyword, keywordIn, noindex: /noindex/i.test(robots) },
  };
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const getText = async (url: string) => {
  try {
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30000) });
    return r.ok ? await r.text() : "";
  } catch { return ""; }
};

/** Audit every page in `baseUrl`'s sitemap (or `paths`). `keywords` maps target paths to keywords (defaults to the file). */
export async function auditSite({ baseUrl = SITE_URL, paths, keywords = SEO_KEYWORDS, concurrency = 6 }: { baseUrl?: string; paths?: string[]; keywords?: { keyword: string; target_path: string; priority: number }[]; concurrency?: number } = {}): Promise<AuditRun> {
  const base = baseUrl.replace(/\/$/, "");
  const startedAt = new Date().toISOString();
  const [sitemapXml, llms] = await Promise.all([getText(`${base}/sitemap.xml`), getText(`${base}/llms.txt`)]);
  const sitemap = new Set([...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => { try { return new URL(m[1].trim()).pathname.replace(/(.)\/$/, "$1"); } catch { return ""; } }).filter(Boolean));
  const list = paths?.length ? paths : sitemap.size ? [...sitemap] : ["/", "/hire", "/work", "/ai", "/blog", "/cv"];
  const pages = await pool(list, concurrency, (p) => auditPage(base, p, { sitemap, llms, keyword: keywordForPath(p, keywords) }));
  return { runId: crypto.randomUUID(), baseUrl: base, startedAt, pages };
}

/** Store a run in seo_audits (service-role client). */
export async function saveAudit(db: SupabaseClient, run: AuditRun) {
  const rows = run.pages.map((p) => ({ run_id: run.runId, path: p.path, url: p.url, score: p.score, issues: p.issues, meta: { ...p.meta, baseUrl: run.baseUrl }, checked_at: run.startedAt }));
  const { error } = await db.from("seo_audits").insert(rows);
  if (error) throw new Error(`seo_audits: ${error.message}`);
  return rows.length;
}

/** Keywords from the DB when the table has rows, else the file. */
export async function loadKeywords(db: SupabaseClient | null) {
  if (!db) return SEO_KEYWORDS;
  const { data } = await db.from("seo_keywords").select("keyword,target_path,priority,intent,difficulty,strategy,notes");
  return data?.length ? data : SEO_KEYWORDS;
}
