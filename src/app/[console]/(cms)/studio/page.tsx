import type { Metadata } from "next";
import { Section, CodeLine } from "./parts";
import { PageHeader } from "@/components/admin/ui";
import { getProjects } from "@/lib/projects";
import { SITE_URL } from "@/data/profile";

export const metadata: Metadata = { title: "Video studio", robots: { index: false, follow: false } };

export default async function Studio() {
  const projects = await getProjects();
  return (
    <>
      <PageHeader eyebrow="Studio" title="Link → video" description={<>Turn any page into a short branded video and schedule it to LinkedIn / X through Postiz (post.xerk.io). Runs as the <code>link-to-video</code> Claude Code skill in this repo.</>} />
      <Section title="Run it" icon="terminal-window" description="In Claude Code, from the repo root:">
        <CodeLine cmd={`/link-to-video ${SITE_URL}/work/realtime-device-platform`} />
        <p className="xk-muted" style={{ margin: 0, fontSize: 13, lineHeight: "20px" }}>Options: <code>--target linkedin|x|both</code> · <code>--length 15|30|60</code> · <code>--aspect 16:9|9:16|1:1</code>. The skill scrapes the page, writes a script from real numbers, renders with HyperFrames, attaches the MP4 to the project and asks before scheduling.</p>
      </Section>
      <Section title="Case studies" icon="game-controller" description="One command per project, ready to copy.">
        {projects.map((p) => <CodeLine key={p.slug} label={p.title} cmd={`/link-to-video ${SITE_URL}/work/${p.slug}`} />)}
      </Section>
    </>
  );
}
