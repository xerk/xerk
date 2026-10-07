import { AchievementGrid, BentoGrid, BentoTile, Button, GitHubHeatmap, Marquee, PlayerCard, QuestLog, Section, SkillTree } from "@/components/xerk/ui";
import { AskMyCV, LevelSelect, Terminal } from "@/components/xerk/client";
import { achievements, experience, github, profile, skillTree, stats, ticker } from "@/data/profile";
import { projects } from "@/data/projects";
import { MOTD, terminalCommands } from "@/data/terminal";
import { getContributions } from "@/lib/github";
import { pageMeta } from "@/lib/seo";

export const revalidate = 3600;
export const metadata = pageMeta({ title: "Play: my CV as a game", description: "Ahmed Mamdouh's CV as a game: player card, project stages, achievements, a skill tree, a working terminal and Ask my CV.", path: "/play" });

const LOADOUT = [{ brand: "nestjs", label: "NestJS" }, { brand: "nextdotjs", label: "Next.js" }, { brand: "claude", label: "Claude" }, { brand: "graphql", label: "GraphQL" }, { brand: "kubernetes", label: "Kubernetes" }, { brand: "amazonwebservices", label: "AWS" }];

export default async function Play() {
  const contrib = await getContributions();
  const now = new Date();
  const season = Math.round(((now.getMonth() + now.getDate() / 31) / 12) * 100);
  return (
    <>
      <div className="xk-container">
        <header className="xk-page-head" data-hud="00 / Start">
          <span className="xk-label">Play mode</span>
          <h1 data-split="">My CV, as a game</h1>
          <p>Same facts as the CV, more buttons. Pick a stage, try the terminal, or unlock the side quests from the trophy in the top bar.</p>
        </header>
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
      </div>
    </>
  );
}
