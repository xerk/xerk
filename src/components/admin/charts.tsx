"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import type { Kpi, Point } from "@/lib/dashboard";

/* ---------- theme colours (recharts needs real values, not CSS vars) ---------- */

type Palette = { accent: string; agent: string; ink: string; muted: string; line: string; surface: string; series: string[] };
const read = (n: string, fb: string) => (typeof window === "undefined" ? fb : getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb);
function palette(): Palette {
  const accent = read("--accent", "#c6f432"), agent = read("--agent", "#8b7bff");
  return { accent, agent, ink: read("--ink", "#f2f3f5"), muted: read("--ink-muted", "#9ba1aa"), line: read("--border", "#2a2d33"), surface: read("--surface", "#121418"), series: [accent, agent, "#4cc9f0", "#ffb547", "#ff7a66", "#7dd3a8"] };
}
export function usePalette() {
  const [p, setP] = useState<Palette | null>(null);
  useEffect(() => {
    setP(palette());
    const mo = new MutationObserver(() => setP(palette()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
  }, []);
  return p;
}

/* ---------- animated number ---------- */

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    const start = performance.now(), a = from.current, dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

/* ---------- KPI cards with sparklines ---------- */

const KPI_ICON: Record<string, string> = { visitors: "users", pageviews: "eye", perVisit: "stack", conversions: "handshake", leads: "envelope-simple", cv: "download-simple" };

export function KpiCards({ items, rangeLabel }: { items: Kpi[]; rangeLabel: string }) {
  const p = usePalette();
  return (
    <div className="xk-dash-kpis">
      {items.map((k, i) => {
        const up = (k.delta ?? 0) > 0, down = (k.delta ?? 0) < 0;
        const color = p ? (i === 0 ? p.accent : i === 1 ? p.agent : p.muted) : "transparent";
        return (
          <div key={k.key} className={cx("xk-dash-kpi", i === 0 && "is-hero")} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="xk-dash-kpi-top">
              <span className="xk-dash-kpi-label"><Icon name={KPI_ICON[k.key] || "chart-line-up"} />{k.label}</span>
              <span className={cx("xk-dash-delta", up && "is-up", down && "is-down")} title={`Previous ${rangeLabel}: ${k.prev}`}>
                {k.delta === null ? "new" : `${up ? "▲" : down ? "▼" : "•"} ${Math.abs(k.delta)}%`}
              </span>
            </div>
            <div className="xk-dash-kpi-value"><CountUp value={k.value} decimals={k.format === "dec" ? 1 : 0} /></div>
            <div className="xk-dash-spark">
              {p && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={k.series.map((v, j) => ({ j, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs><linearGradient id={`sp-${k.key}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#sp-${k.key})`} isAnimationActive animationDuration={900} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <span className="xk-dash-kpi-foot">vs {k.prev.toLocaleString("en-US", { maximumFractionDigits: 1 })} previous {rangeLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- main traffic chart ---------- */

const METRICS = [
  { key: "visitors", label: "Visitors" },
  { key: "pageviews", label: "Pageviews" },
  { key: "actions", label: "Actions" },
] as const;

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="xk-dash-tip">
      <strong>{label}</strong>
      {payload.map((r) => <span key={r.name}><i style={{ background: r.color }} />{r.name}<b>{r.value.toLocaleString()}</b></span>)}
    </div>
  );
}

export function TrafficChart({ data }: { data: Point[] }) {
  const p = usePalette();
  const [on, setOn] = useState<Record<string, boolean>>({ visitors: true, pageviews: true, actions: false });
  const colors: Record<string, string> = p ? { visitors: p.accent, pageviews: p.agent, actions: "#4cc9f0" } : {};
  const total = (k: keyof Point) => data.reduce((s, d) => s + (d[k] as number), 0);
  return (
    <div className="xk-dash-traffic">
      <div className="xk-dash-legend" role="group" aria-label="Series">
        {METRICS.map((m) => (
          <button key={m.key} type="button" aria-pressed={on[m.key]} onClick={() => setOn((o) => ({ ...o, [m.key]: !o[m.key] }))}>
            <i style={{ background: colors[m.key] }} />{m.label}<b>{total(m.key).toLocaleString()}</b>
          </button>
        ))}
      </div>
      <div className="xk-dash-chart">
        {p && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
              <defs>
                {METRICS.map((m) => (
                  <linearGradient key={m.key} id={`g-${m.key}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={colors[m.key]} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={colors[m.key]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={p.line} strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: p.muted, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fill: p.muted, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: p.muted, strokeDasharray: "4 4" }} />
              {METRICS.filter((m) => on[m.key]).map((m) => (
                <Area key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={colors[m.key]} strokeWidth={2.25} fill={`url(#g-${m.key})`} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={900} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ---------- donut ---------- */

export function Donut({ items, centerLabel }: { items: [string, number][]; centerLabel: string }) {
  const p = usePalette();
  const total = items.reduce((s, [, n]) => s + n, 0);
  const [hover, setHover] = useState<number | null>(null);
  if (!items.length) return <p className="xk-dash-empty">No data yet</p>;
  const shown = hover === null ? { label: centerLabel, value: total } : { label: items[hover][0], value: items[hover][1] };
  return (
    <div className="xk-dash-donut">
      <div className="xk-dash-donut-chart">
        {p && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={items.map(([name, value]) => ({ name, value }))} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none" onMouseLeave={() => setHover(null)} onMouseEnter={(_, i) => setHover(i)} animationDuration={900}>
                {items.map((_, i) => <Cell key={i} fill={p.series[i % p.series.length]} opacity={hover === null || hover === i ? 1 : 0.35} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="xk-dash-donut-center"><b>{shown.value.toLocaleString()}</b><span>{shown.label}</span></div>
      </div>
      <ul className="xk-dash-donut-legend">
        {items.map(([k, n], i) => (
          <li key={k} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cx(hover === i && "is-on")}>
            <i style={{ background: p?.series[i % (p?.series.length || 1)] }} /><span>{k}</span><b>{total ? Math.round((n / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- bar list ---------- */

const flag = (c: string) => (c.length === 2 ? String.fromCodePoint(...[...c.toUpperCase()].map((x) => 127397 + x.charCodeAt(0))) : "🌐");

export function BarList({ items, kind, empty = "No data yet" }: { items: [string, number][]; kind?: "country" | "event" | "page"; empty?: string }) {
  const max = Math.max(1, ...items.map(([, n]) => n));
  if (!items.length) return <p className="xk-dash-empty">{empty}</p>;
  return (
    <ul className="xk-dash-bars">
      {items.map(([k, n], i) => (
        <li key={k} style={{ ["--w" as string]: `${(n / max) * 100}%`, animationDelay: `${i * 40}ms` }}>
          <span className="xk-dash-bar-label">
            {kind === "country" && <em>{flag(k)}</em>}
            {kind === "event" ? k.replace(/_/g, " ") : kind === "country" ? (regionName(k) || k) : k}
          </span>
          <b>{n.toLocaleString()}</b>
        </li>
      ))}
    </ul>
  );
}
function regionName(c: string) {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c.toUpperCase()); } catch { return null; }
}

/* ---------- weekday × hour heatmap ---------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  return (
    <div className="xk-dash-heat" role="img" aria-label="Pageviews by weekday and hour (UTC)">
      {grid.map((row, d) => (
        <div key={d} className="xk-dash-heat-row">
          <span>{DAYS[d]}</span>
          {row.map((v, h) => <i key={h} title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 UTC · ${v} views`} style={{ ["--a" as string]: v ? 0.15 + (v / max) * 0.85 : 0 }} />)}
        </div>
      ))}
      <div className="xk-dash-heat-row is-axis"><span />{Array.from({ length: 24 }, (_, h) => <em key={h}>{h % 6 === 0 ? `${h}h` : ""}</em>)}</div>
    </div>
  );
}

/* ---------- range tabs + live refresh ---------- */

export function RangeTabs({ value, ranges }: { value: string; ranges: { key: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="xk-dash-range" aria-label="Date range">
      {ranges.map((r) => <Link key={r.key} href={`${path}?range=${r.key}`} aria-current={r.key === value ? "page" : undefined} scroll={false}>{r.label}</Link>)}
    </nav>
  );
}

export function LiveBadge({ live, generatedAt, every = 30 }: { live: number; generatedAt: string; every?: number }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const refresh = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, every * 1000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, [router, every]);
  const ago = Math.max(0, Math.round((now - Date.parse(generatedAt)) / 1000));
  return (
    <div className="xk-dash-live">
      <span className={cx("xk-dash-live-dot", live > 0 && "is-on")} />
      <b>{live}</b> online now
      <span className="xk-dash-live-sep" />
      <button type="button" onClick={() => router.refresh()} title="Refresh now"><Icon name="arrows-clockwise" />{ago < 5 ? "just now" : `${ago}s ago`}</button>
    </div>
  );
}

/* ---------- activity feed ---------- */

const EVENT_ICON: Record<string, string> = { pageview: "eye", cv_download: "download-simple", hire_click: "handshake", upwork_click: "briefcase", book_call: "calendar-dots", ask_cv_question: "sparkle", terminal_command: "terminal-window", achievement_unlocked: "trophy", lead_submit: "envelope-simple" };
export function Feed({ items }: { items: { at: string; name: string; path: string | null; country: string | null; city: string | null; source: string }[] }) {
  const [now] = useState(() => Date.now());
  const rel = useMemo(() => (iso: string) => {
    const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
    return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : s < 86400 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`;
  }, [now]);
  if (!items.length) return <p className="xk-dash-empty">No activity yet</p>;
  return (
    <ol className="xk-dash-feed">
      {items.map((e, i) => (
        <li key={i} style={{ animationDelay: `${i * 30}ms` }}>
          <span className={cx("xk-dash-feed-icon", e.name !== "pageview" && "is-action")}><Icon name={EVENT_ICON[e.name] || "cursor-click"} /></span>
          <span className="xk-dash-feed-text">
            <strong>{e.name === "pageview" ? e.path || "/" : e.name.replace(/_/g, " ")}</strong>
            <small>{e.country ? `${flag(e.country)} ${e.city || e.country}` : "Unknown"} · {e.source}</small>
          </span>
          <time dateTime={e.at}>{rel(e.at)}</time>
        </li>
      ))}
    </ol>
  );
}
