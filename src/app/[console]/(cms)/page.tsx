import Link from "next/link";
import type { ReactNode } from "react";
import { adminHref } from "@/lib/admin-path";
import { Icon } from "@/components/xerk/icon";
import { BarList, Donut, Feed, Heatmap, KpiCards, LiveBadge, RangeTabs, TrafficChart } from "@/components/admin/charts";
import { getDashboard, isRange, RANGES } from "@/lib/dashboard";
import { adminDb, supabaseEnabled } from "@/lib/supabase";
import { telegramEnabled } from "@/lib/telegram";
import { cx } from "@/lib/utils";
import { getSite } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

function Card({ title, icon, action, className, children }: { title: string; icon: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cx("xk-dash-card", className)}>
      <header><h2><Icon name={icon} />{title}</h2>{action}</header>
      {children}
    </section>
  );
}

const greeting = () => { const h = new Date().getUTCHours() + 3; return h % 24 < 12 ? "Good morning" : h % 24 < 18 ? "Good afternoon" : "Good evening"; };

export default async function Overview({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: raw } = await searchParams;
  const range = isRange(raw) ? raw : "7d";
  const db = adminDb();
  const [d, site, counts] = await Promise.all([
    getDashboard(range),
    getSite(),
    db ? Promise.all([
      db.from("posts").select("slug", { count: "exact", head: true }).eq("status", "published"),
      db.from("posts").select("slug", { count: "exact", head: true }).neq("status", "published"),
      db.from("projects").select("slug", { count: "exact", head: true }).eq("published", true),
      db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]).then((r) => r.map((x) => x.count ?? 0)) : Promise.resolve([0, 0, 0, 0]),
  ]);
  const [livePosts, drafts, liveProjects, newLeads] = counts;
  const label = RANGES[range].label;
  const checks = [
    { label: "Supabase", ok: supabaseEnabled && !!db },
    { label: "PostHog", ok: !!process.env.NEXT_PUBLIC_POSTHOG_KEY },
    { label: "Telegram", ok: telegramEnabled },
    { label: "AI", ok: !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL) },
    { label: "GitHub", ok: !!process.env.GITHUB_TOKEN },
    { label: "Tadween", ok: !!(process.env.TADWEEN_API_KEY || process.env.POSTIZ_API_KEY) },
  ];
  const first = site.profile.name.split(" ")[0];

  return (
    <div className="xk-dash">
      <header className="xk-dash-head">
        <div>
          <span className="xk-dash-eyebrow">{greeting()}{first ? `, ${first}` : ""}</span>
          <h1>Overview</h1>
        </div>
        <div className="xk-dash-head-tools">
          <LiveBadge live={d.live} generatedAt={d.generatedAt} />
          <RangeTabs value={range} ranges={Object.entries(RANGES).map(([key, r]) => ({ key, label: key }))} />
          <Link className="xk-btn xk-btn-primary xk-btn-sm" href={adminHref("/posts/new")}><Icon name="plus" />New post</Link>
        </div>
      </header>

      <KpiCards items={d.kpis} rangeLabel={label} />

      <div className="xk-dash-grid">
        <Card title="Traffic" icon="chart-line-up" className="is-wide" action={<span className="xk-dash-hint">{d.hourly ? "Hourly, UTC" : "Daily, UTC"}</span>}>
          <TrafficChart data={d.series} />
        </Card>
        <Card title="Sources" icon="globe">
          <Donut items={d.sources} centerLabel="sessions" />
        </Card>

        <Card title="Top pages" icon="file-text"><BarList items={d.pages} kind="page" empty="No pageviews in this range" /></Card>
        <Card title="Countries" icon="globe-hemisphere-west"><BarList items={d.countries} kind="country" /></Card>
        <Card title="Actions" icon="cursor-click"><BarList items={d.actions} kind="event" empty="No tracked actions" /></Card>

        <Card title="When people visit" icon="calendar-dots" className="is-wide" action={<span className="xk-dash-hint">Pageviews, UTC</span>}>
          <Heatmap grid={d.heat} />
        </Card>
        <Card title="Live activity" icon="eye" className="is-tall">
          <Feed items={d.feed} />
        </Card>

        <Card title="Latest leads" icon="envelope-simple" action={<Link className="xk-dash-link" href={adminHref("/leads")}>All leads <Icon name="arrow-right" /></Link>}>
          {d.leads.length === 0 ? <p className="xk-dash-empty">No leads in the last {label}</p> : (
            <ul className="xk-dash-leads">
              {d.leads.map((l) => (
                <li key={l.id}>
                  <span className="xk-dash-avatar">{(l.name || l.email)[0]?.toUpperCase()}</span>
                  <span><strong>{l.name || l.email}</strong><small>{l.service || l.budget || l.email}</small></span>
                  <time>{new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Content" icon="pen-nib">
          <div className="xk-dash-tiles">
            <Link href={adminHref("/posts")}><b>{livePosts}</b><span>Live posts</span></Link>
            <Link href={adminHref("/posts")}><b>{drafts}</b><span>Drafts</span></Link>
            <Link href={adminHref("/projects")}><b>{liveProjects}</b><span>Projects</span></Link>
            <Link href={adminHref("/leads")} className={cx(newLeads > 0 && "is-hot")}><b>{newLeads}</b><span>New leads</span></Link>
          </div>
        </Card>
        <Card title="Integrations" icon="plugs-connected">
          <ul className="xk-dash-checks">
            {checks.map((c) => <li key={c.label} className={cx(c.ok && "is-ok")}><i />{c.label}<span>{c.ok ? "on" : "off"}</span></li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
