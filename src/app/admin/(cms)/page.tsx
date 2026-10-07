import Link from "next/link";
import { Badge, MetricRow } from "@/components/xerk/ui";
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
  return (
    <>
      <div className="xk-admin-head">
        <div><span className="xk-label">Mission control</span><h1>Overview</h1><p>Traffic, leads and content for xerk.io, from the site&apos;s own event log{week.posthog ? " and PostHog" : ""}.</p></div>
        <div className="xk-admin-actions">
          <Link className="xk-btn xk-btn-primary xk-btn-sm" href="/admin/posts/new">New post</Link>
          <Link className="xk-btn xk-btn-secondary xk-btn-sm" href="/admin/projects/new">New project</Link>
          <Link className="xk-btn xk-btn-ghost xk-btn-sm" href="/studio">Video studio</Link>
        </div>
      </div>

      <section className="xk-admin-panel">
        <h2>Last 7 days</h2>
        <MetricRow items={[{ value: String(week.visitors), label: "Visitors" }, { value: String(week.pageviews), label: "Pageviews" }, { value: String(week.leads.length), label: "Leads" }, { value: String(week.events.find(([e]) => e === "cv_download")?.[1] ?? 0), label: "CV downloads" }]} />
        <div className="xk-two">
          <div className="xk-card" style={{ padding: 20 }}><span className="xk-label">Top pages</span><ul>{week.pages.map(([k, n]) => <li key={k}>{n} · {k}</li>)}</ul></div>
          <div className="xk-card" style={{ padding: 20 }}><span className="xk-label">Sources</span><ul>{week.sources.map(([k, n]) => <li key={k}>{n} · {k}</li>)}</ul></div>
          <div className="xk-card" style={{ padding: 20 }}><span className="xk-label">Actions</span><ul>{week.events.map(([k, n]) => <li key={k}>{n} · {k.replace(/_/g, " ")}</li>)}</ul></div>
          <div className="xk-card" style={{ padding: 20 }}><span className="xk-label">Asked my CV</span><ul>{week.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></div>
        </div>
      </section>

      <section className="xk-admin-panel">
        <h2>Content</h2>
        <MetricRow items={[{ value: String(livePosts), label: "Live posts" }, { value: String(drafts), label: "Drafts" }, { value: String(liveProjects), label: "Live projects" }, { value: String(newLeads), label: "New leads" }]} />
        <div className="xk-admin-actions">
          <Link className="xk-btn xk-btn-secondary xk-btn-sm" href="/admin/posts">Manage posts</Link>
          <Link className="xk-btn xk-btn-secondary xk-btn-sm" href="/admin/projects">Manage projects</Link>
          <Link className="xk-btn xk-btn-secondary xk-btn-sm" href="/admin/media">Media library</Link>
          <Link className="xk-btn xk-btn-secondary xk-btn-sm" href="/admin/leads">Leads{newLeads ? ` (${newLeads} new)` : ""}</Link>
        </div>
      </section>

      <section className="xk-admin-panel">
        <h2>Recent visits</h2>
        {visits.length === 0 ? <p className="xk-muted">No visits logged in Supabase yet.</p> : <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: "24px" }}>{visits.map((v: Record<string, string>) => <li key={v.id}>{v.created_at?.slice(0, 16).replace("T", " ")} · {v.country} {v.city} · {v.path} · {v.utm_source || v.referrer}</li>)}</ul>}
      </section>

      <section className="xk-admin-panel">
        <h2>Integrations</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{checks.map((c) => <li key={c.label} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><Badge tone={c.ok ? "accent" : "danger"}>{c.ok ? "connected" : "missing"}</Badge><strong>{c.label}</strong><span className="xk-muted" style={{ fontSize: 13 }}>{c.hint}</span></li>)}</ul>
      </section>
    </>
  );
}
