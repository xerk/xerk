import { SITE_URL, experience, profile, skills } from "@/data/profile";
import { getProjects } from "@/lib/projects";
import { getPost, getPosts } from "@/lib/posts";

export const revalidate = 3600;

export async function GET() {
  const projects = await getProjects();
  const posts = await getPosts();
  const bodies = await Promise.all(posts.map((p) => getPost(p.slug)));
  const md = `# ${profile.name} — ${profile.title}

${profile.description}

## Experience
${experience.map((e) => `### ${e.role}, ${e.company} (${e.where}, ${e.period})\n${e.summary}\n${e.objectives.map((o) => `- ${o}`).join("\n")}\nStack: ${e.stack.join(", ")}`).join("\n\n")}

## Skills
${Object.entries(skills).map(([k, v]) => `- ${k}: ${v.join(", ")}`).join("\n")}

## Case studies
${projects.map((p) => `### ${p.title} — ${SITE_URL}/work/${p.slug}\n${p.answer}\n\n${p.sections.map((s) => `#### ${s.title}\n${s.body.join("\n\n")}`).join("\n\n")}\n${p.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`).join("\n\n")}

## Blog
${bodies.filter(Boolean).map((b) => `### ${b!.title} (${b!.publishedAt}) — ${SITE_URL}/blog/${b!.slug}\n${b!.markdown.trim()}`).join("\n\n")}
`;
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
