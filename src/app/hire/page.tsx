import { Button, FAQ, PlatformProof, ProcessSteps, Section, ServiceCard, SocialLinks, SpotlightCard, StatusPill } from "@/components/xerk/ui";
import { AskMyCV, ContactForm } from "@/components/xerk/client";
import { Icon } from "@/components/xerk/icon";
import { LANDINGS } from "@/data/landing";
import { getSite } from "@/lib/content";
import { pageMeta, JsonLd, faqJsonLd, breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo";

const DESCRIPTION = "Senior full-stack and AI engineer with 10+ years. AI agents, real-time platforms and SaaS, as fixed-scope builds or a fractional tech lead. Directly or on Upwork.";
export const metadata = pageMeta({ title: "Hire a senior full-stack and AI engineer", description: DESCRIPTION, path: "/hire" });

export default async function Hire() {
  const { bookingUrl, hireFaq, process: process_, profile, services, links: socials, upworkHref, socialHref } = await getSite();
  return (
    <div className="xk-container">
      <JsonLd data={serviceJsonLd({ name: `${profile.name}: full-stack and AI engineering`, description: DESCRIPTION, path: "/hire", serviceType: "Software engineering: AI agents, real-time platforms, SaaS", knowsAbout: ["NestJS", "Next.js", "TypeScript", "AI agents", "Model Context Protocol (MCP)", "RAG", "WebSockets"], offers: services.map((s) => ({ name: s.title, description: s.text })) })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hire", path: "/hire" }])} />
      <JsonLd data={faqJsonLd(hireFaq)} />
      <header className="xk-page-head" data-hud="Co-op mode">
        <StatusPill>{profile.availability}</StatusPill>
        <h1 data-split="">Hire a senior full-stack and AI engineer for your AI feature or real-time platform</h1>
        <p>{profile.years}+ years shipping production systems: backends with 100K+ connections, fintech transactions, AI agents and MCP servers. Fixed-scope builds or a few days a week on your team, directly or through Upwork.</p>
        <div className="xk-hero-actions"><Button variant="primary" size="lg" icon="calendar-dots" href={bookingUrl} track="book_call">Book a 15-min call</Button><Button size="lg" brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button></div>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }}>
        <PlatformProof items={[{ brand: "upwork", value: "Upwork", label: "Hire with escrow & reviews", href: upworkHref }, { brand: "linkedin", value: "LinkedIn", label: "History & recommendations", href: socialHref("linkedin") }, { brand: "github", value: "GitHub", label: "5,559 contributions / yr", href: socialHref("github") }]} />
      </section>
      <Section eyebrow="01 / Services" title="Ways to work together">
        <div className="xk-three">{services.map((s) => <ServiceCard key={s.slug} {...s} href="#contact" />)}</div>
      </Section>
      <Section eyebrow="Focus" title="Hiring for one thing?" text="Two pages that go deeper on the work I'm hired for most." scramble={false}>
        <div className="xk-two">
          {LANDINGS.map((l) => (
            <SpotlightCard key={l.slug} href={`/hire/${l.slug}`} className="xk-hire-focus">
              <span className="xk-label">{l.eyebrow}</span>
              <h3>{l.h1}</h3>
              <p>{l.metaDescription}</p>
              <span className="xk-readmore">See the details<Icon name="arrow-right" /></span>
            </SpotlightCard>
          ))}
        </div>
      </Section>
      <Section eyebrow="02 / Process" title="From first call to launch"><ProcessSteps steps={process_} /></Section>
      <Section id="contact" eyebrow="03 / Contact" title="Tell me about your project" scramble={false}>
        <div className="xk-two">
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}><ContactForm /><SocialLinks links={socials} variant="list" medium="hire" /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}><FAQ items={hireFaq} /><AskMyCV suggestions={["What AI work has he shipped?", "NestJS or Laravel for my API?", "Can he lead my team?"]} /></div>
        </div>
      </Section>
    </div>
  );
}
