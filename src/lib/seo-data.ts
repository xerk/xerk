import { adminDb } from "@/lib/supabase";
import { AI_PROMPTS, SEO_KEYWORDS, type SeoKeyword } from "@/data/seo-keywords";
import type { AuditIssue, AuditMeta, Severity } from "@/lib/seo-audit";

/** Everything the /seo dashboard page shows, computed server-side from seo_keywords, seo_ranks and seo_audits. */

export const SEARCH_ENGINES = ["gsc", "google", "bing", "web"] as const;
export const AI_ENGINES = ["chatgpt", "perplexity", "claude", "gemini"] as const;
const ENGINE_RANK: Record<string, number> = { gsc: 0, google: 1, bing: 2, web: 3 };

export type RankRow = { keyword: string; engine: string; position: number | null; url: string | null; cited: boolean | null; depth: number | null; source: string | null; notes: string | null; checked_at: string };
export type AuditRow = { run_id: string; path: string; url: string | null; score: number; issues: AuditIssue[]; meta: AuditMeta & { baseUrl?: string }; checked_at: string };

export type KeywordView = Pick<SeoKeyword, "keyword" | "intent" | "target_path" | "priority" | "notes"> & {
  difficulty: string | null;
  strategy: string | null;
  engine: string | null;
  position: number | null;
  previous: number | null;
  /** Positive = moved up. Null when there's nothing to compare. */
  change: number | null;
  depth: number | null;
  url: string | null;
  checkedAt: string | null;
  history: (number | null)[];
  checks: number;
};
export type PageView = { path: string; url: string | null; score: number; previous: number | null; issues: AuditIssue[]; meta: AuditMeta };
export type AiCell = { engine: string; cited: boolean | null; position: number | null; notes: string | null; checkedAt: string };
export type AiView = { prompt: string; expect: string; target_path: string; cells: Record<string, AiCell | undefined> };
export type Action = { tone: Severity; title: string; detail: string; href?: string; source: "audit" | "research" | "ranks" };

export type SeoDashboard = {
  configured: boolean;
  keywords: KeywordView[];
  pages: PageView[];
  audit: { runId: string; baseUrl: string; checkedAt: string; avg: number; previousAvg: number | null; issueCounts: Record<Severity, number> } | null;
  ai: AiView[];
  kpis: { avgPosition: number | null; ranked: number; top10: number; tracked: number; pagesAudited: number; avgScore: number | null; aiCited: number; aiTested: number; aiUntested: number; lastRankCheck: string | null; rankEngine: string | null };
  actions: Action[];
  backends: { gsc: boolean; serper: boolean; serpapi: boolean; firecrawl: boolean; cron: boolean };
};

const ISSUE_ACTIONS: Record<string, { title: string; tone: Severity; fix: string }> = {
  "kw-body": { title: "Target keyword missing from the page", tone: "error", fix: "Work the keyword into the intro or a subheading, in a sentence a person would write." },
  "kw-title": { title: "Keyword not in title or H1", tone: "warn", fix: "Rename the H1 or the <title> so it carries the mapped keyword." },
  "kw-desc": { title: "Keyword not in the meta description", tone: "info", fix: "Mention the mapped keyword once in the description; Google bolds it in results." },
  "h2-missing": { title: "Pages without H2 subheadings", tone: "warn", fix: "Break the page into sections with descriptive H2s." },
  "title-short": { title: "Very short titles", tone: "warn", fix: "Say what the page is and who it's for in 40 to 60 characters." },
  "title-missing": { title: "Pages without a <title>", tone: "error", fix: "Add metadata with pageMeta()." },
  "desc-short": { title: "Very short meta descriptions", tone: "warn", fix: "Write one full sentence, 120 to 158 characters." },
  "canonical-missing": { title: "Pages without a canonical link", tone: "error", fix: "Use pageMeta({ path }) so the canonical is set." },
  "jsonld-missing": { title: "Pages without structured data", tone: "error", fix: "Add JSON-LD with the JsonLd component." },
  "jsonld-invalid": { title: "Broken JSON-LD", tone: "error", fix: "A JSON-LD block doesn't parse; check the generated script tag." },
  fetch: { title: "Pages that failed to load", tone: "error", fix: "Check the deployment logs for these paths." },
  "title-long": { title: "Titles longer than ~60 characters", tone: "warn", fix: "Shorten the title, or set an absolute title without the name suffix." },
  "desc-long": { title: "Meta descriptions over 160 characters", tone: "warn", fix: "Trim to one sentence with the keyword in it." },
  "desc-missing": { title: "Pages without a meta description", tone: "error", fix: "Add a description in the page's metadata." },
  "few-links": { title: "Pages with few internal links", tone: "warn", fix: "Link to the related case study, posts and the matching /hire page." },
  thin: { title: "Thin pages", tone: "warn", fix: "Add first-hand detail: what you built, numbers from the CV, what went wrong." },
  "img-alt": { title: "Images without alt text", tone: "warn", fix: "Describe what the image shows; use alt=\"\" only for decoration." },
  "jsonld-types": { title: "Missing structured data types", tone: "warn", fix: "Add the expected JSON-LD (see the issue text for which types)." },
  sitemap: { title: "Pages missing from sitemap.xml", tone: "warn", fix: "Add them in src/app/sitemap.ts." },
  llms: { title: "Pages missing from llms.txt", tone: "info", fix: "Link them from src/app/llms.txt/route.ts so AI crawlers find them." },
  "h1-multiple": { title: "Pages with more than one H1", tone: "warn", fix: "Keep one H1 per page." },
  "h1-missing": { title: "Pages without an H1", tone: "error", fix: "Add a single H1 with the page's main keyword." },
  "canonical-mismatch": { title: "Canonical points elsewhere", tone: "warn", fix: "Set alternates.canonical to the page's own path." },
  "og-image": { title: "No social preview image", tone: "warn", fix: "pageMeta() adds one; check the page uses it." },
  slow: { title: "Slow HTML responses", tone: "info", fix: "Check for uncached data fetches on these pages." },
  status: { title: "Pages returning errors", tone: "error", fix: "Fix or remove them from the sitemap." },
  noindex: { title: "Pages marked noindex", tone: "error", fix: "Remove the robots noindex unless it's intentional." },
};

/** Things the research found that no audit can fix from inside the repo. Shown until the related signal appears. */
function researchActions(d: { anyGoogleRank: boolean; backends: SeoDashboard["backends"]; aiUntested: number }): Action[] {
  const out: Action[] = [];
  if (!d.anyGoogleRank) out.push({ tone: "error", source: "research", title: "Get the site indexed in Google", detail: "Only the home page was found in the index, with a 2024 title. In Search Console: resubmit sitemap.xml and request indexing for /, /hire, both /hire pages and the case studies.", href: "https://search.google.com/search-console" });
  if (!d.backends.gsc && !d.backends.serper && !d.backends.serpapi) out.push({ tone: "warn", source: "research", title: "Connect a rank source", detail: "Set GSC_SERVICE_ACCOUNT_JSON + GSC_SITE_URL (real Google positions, free) or SERPER_API_KEY, then run scripts/seo-rank-check.ts. Until then ranks come from manual web-index checks." });
  out.push({ tone: "warn", source: "research", title: "Add the site to Bing Webmaster Tools", detail: "Import from Search Console. Bing's index feeds ChatGPT search and Copilot.", href: "https://www.bing.com/webmasters" });
  out.push({ tone: "warn", source: "research", title: "Make other profiles match the site", detail: "GitHub says 7+ years, Happenstance and old Scribd CVs say 8+, Himalayas lists Saudi Arabia, F6S says CTO. Assistants hedge when facts disagree: update them to 10+ years, Cairo, Senior Full-Stack & AI Engineer." });
  out.push({ tone: "info", source: "research", title: "Noindex the unrelated subdomains", detail: "stock., pinpund., tr. (a time-tracker login) and multy-app.xerk.io show up for brand searches." });
  out.push({ tone: "info", source: "research", title: "Put real profile URLs in sameAs", detail: "LinkedIn and X go through dub.sh short links, which search engines can't match to a profile. Save the full URLs in Site data → socials." });
  out.push({ tone: "info", source: "research", title: "Earn a few third-party mentions", detail: "A [For Hire] post in r/forhire, an Upwork profile linking to xerk.io, and dev.to cross-posts of the reconnect-storm and MCP posts with a canonical link." });
  if (d.aiUntested) out.push({ tone: "info", source: "research", title: "Check AI assistants by hand", detail: `${d.aiUntested} prompt/assistant pairs are untested. Ask ChatGPT, Perplexity and Gemini the tracked prompts and record whether they cite xerk.io (or run /seo-growth).` });
  return out;
}

export async function getSeoDashboard(): Promise<SeoDashboard> {
  const db = adminDb();
  const backends = { gsc: !!process.env.GSC_SERVICE_ACCOUNT_JSON, serper: !!process.env.SERPER_API_KEY, serpapi: !!process.env.SERPAPI_API_KEY, firecrawl: !!process.env.FIRECRAWL_API_KEY, cron: !!process.env.CRON_SECRET };
  let kwRows: (Pick<SeoKeyword, "keyword" | "intent" | "target_path" | "priority" | "notes"> & { difficulty: string | null; strategy: string | null })[] = SEO_KEYWORDS;
  let ranks: RankRow[] = [];
  let audits: AuditRow[] = [];
  if (db) {
    const [k, r, recent] = await Promise.all([
      db.from("seo_keywords").select("keyword,intent,target_path,priority,difficulty,strategy,notes"),
      db.from("seo_ranks").select("keyword,engine,position,url,cited,depth,source,notes,checked_at").order("checked_at", { ascending: true }).limit(5000),
      db.from("seo_audits").select("run_id,url,checked_at").order("checked_at", { ascending: false }).limit(1000),
    ]);
    if (k.data?.length) kwRows = k.data as typeof kwRows;
    ranks = (r.data || []) as RankRow[];
    const origin = (u: string | null) => { try { return u ? new URL(u).origin : ""; } catch { return ""; } };
    const runs = [...new Map((recent.data || []).map((x) => [x.run_id as string, origin(x.url)])).entries()];
    const runId = runs[0]?.[0];
    if (runId) {
      // The latest run plus the previous run against the same host (for score deltas).
      const prevId = runs.find(([id, o]) => id !== runId && o === runs[0][1])?.[0];
      const ids = [runId, ...(prevId ? [prevId] : [])];
      const { data } = await db.from("seo_audits").select("run_id,path,url,score,issues,meta,checked_at").in("run_id", ids);
      audits = (data || []) as AuditRow[];
    }
  }

  // Keywords: latest search-engine check per keyword (best engine first: gsc > google > bing > web).
  const keywords: KeywordView[] = kwRows.map((k) => {
    const rows = ranks.filter((r) => r.keyword === k.keyword && (SEARCH_ENGINES as readonly string[]).includes(r.engine));
    const engine = rows.length ? [...new Set(rows.map((r) => r.engine))].sort((a, b) => ENGINE_RANK[a] - ENGINE_RANK[b])[0] : null;
    const series = rows.filter((r) => r.engine === engine);
    const last = series.at(-1), prev = series.at(-2);
    const change = last && prev && last.position !== null && prev.position !== null ? prev.position - last.position : last && prev && last.position !== null && prev.position === null ? (last.depth || 100) - last.position : null;
    return { ...k, engine, position: last?.position ?? null, previous: prev?.position ?? null, change, depth: last?.depth ?? null, url: last?.url ?? null, checkedAt: last?.checked_at ?? null, history: series.slice(-12).map((r) => r.position), checks: series.length };
  }).sort((a, b) => a.priority - b.priority || (a.position ?? 999) - (b.position ?? 999) || a.keyword.localeCompare(b.keyword));

  // Audit: latest run, worst pages first.
  let audit: SeoDashboard["audit"] = null;
  let pages: PageView[] = [];
  if (audits.length) {
    const latestRun = audits.reduce((a, b) => (a.checked_at > b.checked_at ? a : b)).run_id;
    const cur = audits.filter((a) => a.run_id === latestRun);
    const prev = audits.filter((a) => a.run_id !== latestRun);
    pages = cur.map((a) => ({ path: a.path, url: a.url, score: a.score, previous: prev.find((p) => p.path === a.path)?.score ?? null, issues: a.issues, meta: a.meta })).sort((a, b) => a.score - b.score || a.path.localeCompare(b.path));
    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);
    const issueCounts = { error: 0, warn: 0, info: 0 } as Record<Severity, number>;
    cur.forEach((a) => a.issues.forEach((i) => issueCounts[i.severity]++));
    audit = { runId: latestRun, baseUrl: cur[0]?.meta?.baseUrl || cur[0]?.url?.replace(/^(https?:\/\/[^/]+).*$/, "$1") || "", checkedAt: cur[0].checked_at, avg: avg(cur.map((a) => a.score)), previousAvg: prev.length ? avg(prev.map((a) => a.score)) : null, issueCounts };
  }

  // AI visibility: tracked prompts × assistants, latest result each.
  const promptSet = new Map(AI_PROMPTS.map((p) => [p.prompt, p]));
  ranks.filter((r) => (AI_ENGINES as readonly string[]).includes(r.engine) && !promptSet.has(r.keyword)).forEach((r) => promptSet.set(r.keyword, { prompt: r.keyword, expect: "", target_path: "/" }));
  const ai: AiView[] = [...promptSet.values()].map((p) => {
    const cells: AiView["cells"] = {};
    for (const e of [...AI_ENGINES, "web"]) {
      const last = ranks.filter((r) => r.keyword === p.prompt && r.engine === e).at(-1);
      if (last) cells[e] = { engine: e, cited: last.cited, position: last.position, notes: last.notes, checkedAt: last.checked_at };
    }
    return { ...p, cells };
  });
  const aiCells = ai.flatMap((a) => AI_ENGINES.map((e) => a.cells[e]));
  const aiTested = aiCells.filter((c) => c && c.cited !== null).length;
  const aiCited = aiCells.filter((c) => c?.cited).length;
  const aiUntested = aiCells.length - aiTested;

  const ranked = keywords.filter((k) => k.position !== null);
  const searchRows = ranks.filter((r) => (SEARCH_ENGINES as readonly string[]).includes(r.engine));
  const kpis: SeoDashboard["kpis"] = {
    avgPosition: ranked.length ? Math.round((ranked.reduce((s, k) => s + (k.position || 0), 0) / ranked.length) * 10) / 10 : null,
    ranked: ranked.length,
    top10: ranked.filter((k) => (k.position || 99) <= 10).length,
    tracked: keywords.length,
    pagesAudited: pages.length,
    avgScore: audit?.avg ?? null,
    aiCited, aiTested, aiUntested,
    lastRankCheck: searchRows.at(-1)?.checked_at ?? null,
    rankEngine: searchRows.at(-1)?.engine ?? null,
  };

  // Next actions: grouped audit issues (worst first), then rank gaps, then research items.
  const grouped = new Map<string, { pages: string[]; sample: string; severity: Severity }>();
  pages.forEach((p) => p.issues.forEach((i) => {
    const g = grouped.get(i.id) || { pages: [], sample: i.message, severity: i.severity };
    g.pages.push(p.path);
    grouped.set(i.id, g);
  }));
  const sevRank: Record<Severity, number> = { error: 0, warn: 1, info: 2 };
  const auditActions: Action[] = [...grouped.entries()].sort((a, b) => sevRank[a[1].severity] - sevRank[b[1].severity] || b[1].pages.length - a[1].pages.length).map(([id, g]) => {
    const meta = ISSUE_ACTIONS[id];
    const list = g.pages.slice(0, 4).join(", ") + (g.pages.length > 4 ? ` and ${g.pages.length - 4} more` : "");
    return { tone: g.severity, source: "audit", title: `${meta?.title || g.sample} (${g.pages.length})`, detail: `${meta?.fix || g.sample} Pages: ${list}.` };
  });
  const unranked = keywords.filter((k) => k.priority === 1 && k.position === null);
  const rankActions: Action[] = unranked.length ? [{ tone: "warn", source: "ranks", title: `${unranked.length} priority-1 keywords not ranking yet`, detail: `${unranked.slice(0, 5).map((k) => `"${k.keyword}" → ${k.target_path}`).join("; ")}${unranked.length > 5 ? "; …" : ""}. Get the target pages indexed first, then link to them from posts and profiles.` }] : [];
  const research = researchActions({ anyGoogleRank: ranks.some((r) => (r.engine === "google" || r.engine === "gsc") && r.position !== null), backends, aiUntested });
  const actions = [...auditActions.filter((a) => a.tone === "error"), ...research.filter((a) => a.tone === "error"), ...rankActions, ...auditActions.filter((a) => a.tone !== "error"), ...research.filter((a) => a.tone !== "error")];

  return { configured: !!db, keywords, pages, audit, ai, kpis, actions, backends };
}
