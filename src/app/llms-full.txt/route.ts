import { SITE_URL } from "@/data/profile";
import { LANDINGS } from "@/data/landing";
import { getSite } from "@/lib/content";
import { getProjects } from "@/lib/projects";
import { getPost, getPosts } from "@/lib/posts";
import { llmsFacts } from "@/lib/llms";

export const revalidate = 3600;

export async function GET() {
  const site = await getSite();
  const { experience, profile, skills, services } = site;
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);
  const bodies = await Promise.all(posts.map((p) => getPost(p.slug)));
  const { facts, qa } = llmsFacts(site);
  const md = `# ${profile.name} (xerk): ${profile.title}

${profile.description}

## Facts
${facts}

## Questions and answers
${qa}

## Experience
${experience.map((e) => `### ${e.role}, ${e.company} (${e.where}, ${e.period})\n${e.summary}\n${e.objectives.map((o) => `- ${o}`).join("\n")}\nStack: ${e.stack.join(", ")}`).join("\n\n")}

## Skills
${Object.entries(skills).map(([k, v]) => `- ${k}: ${v.join(", ")}`).join("\n")}

## Services (${SITE_URL}/hire)
${services.map((s) => `### ${s.title}\n${s.text}\nTypical timeline: ${s.timeline}\n${s.features.map((f) => `- ${f}`).join("\n")}`).join("\n\n")}

${LANDINGS.map((l) => `## ${l.h1} (${SITE_URL}/hire/${l.slug})\n${l.intro}\n\n${l.proof.map((p) => `- ${p.value} ${p.title}: ${p.text}`).join("\n")}\n\n### ${l.buildTitle}\n${l.build.map((b) => `- ${b.title}: ${b.text}`).join("\n")}\n\n${l.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}`).join("\n\n")}

## Case studies
${projects.map((p) => `### ${p.title} (${SITE_URL}/work/${p.slug})\n${p.answer}\n\n${p.sections.map((s) => `#### ${s.title}\n${s.body.join("\n\n")}`).join("\n\n")}\n${p.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`).join("\n\n")}

## Blog
${bodies.filter(Boolean).map((b) => `### ${b!.title} (${b!.publishedAt}) ${SITE_URL}/blog/${b!.slug}\n${b!.markdown.trim()}`).join("\n\n")}
`;
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
