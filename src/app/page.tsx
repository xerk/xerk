import Link from "next/link";
import { BentoGrid, BentoTile, Button, CTABar, PlayerCard, QuestLog, ProjectCard, Section, SocialLinks, StatusPill } from "@/components/xerk/ui";
import { HeroScene } from "@/components/xerk/client";
import { BlogCard } from "@/components/xerk/blog";
import { SITE_URL } from "@/data/profile";
import { getSite } from "@/lib/content";
import { getProjects } from "@/lib/projects";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/lib/seo";

export const revalidate = 3600;

const LOADOUT = [{ brand: "nestjs", label: "NestJS" }, { brand: "nextdotjs", label: "Next.js" }, { brand: "claude", label: "Claude" }, { brand: "graphql", label: "GraphQL" }, { brand: "kubernetes", label: "Kubernetes" }, { brand: "amazonwebservices", label: "AWS" }];

export default async function Home() {
  const { bookingUrl, experience, profile, links: socials, stats, upworkHref } = await getSite();
  const posts = await getPosts();
  const now = new Date();
  const season = Math.round(((now.getMonth() + now.getDate() / 31) / 12) * 100);
  const projects = await getProjects();
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

        <Section id="player" eyebrow="Player" title="Player 1 has entered the game" text={`${profile.years}+ years across five teams. Every number here comes from my CV or GitHub.`}>
          <div className="xk-two-lr">
            <PlayerCard name={profile.name} level={profile.years} className="Senior full-stack · AI engineer" avatar={profile.avatar} status="Online · open to co-op missions" xp={{ label: `Season ${now.getFullYear()}`, value: season, text: `${now.toLocaleString("en-US", { month: "short" })} · ${season}%` }} stats={stats} loadout={LOADOUT} />
            <BentoGrid>
              <BentoTile span={2} tone="accent" icon="broadcast" eyebrow="Real-time" value="100K+" title="Concurrent device connections" />
              <BentoTile span={2} tone="agent" icon="robot" eyebrow="AI" value="MCP" title="Agent + tool server in production" />
              <BentoTile span={2} icon="users-three" eyebrow="UptimeRobot" value="2.1M+" title="Users served" />
              <BentoTile span={2} icon="lightning" eyebrow="Microservices" value="−40%" title="p95 latency" />
            </BentoGrid>
          </div>
        </Section>
        <Section id="work" eyebrow="Work" title="Selected projects" scramble={false} action={<Button variant="ghost" iconRight="arrow-right" href="/work">All projects</Button>}>
          <div className="xk-projects">
            {featured && <ProjectCard wide featured slug={featured.slug} title={featured.title} eyebrow={featured.period} summary={featured.summary} image={featured.image} video={featured.video} hasVideo={!!featured.video} big={featured.big} bigLabel={featured.bigLabel} stack={featured.stack} ai={featured.ai} interactive={!!featured.embedUrl} />}
            {rest.slice(0, 2).map((p) => <ProjectCard key={p.slug} slug={p.slug} title={p.title} eyebrow={p.period} summary={p.summary} image={p.image} video={p.video} hasVideo={!!p.video} big={p.big} bigLabel={p.bigLabel} stack={p.stack} ai={p.ai} interactive={!!p.embedUrl} />)}
          </div>
        </Section>

        <Section id="experience" eyebrow="Experience" title={`${profile.years}+ years building software`} scramble={false} action={<Button variant="ghost" iconRight="arrow-right" href="/cv">Full CV</Button>}>
          <div style={{ maxWidth: 860 }}><QuestLog quests={experience.map((e) => ({ ...e, objectives: e.objectives.slice(0, 3) }))} /></div>
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
