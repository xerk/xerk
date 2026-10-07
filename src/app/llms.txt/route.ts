import { SITE_URL, profile, services, socials } from "@/data/profile";
import { projects } from "@/data/projects";
import { getPosts } from "@/lib/posts";

export const revalidate = 3600;

// https://llmstxt.org — a Markdown map of the site for AI assistants.
export async function GET() {
  const posts = await getPosts();
  const md = `# ${profile.name} — ${profile.title}

> ${profile.description}

- Location: ${profile.location} (${profile.timezone}), remote worldwide
- Availability: ${profile.availability} — ${SITE_URL}/hire
- Contact: ${profile.email}
- Profiles: ${socials.map((s) => `[${s.label}](${s.href})`).join(", ")}
- CV: [HTML](${SITE_URL}/cv), [PDF](${SITE_URL}${profile.cvPdf})
- Full text for LLMs: ${SITE_URL}/llms-full.txt

## Case studies
${projects.map((p) => `- [${p.title}](${SITE_URL}/work/${p.slug}): ${p.answer}`).join("\n")}

## Services
${services.map((s) => `- ${s.title}: ${s.text}`).join("\n")}

## Blog
${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}) (${p.publishedAt}): ${p.summary}`).join("\n")}
`;
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
