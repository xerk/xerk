import { AIStack, Section } from "@/components/xerk/ui";
import { aiStack, skills } from "@/data/profile";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Uses: my tools and stack", description: "The languages, frameworks, AI tools and infrastructure Ahmed Mamdouh uses to ship real-time platforms and AI agents.", path: "/uses" });

export default function Uses() {
  return (
    <div className="xk-container">
      <header className="xk-page-head" data-hud="Uses"><span className="xk-label">Loadout</span><h1 data-split="">What I use to ship</h1><p>The stack behind the case studies — chosen because it&apos;s boring, reliable and fast to work with.</p></header>
      <Section eyebrow="01 / AI" title="AI tooling"><AIStack items={aiStack} /></Section>
      <Section eyebrow="02 / Stack" title="Everything else">
        <div className="xk-cv" style={{ padding: 0 }}><dl>{Object.entries(skills).map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v.join(" · ")}</dd></div>)}</dl></div>
      </Section>
    </div>
  );
}
