import type { Metadata } from "next";
import { Section, CodeLine } from "./parts";
import { projects } from "@/data/projects";
import { SITE_URL } from "@/data/profile";

export const metadata: Metadata = { title: "Video studio", robots: { index: false, follow: false } };

export default function Studio() {
  return (
    <div className="xk-container">
      <header className="xk-page-head" data-hud="Studio"><span className="xk-label">Studio</span><h1>Link → video</h1><p>Turn any page into a short branded video and schedule it to LinkedIn / X through Postiz (post.xerk.io). Runs as the <code>link-to-video</code> Claude Code skill in this repo.</p></header>
      <Section title="Run it">
        <p>In Claude Code, from the repo root:</p>
        <CodeLine cmd={`/link-to-video ${SITE_URL}/work/alto`} />
        <p className="xk-muted">Options: <code>--target linkedin|x|both</code> · <code>--length 15|30|60</code> · <code>--aspect 16:9|9:16|1:1</code>. The skill scrapes the page, writes a script from real numbers, renders with HyperFrames, attaches the MP4 to the project and asks before scheduling.</p>
      </Section>
      <Section title="Case studies">
        {projects.map((p) => <CodeLine key={p.slug} label={p.title} cmd={`/link-to-video ${SITE_URL}/work/${p.slug}`} />)}
      </Section>
    </div>
  );
}
