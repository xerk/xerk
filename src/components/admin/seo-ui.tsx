import type { ReactNode } from "react";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import type { Action, AiView, PageView } from "@/lib/seo-data";
import { AI_ENGINES } from "@/lib/seo-data";
export { Sparkline } from "@/components/admin/seo-sparkline";

/* Presentational pieces for the SEO page (no hooks). Styles: src/styles/seo.css, scoped under .xk-seo. */

export function SeoCard({ title, icon, hint, actions, className, children, id }: { title: string; icon: string; hint?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode; id?: string }) {
  return (
    <section className={cx("xk-seo-card", className)} id={id}>
      <header>
        <h2><Icon name={icon} />{title}</h2>
        {(hint || actions) && <div className="xk-seo-card-tools">{hint && <span className="xk-seo-hint">{hint}</span>}{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export type SeoKpi = { label: string; icon: string; value: ReactNode; foot: ReactNode; tone?: "accent" | "agent" | "warn"; meter?: number };

export function SeoKpis({ items }: { items: SeoKpi[] }) {
  return (
    <div className="xk-seo-kpis">
      {items.map((k, i) => (
        <div key={k.label} className={cx("xk-seo-kpi", k.tone && `is-${k.tone}`)} style={{ animationDelay: `${i * 60}ms` }}>
          <span className="xk-seo-kpi-label"><Icon name={k.icon} />{k.label}</span>
          <span className="xk-seo-kpi-value">{k.value}</span>
          {k.meter !== undefined && <span className="xk-seo-meter" aria-hidden><i style={{ width: `${Math.max(2, Math.min(100, k.meter))}%` }} /></span>}
          <span className="xk-seo-kpi-foot">{k.foot}</span>
        </div>
      ))}
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  return <span className={cx("xk-seo-score", score >= 90 ? "is-good" : score >= 75 ? "is-ok" : "is-bad")}>{score}</span>;
}

const SEV_ICON = { error: "warning-circle", warn: "warning-circle", info: "info" } as const;

export function PageAudits({ pages }: { pages: PageView[] }) {
  return (
    <ul className="xk-seo-pages">
      {pages.map((p) => {
        const delta = p.previous === null ? null : p.score - p.previous;
        return (
          <li key={p.path}>
            <details>
              <summary>
                <ScorePill score={p.score} />
                <span className="xk-seo-page-path" title={p.meta.title}>{p.path}</span>
                {delta !== null && delta !== 0 && <span className={cx("xk-seo-delta", delta > 0 ? "is-up" : "is-down")}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)}</span>}
                <span className="xk-seo-page-bar" aria-hidden><i style={{ width: `${p.score}%` }} /></span>
                <span className="xk-seo-page-top">{p.issues[0]?.message || "No issues"}</span>
                <span className="xk-seo-page-count">{p.issues.length ? `${p.issues.length} issue${p.issues.length > 1 ? "s" : ""}` : "clean"}</span>
              </summary>
              <div className="xk-seo-page-body">
                {p.issues.length > 0 && <ul className="xk-seo-issues">{p.issues.map((i) => <li key={i.id} className={`is-${i.severity}`}><Icon name={SEV_ICON[i.severity]} />{i.message}</li>)}</ul>}
                <dl className="xk-seo-facts">
                  <div><dt>Title</dt><dd>{p.meta.title || "—"} <small>{p.meta.titleLength ?? 0} ch</small></dd></div>
                  <div><dt>Description</dt><dd>{p.meta.description || "—"} <small>{p.meta.descriptionLength ?? 0} ch</small></dd></div>
                  <div><dt>H1</dt><dd>{p.meta.h1Text || "—"}{p.meta.h1 > 1 && <small> +{p.meta.h1 - 1} more</small>}</dd></div>
                  <div><dt>Content</dt><dd>{p.meta.words} words · {p.meta.h2} H2 · {p.meta.internalLinks} internal links · {p.meta.images} images</dd></div>
                  <div><dt>JSON-LD</dt><dd>{p.meta.jsonLdTypes?.join(", ") || "none"}</dd></div>
                  <div><dt>Keyword</dt><dd>{p.meta.keyword ? <>{p.meta.keyword} <small>{p.meta.keywordIn ? Object.entries(p.meta.keywordIn).filter(([, v]) => v).map(([k]) => k).join(", ") || "not found" : ""}</small></> : "not mapped"}</dd></div>
                  <div><dt>Listed in</dt><dd>{[p.meta.inSitemap && "sitemap.xml", p.meta.inLlms && "llms.txt"].filter(Boolean).join(", ") || "neither"}</dd></div>
                </dl>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

const ENGINE_LABEL: Record<string, string> = { chatgpt: "ChatGPT", perplexity: "Perplexity", claude: "Claude", gemini: "Gemini", web: "Web index" };

export function AiVisibility({ rows }: { rows: AiView[] }) {
  const engines = [...AI_ENGINES, "web"];
  return (
    <div className="xk-seo-ai">
      <div className="xk-seo-ai-legend">
        <span><i className="is-yes" />Cites xerk.io</span><span><i className="is-no" />Doesn&apos;t</span><span><i className="is-untested" />Untested</span>
      </div>
      <div className="xk-seo-ai-scroll">
        <table>
          <thead><tr><th>Prompt</th>{engines.map((e) => <th key={e}>{ENGINE_LABEL[e]}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.prompt}>
                <th scope="row"><span>{r.prompt}</span>{r.expect && <small>Want: {r.expect}</small>}</th>
                {engines.map((e) => {
                  const c = r.cells[e];
                  const state = e === "web" ? (c ? (c.position ? "yes" : "no") : "untested") : !c || c.cited === null ? "untested" : c.cited ? "yes" : "no";
                  const label = e === "web" && c?.position ? `#${c.position}` : state === "yes" ? "Cited" : state === "no" ? "No" : "—";
                  return <td key={e}><span className={`xk-seo-cell is-${state}`} title={c?.notes || (state === "untested" ? "Not tested yet" : "")}>{label}</span></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SOURCE_LABEL = { audit: "Audit", research: "Research", ranks: "Ranks" } as const;

export function NextActions({ items }: { items: Action[] }) {
  if (!items.length) return <p className="xk-seo-empty">Nothing to do. Run an audit to refresh.</p>;
  return (
    <ol className="xk-seo-actions">
      {items.map((a, i) => (
        <li key={`${a.title}-${i}`} className={`is-${a.tone}`}>
          <span className="xk-seo-action-n">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <strong>{a.href ? <a href={a.href} target="_blank" rel="noopener noreferrer">{a.title}<Icon name="arrow-up-right" /></a> : a.title}</strong>
            <p>{a.detail}</p>
          </div>
          <span className="xk-seo-action-src">{SOURCE_LABEL[a.source]}</span>
        </li>
      ))}
    </ol>
  );
}
