import { Button } from "@/components/xerk/ui";
import { experience, profile } from "@/data/profile";
import { getPosts } from "@/lib/posts";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Now — what I'm working on", description: "What Ahmed Mamdouh is focused on right now: AI agents, MCP servers and real-time systems — and availability for new projects.", path: "/now" });

export default async function Now() {
  const latest = (await getPosts())[0];
  return (
    <div className="xk-container">
      <header className="xk-page-head" data-hud="Now"><span className="xk-label">Now · updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span><h1 data-split="">What I&apos;m doing now</h1></header>
      <section className="xk-section xk-prose" style={{ paddingTop: 0 }}>
        <ul>
          <li><strong>Day job:</strong> {experience[0].role} at {experience[0].company} — AI agents, MCP and the ALTO real-time platform.</li>
          <li><strong>Writing:</strong> {latest ? <a href={`/blog/${latest.slug}`}>{latest.title}</a> : "field notes"} and more on real-time systems and AI engineering.</li>
          <li><strong>Open to:</strong> {profile.available ? "freelance and contract work — AI features, real-time platforms, SaaS." : "nothing new right now."}</li>
        </ul>
        <Button variant="primary" href="/hire" iconRight="arrow-right">Start a mission</Button>
      </section>
    </div>
  );
}
