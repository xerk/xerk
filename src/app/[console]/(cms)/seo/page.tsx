import { headers } from "next/headers";
import { SITE_URL } from "@/data/profile";
import { Icon } from "@/components/xerk/icon";
import { AiVisibility, NextActions, PageAudits, SeoCard, SeoKpis } from "@/components/admin/seo-ui";
import { SeoKeywordTable } from "@/components/admin/seo-keywords";
import { SeoRunButton } from "@/components/admin/seo-run-button";
import { getSeoDashboard } from "@/lib/seo-data";
import { runSeoAudit } from "./actions";

export const dynamic = "force-dynamic";
// The "Run audit" server action fetches every sitemap page.
export const maxDuration = 60;
export const metadata = { title: "SEO" };

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const h = (Date.now() - new Date(iso).getTime()) / 36e5;
  return h < 1 ? "just now" : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`;
};

export default async function SeoPage() {
  const [d, h] = await Promise.all([getSeoDashboard(), headers()]);
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const isProduction = host === new URL(SITE_URL).host;
  const k = d.kpis;
  const scoreDelta = d.audit && d.audit.previousAvg !== null ? d.audit.avg - d.audit.previousAvg : null;

  return (
    <div className="xk-seo">
      <header className="xk-seo-head">
        <div>
          <span className="xk-seo-eyebrow">Growth · search and AI assistants</span>
          <h1>SEO</h1>
          <p>Where xerk.io ranks for the keywords that bring in hiring clients, how each page scores, and whether AI assistants cite it.</p>
        </div>
        <SeoRunButton run={runSeoAudit} isProduction={isProduction} />
      </header>

      {!d.configured && <p className="xk-seo-alert"><Icon name="warning-circle" />Supabase service role isn&apos;t configured, so this page shows the keyword map from the repo only.</p>}

      <SeoKpis items={[
        { label: "Avg position", icon: "chart-line-up", tone: "accent", value: k.avgPosition ?? "—", foot: k.ranked ? `${k.ranked} of ${k.tracked} keywords ranking · ${k.rankEngine === "web" ? "web proxy" : k.rankEngine}` : `0 of ${k.tracked} ranking yet`, meter: k.ranked ? 100 - Math.min(100, (k.avgPosition || 100)) : 0 },
        { label: "In the top 10", icon: "trophy", value: <>{k.top10}<small>/{k.tracked}</small></>, foot: `Last check ${ago(k.lastRankCheck)}`, meter: (k.top10 / Math.max(1, k.tracked)) * 100 },
        { label: "Pages audited", icon: "file-text", tone: "agent", value: d.audit ? <>{k.avgScore}<small> avg</small></> : "—", foot: d.audit ? `${k.pagesAudited} pages · ${scoreDelta ? `${scoreDelta > 0 ? "▲" : "▼"} ${Math.abs(scoreDelta)} vs last run · ` : ""}${ago(d.audit.checkedAt)}` : "No audit yet. Run one.", meter: k.avgScore ?? 0 },
        { label: "AI citations", icon: "robot", tone: k.aiCited ? "accent" : "warn", value: <>{k.aiCited}<small>/{k.aiTested} tested</small></>, foot: k.aiUntested ? `${k.aiUntested} prompt × assistant pairs untested` : "All tracked prompts tested", meter: k.aiTested ? (k.aiCited / k.aiTested) * 100 : 0 },
      ]} />

      <div className="xk-seo-grid">
        <SeoCard title="Next actions" icon="lightning" hint={`${d.actions.length} items`} className="is-actions">
          <NextActions items={d.actions} />
        </SeoCard>

        <SeoCard title="AI visibility" icon="sparkle" hint="Latest check per assistant" className="is-ai">
          <AiVisibility rows={d.ai} />
          <p className="xk-seo-footnote">ChatGPT, Perplexity and Gemini can&apos;t be queried from the server. Record their answers with /seo-growth; &quot;Web index&quot; is what a search-backed assistant would retrieve.</p>
        </SeoCard>

        <SeoCard title="Keywords" icon="magnifying-glass" hint={`${d.keywords.length} tracked`} className="is-wide">
          <SeoKeywordTable rows={d.keywords} />
        </SeoCard>

        <SeoCard title="Page audits" icon="file-text" className="is-wide" hint={d.audit ? <>{d.audit.baseUrl.replace(/^https?:\/\//, "")} · {d.audit.issueCounts.error} errors · {d.audit.issueCounts.warn} warnings · {ago(d.audit.checkedAt)}</> : "No audit yet"}>
          {d.pages.length ? <PageAudits pages={d.pages} /> : <p className="xk-seo-empty">Run an audit to score every page in the sitemap.</p>}
        </SeoCard>

        <SeoCard title="Rank sources" icon="link" className="is-wide is-sources">
          <ul className="xk-seo-sources">
            {[
              { on: d.backends.gsc, name: "Google Search Console", env: "GSC_SERVICE_ACCOUNT_JSON + GSC_SITE_URL", note: "Real Google positions, free" },
              { on: d.backends.serper, name: "Serper", env: "SERPER_API_KEY", note: "Google top 100" },
              { on: d.backends.serpapi, name: "SerpAPI", env: "SERPAPI_API_KEY", note: "Google top 100" },
              { on: d.backends.firecrawl, name: "Firecrawl", env: "FIRECRAWL_API_KEY", note: "Web proxy, top 20" },
              { on: d.backends.cron, name: "Weekly audit cron", env: "CRON_SECRET", note: "/api/cron/seo (not scheduled in vercel.json yet)" },
            ].map((s) => <li key={s.name} className={s.on ? "is-on" : undefined}><i /><span><strong>{s.name}</strong><small>{s.note}</small></span><code>{s.env}</code></li>)}
          </ul>
          <p className="xk-seo-footnote">Rank checks run from <code>scripts/seo-rank-check.ts</code> with whichever source is set. Research notes: <code>docs/seo/keyword-map.md</code>.</p>
        </SeoCard>
      </div>
    </div>
  );
}
