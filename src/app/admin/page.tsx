import type { Metadata } from "next";
import { Badge, Button, MetricRow, Section } from "@/components/xerk/ui";
import { getStats } from "@/lib/stats";
import { adminDb, supabaseEnabled } from "@/lib/supabase";
import { telegramEnabled } from "@/lib/telegram";
import { getPosts } from "@/lib/posts";
import { projects } from "@/data/projects";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  const [week, posts] = await Promise.all([getStats(7), getPosts()]);
  const db = adminDb();
  const leads = db ? (await db.from("leads").select("*").order("created_at", { ascending: false }).limit(50)).data || [] : [];
  const visits = db ? (await db.from("visits").select("*").order("created_at", { ascending: false }).limit(30)).data || [] : [];
  const checks = [
    { label: "Supabase", ok: supabaseEnabled && !!db, hint: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY" },
    { label: "PostHog", ok: !!process.env.NEXT_PUBLIC_POSTHOG_KEY, hint: "NEXT_PUBLIC_POSTHOG_KEY (+ POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID for stats)" },
    { label: "Telegram", ok: telegramEnabled, hint: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID" },
    { label: "AI (Ask my CV)", ok: !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN), hint: "AI_GATEWAY_API_KEY (falls back to search without it)" },
    { label: "GitHub live heatmap", ok: !!process.env.GITHUB_TOKEN, hint: "GITHUB_TOKEN (falls back to snapshot)" },
    { label: "Postiz", ok: !!process.env.POSTIZ_API_KEY, hint: "POSTIZ_API_URL, POSTIZ_API_KEY" },
  ];
  return (
    <div className="xk-container">
      <header className="xk-page-head" data-hud="Admin"><span className="xk-label">Mission control</span><h1>Dashboard</h1><p>Traffic, leads and content for xerk.io. Stats source: {week.source}.</p></header>
      <Section eyebrow="01 / Last 7 days" title="Traffic" scramble={false}>
        <MetricRow items={[{ value: String(week.uniques ?? "—"), label: "Visitors" }, { value: String(week.pageviews ?? "—"), label: "Pageviews" }, { value: String(week.leads.length), label: "Leads" }, { value: String(week.events.find((e) => e.event === "cv_download")?.count ?? 0), label: "CV downloads" }]} />
        <div className="xk-two" style={{ marginTop: 24 }}>
          <div className="xk-card" style={{ padding: 20 }}><span className="xk-label">Top referrers</span><ul>{week.referrers.map((r) => <li key={r.host}>{r.host || "direct"} — {r.count}</li>)}</ul></div>
          <div className="xk-card" style={{ padding: 20 }}><span className="xk-label">Key events</span><ul>{week.events.map((e) => <li key={e.event}>{e.event} — {e.count}</li>)}</ul></div>
        </div>
      </Section>
      <Section eyebrow="02 / Inbox" title={`Leads (${leads.length})`} scramble={false}>
        {leads.length === 0 ? <p className="xk-muted">No leads yet{db ? "" : " — connect Supabase to store them (Telegram still receives them)"}.</p> : (
          <div style={{ overflowX: "auto" }}><table className="xk-prose" style={{ maxWidth: "none" }}><thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Budget</th><th>Message</th><th>Source</th></tr></thead>
            <tbody>{leads.map((l: Record<string, string>) => <tr key={l.id}><td>{l.created_at?.slice(0, 10)}</td><td>{l.name}</td><td><a href={`mailto:${l.email}`}>{l.email}</a></td><td>{l.budget}</td><td style={{ maxWidth: 360 }}>{l.message}</td><td>{l.source}</td></tr>)}</tbody></table></div>
        )}
      </Section>
      <Section eyebrow="03 / Live" title="Recent visits" scramble={false}>
        {visits.length === 0 ? <p className="xk-muted">No visits logged in Supabase yet.</p> : <ul className="xk-prose">{visits.map((v: Record<string, string>) => <li key={v.id}>{v.created_at?.slice(0, 16).replace("T", " ")} · {v.country} {v.city} · {v.path} · {v.utm_source || v.referrer}</li>)}</ul>}
      </Section>
      <Section eyebrow="04 / Content" title="Content" scramble={false}>
        <p>{projects.length} case studies · {posts.length} field notes. Edit case studies in <code>src/data/projects.ts</code> (or the Supabase <code>projects</code> table); notes in <code>content/</code> or the <code>posts</code> table.</p>
        <Button href="/studio" icon="video-camera">Open video studio</Button>
      </Section>
      <Section eyebrow="05 / Integrations" title="Setup checklist" scramble={false}>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>{checks.map((c) => <li key={c.label} style={{ display: "flex", gap: 12, alignItems: "center" }}><Badge tone={c.ok ? "accent" : "danger"}>{c.ok ? "connected" : "missing"}</Badge><strong>{c.label}</strong><span className="xk-muted" style={{ fontSize: 13 }}>{c.hint}</span></li>)}</ul>
      </Section>
    </div>
  );
}
