import Link from "next/link";
import { Button, CTABar, ExperienceList, ProjectCard, Section, SocialLinks, StatusPill } from "@/components/xerk/ui";
import { HeroScene } from "@/components/xerk/client";
import { BlogCard } from "@/components/xerk/blog";
import { bookingUrl, experience, profile, socials, upworkHref, SITE_URL } from "@/data/profile";
import { projects } from "@/data/projects";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/lib/seo";

export const revalidate = 3600;

export default async function Home() {
  const posts = await getPosts();
  const [featured, ...rest] = projects;
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfilePage", url: SITE_URL, mainEntity: { "@id": `${SITE_URL}/#person` } }} />
      <div className="xk-container">
        <section className="xk-gamehero">
          <div className="xk-gamehero-copy">
            <div className="xk-hero-top"><StatusPill href="/hire">{profile.availability}</StatusPill></div>
            <h1 data-split="">{profile.headline}</h1>
            <p className="xk-hero-intro">{profile.intro}</p>
            <div className="xk-hero-actions">
              <Button variant="primary" size="lg" iconRight="arrow-right" href="/hire" magnetic track="hire_click">Hire me</Button>
              <Button size="lg" href="#work">See my work</Button>
            </div>
            <div className="xk-hero-meta"><SocialLinks links={socials} medium="hero" /><span className="xk-label">{profile.location}</span></div>
          </div>
          <div className="xk-gamehero-scene"><HeroScene /></div>
        </section>

        <Section id="work" eyebrow="Work" title="Selected projects" scramble={false} action={<Button variant="ghost" iconRight="arrow-right" href="/work">All projects</Button>}>
          <div className="xk-grid" style={{ padding: 0, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <ProjectCard wide featured slug={featured.slug} title={featured.title} eyebrow={featured.period} summary={featured.summary} image={featured.image} big={featured.big} bigLabel={featured.bigLabel} stack={featured.stack} ai={featured.ai} interactive={!!featured.embedUrl} />
            {rest.slice(0, 2).map((p) => <ProjectCard key={p.slug} slug={p.slug} title={p.title} eyebrow={p.period} summary={p.summary} image={p.image} big={p.big} bigLabel={p.bigLabel} stack={p.stack} ai={p.ai} interactive={!!p.embedUrl} />)}
          </div>
        </Section>

        <Section id="experience" eyebrow="Experience" title={`${profile.years}+ years building software`} scramble={false} action={<Button variant="ghost" iconRight="arrow-right" href="/cv">Full CV</Button>}>
          <ExperienceList items={experience} />
        </Section>

        <Section id="blog" eyebrow="Blog" title="Latest posts" scramble={false} action={<Button variant="ghost" iconRight="arrow-right" href="/blog">All posts</Button>}>
          <div className="xk-blog-grid">{posts.slice(0, 3).map((p) => <BlogCard key={p.slug} post={p} date={formatDate(p.publishedAt)} />)}</div>
        </Section>

        <section className="xk-section">
          <CTABar tone="accent" title="Have a project in mind?" text="Freelance or contract work on real-time systems, AI agents and full-stack products. I reply within one working day.">
            <Button variant="primary" icon="calendar-dots" href={bookingUrl} track="book_call">Book a call</Button>
            <Button brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button>
          </CTABar>
          <p className="xk-play-hint">Want the fun version? <Link href="/play">Play the CV as a game</Link>, with a terminal, achievements and Ask my CV.</p>
        </section>
      </div>
    </>
  );
}
