import { SITE_URL } from "@/data/profile";
import { LANDINGS } from "@/data/landing";
import { getSite } from "@/lib/content";
import { getProjects } from "@/lib/projects";
import { getPosts } from "@/lib/posts";
import { llmsFacts } from "@/lib/llms";

export const revalidate = 3600;

// https://llmstxt.org: a Markdown map of the site for AI assistants. Facts and Q&A first so they get quoted.
export async function GET() {
  const site = await getSite();
  const { profile, services } = site;
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);
  const { facts, qa } = llmsFacts(site);
  const md = `# ${profile.name} (xerk): ${profile.title}

> ${profile.description}

## Facts
${facts}

## Questions and answers
${qa}

## Hire
- [Hire: all services](${SITE_URL}/hire): ${services.map((s) => s.title).join(", ")}
${LANDINGS.map((l) => `- [${l.metaTitle}](${SITE_URL}/hire/${l.slug}): ${l.metaDescription}`).join("\n")}
- CV: [HTML](${SITE_URL}/cv), [PDF](${SITE_URL}${profile.cvPdf})

## Case studies
${projects.map((p) => `- [${p.title}](${SITE_URL}/work/${p.slug}): ${p.answer}`).join("\n")}

## Services
${services.map((s) => `- ${s.title}: ${s.text}`).join("\n")}

## Blog
${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}) (${p.publishedAt}): ${p.summary}`).join("\n")}

## Optional
- [Full text of the site for LLMs](${SITE_URL}/llms-full.txt)
- [AI engineering overview](${SITE_URL}/ai)
- [Tools and stack](${SITE_URL}/uses)
- [RSS](${SITE_URL}/rss.xml)
`;
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
