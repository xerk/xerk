import { notFound } from "next/navigation";
import { Badge, Button, CaseStudyHeader, Callout, CTABar, FAQ, KeyTakeaways, MetricRow, RelatedProjects, SocialLinks, TableOfContents } from "@/components/xerk/ui";
import { Icon } from "@/components/xerk/icon";
import { ArtifactEmbed, HeroScene } from "@/components/xerk/client";
import { getProject, getProjects } from "@/lib/projects";
import { SITE_URL } from "@/data/profile";
import { getSite } from "@/lib/content";
import Link from "next/link";
import { pageMeta, JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getPosts } from "@/lib/posts";
import { CASE_META, hireFor, PROJECT_POSTS } from "@/data/landing";
import { pad2 } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return {};
  const m = CASE_META[p.slug];
  return pageMeta({ title: m?.title || `${p.title}: case study`, description: m?.description || p.answer, path: `/work/${p.slug}`, type: "article", modifiedTime: p.updated ? `${p.updated}-01` : undefined, image: `/og?title=${encodeURIComponent(p.title)}&kind=Case%20study&stat=${encodeURIComponent(p.big || p.metrics[0]?.value || "")}` });
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { profile, links: socials, upworkHref } = await getSite();
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) notFound();
  const projects = await getProjects();
  const i = projects.findIndex((x) => x.slug === p.slug);
  const related = [projects[(i + 1) % projects.length], projects[(i + 2) % projects.length]];
  const allPosts = await getPosts();
  const reading = (PROJECT_POSTS[p.slug] || []).map((s) => allPosts.find((x) => x.slug === s)).filter((x): x is NonNullable<typeof x> => !!x);
  const hire = hireFor({ ai: p.ai, tags: p.slug === "mall-of-arabia" ? [] : ["nodejs"] });
  const toc = [...p.sections.map((s) => ({ id: s.id, label: s.title })), ...(p.embedUrl || p.video || p.screens?.length ? [{ id: "demo", label: p.embedUrl ? "Demo" : "Screens" }] : []), ...(p.faq.length ? [{ id: "faq", label: "FAQ" }] : [])];
  const url = `${SITE_URL}/work/${p.slug}`;
  return (
    <div className="xk-container">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", "@id": `${url}#case-study`, name: p.title, headline: CASE_META[p.slug]?.title || p.title, abstract: p.answer, description: p.summary, url, mainEntityOfPage: url, genre: "Case study", inLanguage: "en", author: { "@id": `${SITE_URL}/#person` }, creator: { "@id": `${SITE_URL}/#person` }, ...(p.updated ? { dateModified: `${p.updated}-01` } : {}), ...(p.image ? { image: `${SITE_URL}${p.image}` } : {}), keywords: p.stack.join(", "), about: p.stack.slice(0, 6).map((name) => ({ "@type": "Thing", name })), sourceOrganization: { "@type": "Organization", name: p.company }, isPartOf: { "@type": "CollectionPage", url: `${SITE_URL}/work` }, ...(reading.length ? { citation: reading.map((r) => `${SITE_URL}/blog/${r.slug}`) } : {}) }} />
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
              <Button variant={p.embedUrl ? "secondary" : "primary"} href={hire.href} iconRight="arrow-right" track="hire_click">Build something like this</Button>
              {p.url && <Button variant="ghost" href={p.url} iconRight="arrow-up-right" external>{p.url.replace(/^https?:\/\//, "")}</Button>}
            </>}
          />
        </div>
      </div>
      {p.image && <div style={{ padding: "8px 24px 0" }}><img src={p.image} alt={`${p.title} cover`} width={1600} height={1000} className="xk-cs-cover" /></div>}
      <div className="xk-article">
        <aside className="xk-article-side">
          <TableOfContents items={toc} />
          <div className="xk-boss"><Icon name="skull" /><div><span className="xk-label">Boss · defeated</span><strong>{p.boss}</strong></div></div>
          <Button variant="primary" size="sm" block href={hire.href} track="hire_click">Hire me for this</Button>
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
          {(p.embedUrl || p.video || p.screens?.length) && <ArtifactEmbed title={p.title} src={p.embedUrl} video={p.video} screens={p.screens} poster={p.screens?.length ? undefined : p.image} url={p.url?.replace(/^https?:\/\//, "")} caption={p.embedUrl ? "Interactive demo — embedded on xerk.io. The article above explains what it shows." : `${p.title} — product screenshot`} />}
          {p.metrics.length > 0 && <div data-reveal=""><MetricRow items={p.metrics} /></div>}
          {reading.length > 0 && (
            <nav className="xk-seealso" aria-label="Further reading">
              <span className="xk-label">Further reading</span>
              <ul>{reading.map((r) => <li key={r.slug}><Link href={`/blog/${r.slug}`}><Icon name="arrow-right" /><span>{r.title} <small>· {r.readingTime}</small></span></Link></li>)}</ul>
            </nav>
          )}
          {p.faq.length > 0 && <section><h2 id="faq" className="xk-prose" style={{ font: "600 28px/34px var(--font-sans)", letterSpacing: "-0.02em", margin: "0 0 16px" }}>FAQ</h2><FAQ items={p.faq} /></section>}
          <CTABar tone="accent" title={p.ai ? "Want an AI agent like this?" : "Need something like this?"} text={`I'm ${profile.name} — ${profile.years}+ years building systems like ${p.title}. Scoped in one call.`}>
            <Button variant="primary" iconRight="arrow-right" href={hire.href} track="hire_click">{hire.label}</Button>
            <Button brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button>
          </CTABar>
          <RelatedProjects items={related.map((r) => ({ slug: r.slug, title: r.title, summary: `Stage ${r.code} · ${r.world}`, image: r.image, code: r.code }))} />
        </article>
      </div>
    </div>
  );
}
