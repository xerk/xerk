import Link from "next/link";
import { adminHref } from "@/lib/admin-path";
import { Icon } from "@/components/xerk/icon";
import { Chip, EmptyState, KpiGrid, PageHeader, Panel, RankList } from "@/components/admin/ui";
import { getStats } from "@/lib/stats";
import { adminDb, supabaseEnabled } from "@/lib/supabase";
import { telegramEnabled } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const db = adminDb();
  const [week, counts] = await Promise.all([
    getStats(7),
    db ? Promise.all([
      db.from("posts").select("slug", { count: "exact", head: true }).eq("status", "published"),
      db.from("posts").select("slug", { count: "exact", head: true }).neq("status", "published"),
      db.from("projects").select("slug", { count: "exact", head: true }).eq("published", true),
      db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]).then((r) => r.map((x) => x.count ?? 0)) : Promise.resolve([0, 0, 0, 0]),
  ]);
  const [livePosts, drafts, liveProjects, newLeads] = counts;
  const visits = db ? (await db.from("visits").select("*").order("created_at", { ascending: false }).limit(20)).data || [] : [];
  const checks = [
    { label: "Supabase", ok: supabaseEnabled && !!db, hint: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY" },
    { label: "PostHog", ok: !!process.env.NEXT_PUBLIC_POSTHOG_KEY, hint: "NEXT_PUBLIC_POSTHOG_KEY (+ POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID for stats)" },
    { label: "Telegram", ok: telegramEnabled, hint: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID" },
    { label: "AI (Ask my CV)", ok: !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL), hint: "AI_GATEWAY_API_KEY (falls back to search without it)" },
    { label: "GitHub live heatmap", ok: !!process.env.GITHUB_TOKEN, hint: "GITHUB_TOKEN (falls back to snapshot)" },
    { label: "Postiz", ok: !!process.env.POSTIZ_API_KEY, hint: "POSTIZ_API_URL, POSTIZ_API_KEY" },
  ];
  const cvDownloads = week.events.find(([e]) => e === "cv_download")?.[1] ?? 0;
  const connected = checks.filter((c) => c.ok).length;
  return (
    <>
      <PageHeader
        eyebrow="Mission control"
        title="Overview"
        description={<>Traffic, leads and content for xerk.io, from the site&apos;s own event log{week.posthog ? " and PostHog" : ""}.</>}
        actions={<>
          <Link className="xk-btn xk-btn-ghost xk-btn-sm" href={adminHref("/studio")}><Icon name="video-camera" />Video studio</Link>
          <Link className="xk-btn xk-btn-secondary xk-btn-sm" href={adminHref("/projects/new")}><Icon name="plus" />New project</Link>
          <Link className="xk-btn xk-btn-primary xk-btn-sm" href={adminHref("/posts/new")}><Icon name="pen-nib" />New post</Link>
        </>}
      />

      <div className="xk-admin-stack" style={{ gap: 12 }}>
        <div className="xk-admin-toolbar"><h2 className="xk-admin-section-title">Last 7 days</h2><div className="xk-admin-toolbar-end"><Chip dot tone={week.posthog ? "accent" : "neutral"}>{week.posthog ? "posthog + event log" : "event log"}</Chip></div></div>
        <KpiGrid ticks items={[
          { label: "Visitors", value: week.visitors, icon: "users" },
          { label: "Pageviews", value: week.pageviews, icon: "chart-line-up" },
          { label: "Leads", value: week.leads.length, icon: "envelope-simple", tone: week.leads.length ? "accent" : undefined },
          { label: "CV downloads", value: cvDownloads, icon: "download-simple" },
        ]} />
      </div>

      <div className="xk-admin-grid is-2">
        <Panel title="Top pages" icon="file-text"><RankList items={week.pages} empty="No pageviews this week" /></Panel>
        <Panel title="Sources" icon="globe"><RankList items={week.sources} empty="No referrers yet" /></Panel>
        <Panel title="Actions" icon="cursor-click"><RankList items={week.events} format={(k) => k.replace(/_/g, " ")} empty="No tracked actions yet" /></Panel>
        <Panel title="Asked my CV" icon="robot">
          {week.questions.length === 0 ? <p className="xk-muted" style={{ margin: 0, fontSize: 13 }}>No questions this week</p> : <ul className="xk-admin-rank is-plain">{week.questions.map((q, i) => <li key={i}><span>{q}</span></li>)}</ul>}
        </Panel>
      </div>

      <div className="xk-admin-stack" style={{ gap: 12 }}>
        <h2 className="xk-admin-section-title">Content</h2>
        <KpiGrid items={[
          { label: "Live posts", value: livePosts, icon: "pen-nib", href: adminHref("/posts"), hint: "Manage posts" },
          { label: "Drafts", value: drafts, icon: "file-text", href: adminHref("/posts"), hint: drafts ? "Finish one" : "All clear" },
          { label: "Live projects", value: liveProjects, icon: "game-controller", href: adminHref("/projects"), hint: "Reorder & edit" },
          { label: "New leads", value: newLeads, icon: "envelope-simple", tone: newLeads ? "accent" : undefined, href: adminHref("/leads"), hint: newLeads ? "Reply now" : "Inbox zero" },
        ]} />
        <div className="xk-admin-actions"><Link className="xk-btn xk-btn-ghost xk-btn-sm" href={adminHref("/media")}><Icon name="images" />Media library</Link></div>
      </div>

      <Panel flush title="Recent visits" icon="map-pin" description="Last 20 visits logged in Supabase">
        {visits.length === 0 ? <div style={{ padding: 16 }}><EmptyState icon="map-pin" title="No visits yet">Visits show up here once the site logs them to Supabase.</EmptyState></div> : (
          <div className="xk-admin-table-wrap">
            <table className="xk-admin-table">
              <thead><tr><th>When</th><th>Where</th><th>Path</th><th>Source</th></tr></thead>
              <tbody>{visits.map((v: Record<string, string>) => (
                <tr key={v.id}>
                  <td className="is-num">{v.created_at?.slice(0, 16).replace("T", " ")}</td>
                  <td>{[v.city, v.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="is-num">{v.path}</td>
                  <td className="is-num">{v.utm_source || v.referrer || "direct"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Integrations" icon="plugs-connected" description="Environment checks for the services the site talks to." actions={<Chip dot tone={connected === checks.length ? "accent" : "warning"}>{connected}/{checks.length} connected</Chip>}>
        <ul className="xk-admin-checks">{checks.map((c) => (
          <li key={c.label}>
            <span><Chip dot tone={c.ok ? "accent" : "danger"}>{c.ok ? "connected" : "missing"}</Chip></span>
            <div><strong>{c.label}</strong><small>{c.hint}</small></div>
          </li>
        ))}</ul>
      </Panel>
    </>
  );
}
