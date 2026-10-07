import { notFound } from "next/navigation";
import { Badge, Button, CaseStudyHeader, Callout, CTABar, FAQ, KeyTakeaways, MetricRow, RelatedProjects, SocialLinks, TableOfContents } from "@/components/xerk/ui";
import { Icon } from "@/components/xerk/icon";
import { ArtifactEmbed, HeroScene } from "@/components/xerk/client";
import { getProject, projects } from "@/data/projects";
import { SITE_URL, profile, socials, upworkHref } from "@/data/profile";
import { pageMeta, JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { pad2 } from "@/lib/utils";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return pageMeta({ title: `${p.title}: ${p.summary.split(":")[0].split(".")[0]} — case study`.slice(0, 90), description: p.answer.slice(0, 160), path: `/work/${p.slug}`, type: "article", image: `/og?title=${encodeURIComponent(p.title)}&kind=Case%20study&stat=${encodeURIComponent(p.big || p.metrics[0]?.value || "")}` });
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const i = projects.findIndex((x) => x.slug === p.slug);
  const related = [projects[(i + 1) % projects.length], projects[(i + 2) % projects.length]];
  const toc = [...p.sections.map((s) => ({ id: s.id, label: s.title })), ...(p.embedUrl || p.video || p.image ? [{ id: "demo", label: "Demo" }] : []), ...(p.faq.length ? [{ id: "faq", label: "FAQ" }] : [])];
  const url = `${SITE_URL}/work/${p.slug}`;
  return (
    <div className="xk-container">
      <JsonLd data={{ "@context": "https://schema.org", "@type": p.ai ? "SoftwareApplication" : "CreativeWork", name: p.title, headline: p.title, description: p.answer, url, author: { "@id": `${SITE_URL}/#person` }, creator: { "@id": `${SITE_URL}/#person` }, dateModified: p.updated, keywords: p.stack.join(", "), ...(p.ai ? { applicationCategory: "BusinessApplication", operatingSystem: "Web" } : {}), sourceOrganization: { "@type": "Organization", name: p.company } }} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }, { name: p.title, path: `/work/${p.slug}` }])} />
      {p.faq.length > 0 && <JsonLd data={faqJsonLd(p.faq)} />}
      <div style={{ position: "relative", overflow: "hidden" }} data-hud={`Stage ${p.code}`}>
        <div className="xk-noprint" style={{ position: "absolute", right: -120, top: -40, width: 620, height: 520, opacity: 0.7 }} aria-hidden><HeroScene hud={false} nodes={360} packets={50} /></div>
        <div style={{ position: "relative", padding: "48px 24px 24px", maxWidth: 860 }}>
          <CaseStudyHeader
            crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/work" }, { label: p.title }]}
            eyebrow={`Stage ${p.code} · ${p.company} · ${p.period}`}
            title={p.title}
            summary={p.summary}
            ai={p.ai}
            meta={[{ label: "Role", value: p.role }, { label: "Company", value: p.company }, { label: "Period", value: p.period }, { label: "Stack", value: p.stack.slice(0, 4).join(", ") }]}
            actions={<>
              {p.embedUrl && <Button variant="primary" icon="game-controller" href="#demo" track="demo_cta">Play the live demo</Button>}
              <Button variant={p.embedUrl ? "secondary" : "primary"} href="/hire" iconRight="arrow-right" track="hire_click">Build something like this</Button>
              {p.url && <Button variant="ghost" href={p.url} iconRight="arrow-up-right" external>{p.url.replace(/^https?:\/\//, "")}</Button>}
            </>}
          />
        </div>
      </div>
      <div className="xk-article">
        <aside className="xk-article-side">
          <TableOfContents items={toc} />
          <div className="xk-boss"><Icon name="skull" /><div><span className="xk-label">Boss · defeated</span><strong>{p.boss}</strong></div></div>
          <Button variant="primary" size="sm" block href="/hire" track="hire_click">Hire me for this</Button>
          <SocialLinks links={socials} medium="case_study" />
        </aside>
        <article style={{ display: "flex", flexDirection: "column", gap: 32, minWidth: 0 }}>
          <KeyTakeaways answer={p.answer} items={p.takeaways} updated={new Date(p.updated + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })} />
          <div className="xk-tags">{p.stack.map((s) => <Badge key={s}>{s}</Badge>)}</div>
          <div className="xk-prose" data-reveal="">
            {p.sections.map((s, n) => (
              <section key={s.id}>
                <h2 id={s.id}><span className="xk-label">{pad2(n + 1)}</span>{s.title}</h2>
                {s.body.map((b, k) => <p key={k}>{b}</p>)}
                {s.id === "approach" && p.ai && <Callout title="AI with guardrails" tone="ai">Tool use is scoped, calls are audited, and eval harnesses catch regressions before users do.</Callout>}
              </section>
            ))}
          </div>
          {(p.embedUrl || p.video || p.image) && <ArtifactEmbed title={p.title} src={p.embedUrl} video={p.video} poster={p.image} url={p.url?.replace(/^https?:\/\//, "")} caption={p.embedUrl ? "Interactive demo — embedded on xerk.io. The article above explains what it shows." : `${p.title} — product screenshot`} />}
          {p.metrics.length > 0 && <div data-reveal=""><MetricRow items={p.metrics} /></div>}
          {p.faq.length > 0 && <section><h2 id="faq" className="xk-prose" style={{ font: "600 28px/34px var(--font-sans)", letterSpacing: "-0.02em", margin: "0 0 16px" }}>FAQ</h2><FAQ items={p.faq} /></section>}
          <CTABar tone="accent" title={p.ai ? "Want an AI agent like this?" : "Need something like this?"} text={`I'm ${profile.name} — ${profile.years}+ years building systems like ${p.title}. Scoped in one call.`}>
            <Button variant="primary" iconRight="arrow-right" href="/hire" track="hire_click">Start a mission</Button>
            <Button brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button>
          </CTABar>
          <RelatedProjects items={related.map((r) => ({ slug: r.slug, title: r.title, summary: `Stage ${r.code} · ${r.world}`, image: r.image, code: r.code }))} />
        </article>
      </div>
    </div>
  );
}
