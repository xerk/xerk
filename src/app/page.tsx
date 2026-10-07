import { AchievementGrid, BentoGrid, BentoTile, Button, CTABar, GitHubHeatmap, Marquee, PlayerCard, QuestLog, Section, SkillTree, SocialLinks, StatusPill } from "@/components/xerk/ui";
import { AskMyCV, HeroScene, LevelSelect, QuestList, Terminal } from "@/components/xerk/client";
import { achievements, bookingUrl, experience, github, profile, skillTree, socials, stats, ticker, upworkHref } from "@/data/profile";
import { projects } from "@/data/projects";
import { MOTD, terminalCommands } from "@/data/terminal";
import { getPosts } from "@/lib/posts";
import { BlogCard } from "@/components/xerk/blog";
import { getContributions } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/lib/seo";
import { SITE_URL } from "@/data/profile";

export const revalidate = 3600;

const LOADOUT = [{ brand: "nestjs", label: "NestJS" }, { brand: "nextdotjs", label: "Next.js" }, { brand: "claude", label: "Claude" }, { brand: "graphql", label: "GraphQL" }, { brand: "kubernetes", label: "Kubernetes" }, { brand: "amazonwebservices", label: "AWS" }];

export default async function Home() {
  const [posts, contrib] = await Promise.all([getPosts(), getContributions()]);
  const now = new Date();
  const season = Math.round(((now.getMonth() + now.getDate() / 31) / 12) * 100);
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
              <Button variant="primary" size="lg" iconRight="arrow-right" href="/hire" magnetic track="hire_click">Start a mission</Button>
              <Button size="lg" icon="game-controller" href="#stages">Select a project</Button>
              <Button variant="agent" size="lg" icon="sparkle" href="#console">Ask my CV</Button>
            </div>
            <div className="xk-hero-meta"><SocialLinks links={socials} medium="hero" /><span className="xk-label">{profile.location} · {profile.timezone}</span></div>
            <span className="xk-press">Press <kbd className="xk-kbd">⌘K</kbd> to explore</span>
          </div>
          <div className="xk-gamehero-scene"><HeroScene /></div>
        </section>
      </div>
      <Marquee items={ticker} />
      <div className="xk-container">
        <Section id="player" eyebrow="01 / Player" title="Player 1 has entered the game" text={`${profile.years}+ years across five teams. Every number here comes from my CV or GitHub.`}>
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
        <Section id="stages" eyebrow="02 / Level select" title="Choose a stage" text="Every project opens as a case study with the architecture behind it, and some have a demo you can play." action={<Button variant="ghost" iconRight="arrow-right" href="/work">All work</Button>}>
          <LevelSelect levels={projects.map(({ slug, code, title, world, period, summary, boss, image, big, bigLabel, stack, ai, embedUrl }) => ({ slug, code, title, world, period, summary, boss, image, big, bigLabel, stack, ai, embedUrl }))} />
        </Section>
        <Section id="achievements" eyebrow="03 / Achievements" title="Achievements unlocked" text="Eight from real work. The ninth is the project we do together.">
          <AchievementGrid items={achievements} />
        </Section>
        <Section id="quests-side" eyebrow="03b / Side quests" title="Your turn" text="Explore the site and unlock these. Each one tells you where to go next.">
          <div className="xk-sq-card"><QuestList /></div>
        </Section>
        <Section id="skills" eyebrow="04 / Skill tree" title="Every skill has a receipt">
          <SkillTree root="Full-stack core" rootNote="TypeScript · SQL · Python" branches={skillTree} />
        </Section>
        <Section id="quests" eyebrow="05 / Quest log" title="Main story" action={<Button icon="read-cv-logo" href="/cv">Full CV</Button>}>
          <div style={{ maxWidth: 860 }}><QuestLog quests={experience.map((e) => ({ ...e, objectives: e.objectives.slice(0, 4) }))} /></div>
        </Section>
        <Section id="console" eyebrow="06 / Console" title="Prefer the command line?" text="Type help. There might be a hidden command.">
          <div className="xk-two">
            <Terminal motd={MOTD} commands={terminalCommands} boot={["whoami", "github"]} />
            <AskMyCV suggestions={["Has he shipped AI agents to production?", "How big was the real-time system?", "Is he available?"]} />
          </div>
        </Section>
        <Section id="activity" eyebrow="07 / Activity" title="Still shipping, every week">
          <GitHubHeatmap user={github.user} weeks={contrib.weeks} total={contrib.total} stats={[{ value: String(github.activeDays), label: "active days" }, { value: String(github.bestStreak), label: "day best streak" }, { value: String(github.publicRepos), label: "public repos" }]} />
        </Section>
        <Section id="blog" eyebrow="08 / Blog" title="From the blog" text="Practical posts on real-time systems, AI engineering and the unglamorous parts that keep software running." action={<Button variant="ghost" iconRight="arrow-right" href="/blog">All posts</Button>}>
          <div className="xk-blog-grid">{posts.slice(0, 3).map((p) => <BlogCard key={p.slug} post={p} date={formatDate(p.publishedAt)} />)}</div>
        </Section>
        <section className="xk-section">
          <CTABar tone="accent" eyebrow="Co-op mode" title="Ready player two?" text="Freelance or contract work on real-time systems, AI agents and full-stack products. I reply within one working day.">
            <Button variant="primary" icon="calendar-dots" href={bookingUrl} track="book_call">Book a call</Button>
            <Button brand="upwork" iconRight="arrow-up-right" href={upworkHref} track="upwork_click">Hire on Upwork</Button>
          </CTABar>
        </section>
      </div>
    </>
  );
}
