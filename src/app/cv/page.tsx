import { Badge, Button } from "@/components/xerk/ui";
import { getSite } from "@/lib/content";
import { getProjects } from "@/lib/projects";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata() {
  const { profile } = await getSite();
  return pageMeta({ title: `CV: ${profile.title}, ${profile.years}+ years`, description: `${profile.name}'s CV: ${profile.years}+ years in TypeScript, NestJS and Next.js, real-time platforms with 100K+ connections, AI agents and MCP. HTML and PDF.`, path: "/cv" });
}

export default async function CV() {
  const { experience, profile, skills, links: socials } = await getSite();
  const projects = await getProjects();
  return (
    <div className="xk-container xk-cv">
      <header className="xk-page-head" style={{ padding: "48px 0 24px" }} data-hud="CV">
        <span className="xk-label">Curriculum vitae</span>
        <h1>{profile.name}</h1>
        <p>{profile.title} · {profile.location} · Remote, overlapping US and EU hours</p>
        <div className="xk-hero-actions xk-noprint"><Button variant="primary" icon="download-simple" href={profile.cvPdf} track="cv_download" external>Download PDF</Button><Button icon="envelope-simple" href={`mailto:${profile.email}`}>{profile.email}</Button></div>
      </header>
      <h2>Summary</h2>
      <p>{profile.description}</p>
      <h2>Experience</h2>
      {experience.map((e) => (
        <section key={e.company} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><strong style={{ fontSize: 17 }}>{e.company} — {e.role}</strong><span className="xk-label">{e.where} · {e.period}</span></div>
          <p className="xk-muted" style={{ margin: "4px 0 8px", fontSize: 14 }}>{e.summary}</p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: "24px" }}>{e.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          <div className="xk-tags" style={{ marginTop: 8 }}>{e.stack.map((s) => <Badge key={s}>{s}</Badge>)}</div>
        </section>
      ))}
      <h2>Skills</h2>
      <dl>{Object.entries(skills).map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v.join(", ")}</dd></div>)}</dl>
      <h2>Notable projects</h2>
      <ul style={{ paddingLeft: 20, lineHeight: "26px" }}>{projects.map((p) => <li key={p.slug}><a href={`/work/${p.slug}`}><strong>{p.title}</strong></a>: {p.summary}</li>)}</ul>
      <h2>Education & languages</h2>
      <p>{profile.education.school}, {profile.education.degree}, {profile.education.period} · {profile.languages.join(", ")}</p>
      <h2>Links</h2>
      <p>{socials.map((s) => <a key={s.brand} href={s.href} style={{ marginRight: 16 }}>{s.label}</a>)}</p>
    </div>
  );
}
