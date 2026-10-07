import { Button, FAQ, PlatformProof, ProcessSteps, Section, ServiceCard, SocialLinks, StatusPill } from "@/components/xerk/ui";
import { AskMyCV, ContactForm } from "@/components/xerk/client";
import { bookingUrl, hireFaq, process_, profile, services, socials, SITE_URL, upworkHref, socialHref } from "@/data/profile";
import { pageMeta, JsonLd, faqJsonLd } from "@/lib/seo";

export const metadata = pageMeta({ title: "Hire a senior full-stack and AI engineer (NestJS, Next.js, AI agents)", description: "Hire Ahmed Mamdouh (10+ years) for AI agents, real-time platforms and SaaS — fixed-scope builds or a fractional tech lead. Work directly or through Upwork.", path: "/hire" });

export default function Hire() {
  return (
    <div className="xk-container">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfessionalService", name: `${profile.name} — software engineering`, url: `${SITE_URL}/hire`, provider: { "@id": `${SITE_URL}/#person` }, areaServed: "Worldwide", makesOffer: services.map((s) => ({ "@type": "Offer", name: s.title, description: s.text, itemOffered: { "@type": "Service", name: s.title } })) }} />
      <JsonLd data={faqJsonLd(hireFaq)} />
      <header className="xk-page-head" data-hud="Co-op mode">
        <StatusPill>{profile.availability}</StatusPill>
        <h1 data-split="">Hire a senior engineer for your AI feature or real-time platform</h1>
        <p>{profile.years}+ years shipping production systems: backends with 100K+ connections, fintech transactions, AI agents and MCP servers. Fixed-scope builds or a few days a week on your team, directly or through Upwork.</p>
        <div className="xk-hero-actions"><Button variant="primary" size="lg" icon="calendar-dots" href={bookingUrl} track="book_call">Book a 15-min call</Button><Button size="lg" brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button></div>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }}>
        <PlatformProof items={[{ brand: "upwork", value: "Upwork", label: "Hire with escrow & reviews", href: upworkHref }, { brand: "linkedin", value: "LinkedIn", label: "History & recommendations", href: socialHref("linkedin") }, { brand: "github", value: "GitHub", label: "5,559 contributions / yr", href: socialHref("github") }]} />
      </section>
      <Section eyebrow="01 / Services" title="Ways to work together">
        <div className="xk-three">{services.map((s) => <ServiceCard key={s.slug} {...s} href="#contact" />)}</div>
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
