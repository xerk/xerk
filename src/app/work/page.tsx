import { ProjectCard, CTABar, Button } from "@/components/xerk/ui";
import { LevelSelect } from "@/components/xerk/client";
import { projects } from "@/data/projects";
import { pageMeta, JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/data/profile";

export const metadata = pageMeta({ title: "Case studies: real-time systems, AI agents and SaaS", description: "Case studies by Ahmed Mamdouh: a real-time platform with 100K+ concurrent connections, a production AI agent and MCP server, the Zerocash e-wallet, SweepSouth, UptimeRobot and more.", path: "/work" });

export default function WorkPage() {
  return (
    <div className="xk-container">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Work", url: `${SITE_URL}/work`, hasPart: projects.map((p) => ({ "@type": "CreativeWork", name: p.title, url: `${SITE_URL}/work/${p.slug}`, description: p.summary })) }} />
      <header className="xk-page-head" data-hud="Level select">
        <span className="xk-label">Level select</span>
        <h1 data-split="">Case studies: real-time platforms, AI agents and SaaS</h1>
        <p>Every stage is a real project, with the hardest problem (the boss), the architecture and the numbers. Pick one.</p>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }} data-reveal="">
        <LevelSelect levels={projects} />
      </section>
      <section className="xk-section" data-hud="All stages">
        <div className="xk-grid" style={{ padding: 0, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {projects.map((p) => <ProjectCard key={p.slug} slug={p.slug} title={p.title} eyebrow={`${p.code} · ${p.period}`} summary={p.summary} image={p.image} big={p.big} bigLabel={p.bigLabel} stack={p.stack} ai={p.ai} interactive={!!p.embedUrl} hasVideo={!!p.video} featured={p.featured} />)}
        </div>
      </section>
      <section className="xk-section">
        <CTABar tone="accent" title="Want your project on this list?" text="Real-time systems, AI features or SaaS. We can scope it in one call."><Button variant="primary" href="/hire" iconRight="arrow-right" track="hire_click">Start a mission</Button></CTABar>
      </section>
    </div>
  );
}
