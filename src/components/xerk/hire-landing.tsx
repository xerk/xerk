import Link from "next/link";
import { Badge, BentoGrid, BentoTile, Breadcrumbs, Button, CTABar, FAQ, ProcessSteps, ProjectCard, Section, StatusPill } from "@/components/xerk/ui";
import { BlogCard } from "@/components/xerk/blog";
import { Icon } from "@/components/xerk/icon";
import { SITE_URL } from "@/data/profile";
import { LANDINGS, type Landing } from "@/data/landing";
import { getSite } from "@/lib/content";
import { getProjects } from "@/lib/projects";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { breadcrumbJsonLd, faqJsonLd, JsonLd, pageMeta, serviceJsonLd } from "@/lib/seo";

export function landingMeta(l: Landing) {
  return pageMeta({ title: l.metaTitle, description: l.metaDescription, path: `/hire/${l.slug}`, image: `/og?title=${encodeURIComponent(l.h1)}&kind=Hire` });
}

/** A focused hire page: one service, its proof, the case studies and posts behind it, FAQ and contact. */
export async function HireLanding({ landing: l }: { landing: Landing }) {
  const { bookingUrl, process: process_, profile, upworkHref } = await getSite();
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);
  const work = l.projects.map((s) => projects.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p);
  const reading = l.posts.map((s) => posts.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p);
  const path = `/hire/${l.slug}`;
  const other = LANDINGS.filter((x) => x.slug !== l.slug);
  return (
    <div className="xk-container">
      <JsonLd data={serviceJsonLd({ name: `${profile.name}: ${l.name}`, description: l.metaDescription, path, serviceType: l.serviceType, knowsAbout: l.knowsAbout, offers: l.build.map((b) => ({ name: b.title, description: b.text })) })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hire", path: "/hire" }, { name: l.name, path }])} />
      <JsonLd data={faqJsonLd(l.faq)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", "@id": `${SITE_URL}${path}`, url: `${SITE_URL}${path}`, name: l.metaTitle, description: l.metaDescription, about: { "@id": `${SITE_URL}${path}#service` }, mainEntity: { "@id": `${SITE_URL}/#person` }, isPartOf: { "@id": `${SITE_URL}/#website` } }} />
      <header className="xk-page-head" data-hud={l.eyebrow}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hire", href: "/hire" }, { label: l.name }]} />
        <StatusPill>{profile.availability}</StatusPill>
        <h1 data-split="">{l.h1}</h1>
        <p>{l.intro}</p>
        <div className="xk-hero-actions">
          <Button variant="primary" size="lg" icon="calendar-dots" href={bookingUrl} track="book_call">Book a 15-min call</Button>
          <Button size="lg" brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button>
        </div>
      </header>

      <section className="xk-section" style={{ paddingTop: 0 }} data-reveal="">
        <BentoGrid>
          {l.proof.map((p, i) => <BentoTile key={p.title} span={2} tall={i < 2 && l.ai} tone={p.tone} icon={p.icon} value={p.value} title={p.title} text={p.text} />)}
        </BentoGrid>
      </section>

      <Section eyebrow="01 / Scope" title={l.buildTitle} text={l.timeline} scramble={false}>
        <ul className="xk-landing-list">
          {l.build.map((b) => <li key={b.title}><Icon name="check-circle" /><div><h3>{b.title}</h3><p>{b.text}</p></div></li>)}
        </ul>
        <div className="xk-tags" style={{ marginTop: 20 }}>{l.stack.map((s) => <Badge key={s}>{s}</Badge>)}</div>
      </Section>

      {work.length > 0 && (
        <Section eyebrow="02 / Proof" title="Case studies" text="The engineering behind the numbers above. Products under NDA are described without internals." scramble={false}>
          <div className="xk-grid" style={{ padding: 0 }}>{work.map((p) => <ProjectCard key={p.slug} slug={p.slug} title={p.title} eyebrow={`${p.code} · ${p.period}`} summary={p.summary} image={p.image} video={p.video} hasVideo={!!p.video} big={p.big} bigLabel={p.bigLabel} stack={p.stack} ai={p.ai} interactive={!!p.embedUrl} />)}</div>
        </Section>
      )}

      {reading.length > 0 && (
        <Section eyebrow="03 / Writing" title="How I think about this work" scramble={false}>
          <div className="xk-blog-grid">{reading.slice(0, 3).map((p) => <BlogCard key={p.slug} post={p} date={formatDate(p.publishedAt)} />)}</div>
          {reading.length > 3 && <ul className="xk-landing-more">{reading.slice(3).map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}</ul>}
        </Section>
      )}

      <Section eyebrow="04 / Process" title="From first call to launch" scramble={false}><ProcessSteps steps={process_} /></Section>

      <Section eyebrow="05 / FAQ" title="Questions clients ask" scramble={false}>
        <div style={{ maxWidth: 860 }}><FAQ items={l.faq} /></div>
      </Section>

      <section className="xk-section">
        <CTABar tone="accent" title="Tell me what you're building" text={`I'm ${profile.name}, a senior full-stack and AI engineer in ${profile.location}. I reply within one working day.`}>
          <Button variant="primary" icon="calendar-dots" href={bookingUrl} track="book_call">Book a call</Button>
          <Button iconRight="arrow-right" href="/hire#contact" track="hire_click">Send a message</Button>
        </CTABar>
        <p className="xk-play-hint">Looking for something else? See <Link href="/hire">all the ways to work together</Link>{other.map((o) => <span key={o.slug}> or <Link href={`/hire/${o.slug}`}>{o.name.toLowerCase()}</Link></span>)}.</p>
      </section>
    </div>
  );
}
