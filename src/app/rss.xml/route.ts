import { SITE_URL } from "@/data/profile";
import { getSite } from "@/lib/content";
import { getPosts } from "@/lib/posts";

export const revalidate = 3600;
const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string);

export async function GET() {
  const { profile } = await getSite();
  const posts = await getPosts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>xerk.io blog</title><link>${SITE_URL}/blog</link><description>${x(profile.description)}</description><language>en</language>
${posts.map((p) => `<item><title>${x(p.title)}</title><link>${SITE_URL}/blog/${p.slug}</link><guid>${SITE_URL}/blog/${p.slug}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${x(p.summary)}</description></item>`).join("\n")}
</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
