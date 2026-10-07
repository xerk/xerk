"use client";

import { useMemo, useState } from "react";
import { cx } from "@/lib/utils";
import type { KeywordView } from "@/lib/seo-data";
import { Sparkline } from "@/components/admin/seo-sparkline";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "p1", label: "Priority 1" },
  { key: "transactional", label: "Hire intent" },
  { key: "informational", label: "Content" },
  { key: "navigational", label: "Brand" },
  { key: "ranked", label: "Ranking" },
  { key: "unranked", label: "Not ranking" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const ENGINE: Record<string, string> = { gsc: "GSC", google: "Google", bing: "Bing", web: "Web*" };
const short = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

/** Keyword table with filters, a text search and a rank sparkline per keyword. */
export function SeoKeywordTable({ rows }: { rows: KeywordView[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => rows.filter((r) => {
    if (q && !`${r.keyword} ${r.target_path}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "p1") return r.priority === 1;
    if (filter === "ranked") return r.position !== null;
    if (filter === "unranked") return r.position === null;
    if (filter === "transactional") return r.intent === "transactional" || r.intent === "commercial";
    if (filter === "all") return true;
    return r.intent === filter;
  }), [rows, filter, q]);
  const count = (k: FilterKey) => rows.filter((r) => (k === "all" ? true : k === "p1" ? r.priority === 1 : k === "ranked" ? r.position !== null : k === "unranked" ? r.position === null : k === "transactional" ? r.intent === "transactional" || r.intent === "commercial" : r.intent === k)).length;

  return (
    <div className="xk-seo-kw">
      <div className="xk-seo-kw-tools">
        <div className="xk-seo-tabs" role="tablist" aria-label="Filter keywords">
          {FILTERS.map((f) => <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={cx(filter === f.key && "is-on")} onClick={() => setFilter(f.key)}>{f.label}<b>{count(f.key)}</b></button>)}
        </div>
        <input type="search" className="xk-seo-search" placeholder="Search keywords or pages" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search keywords" />
      </div>
      <div className="xk-seo-table-wrap">
        <table className="xk-seo-table">
          <thead>
            <tr><th>Keyword</th><th className="num">Position</th><th className="num">Change</th><th>Trend</th><th>Target page</th><th>Intent</th><th className="num">P</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.keyword}>
                <td data-label="Keyword"><span className="xk-seo-kw-name" title={r.notes || undefined}>{r.keyword}</span>{r.strategy === "new" && <span className="xk-seo-tag is-new">new page</span>}{r.difficulty && <span className={cx("xk-seo-tag", `is-${r.difficulty}`)}>{r.difficulty}</span>}</td>
                <td data-label="Position" className="num">
                  {r.position !== null ? <strong className={cx("xk-seo-pos", r.position <= 3 ? "is-top3" : r.position <= 10 ? "is-top10" : undefined)}>#{r.position}</strong> : <span className="xk-seo-muted">{r.checks ? `>${r.depth || 20}` : "—"}</span>}
                  {r.engine && <small className="xk-seo-engine" title={r.engine === "web" ? "Web index proxy (Firecrawl), not a Google SERP" : undefined}>{ENGINE[r.engine] || r.engine} · {short(r.checkedAt)}</small>}
                </td>
                <td data-label="Change" className="num">{r.change === null || r.change === 0 ? <span className="xk-seo-muted">{r.checks > 1 ? "±0" : "—"}</span> : <span className={cx("xk-seo-delta", r.change > 0 ? "is-up" : "is-down")}>{r.change > 0 ? "▲" : "▼"} {Math.abs(r.change)}</span>}</td>
                <td data-label="Trend"><Sparkline values={r.history} depth={r.depth || 20} /></td>
                <td data-label="Target"><a className="xk-seo-path" href={r.target_path} target="_blank" rel="noopener noreferrer">{r.target_path}</a></td>
                <td data-label="Intent"><span className={cx("xk-seo-intent", `is-${r.intent}`)}>{r.intent}</span></td>
                <td data-label="Priority" className="num"><span className={cx("xk-seo-prio", `is-p${r.priority}`)}>P{r.priority}</span></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="xk-seo-empty">No keywords match.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="xk-seo-footnote">Web* = web-index proxy (Firecrawl search, top 20), not Google. Connect Search Console or a SERP API for real Google positions.</p>
    </div>
  );
}
