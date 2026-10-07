import { PostCard } from "@/components/xerk/ui";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { pageMeta, JsonLd } from "@/lib/seo";
import { SITE_URL } from "@/data/profile";

export const revalidate = 3600;
export const metadata = pageMeta({ title: "Field notes — real-time systems, AI engineering, Node.js and Laravel", description: "Practical notes by Ahmed Mamdouh on WebSockets at scale, AI agents in production, RAG, NestJS, Laravel, caching and the boring parts that matter.", path: "/blog" });

export default async function Blog() {
  const posts = await getPosts();
  const tags = [...new Set(posts.flatMap((p) => p.tags))].slice(0, 16);
  return (
    <div className="xk-container">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Blog", name: "xerk field notes", url: `${SITE_URL}/blog`, author: { "@id": `${SITE_URL}/#person` }, blogPost: posts.slice(0, 20).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.publishedAt })) }} />
      <header className="xk-page-head" data-hud="Field notes">
        <span className="xk-label">Field notes · {posts.length} entries</span>
        <h1 data-split="">Notes on real-time systems, AI and shipping</h1>
        <p>Short, practical write-ups from production work: WebSockets at scale, agents and RAG, NestJS, Laravel, caching and deploys.</p>
        <div className="xk-tags">{tags.map((t) => <span key={t} className="xk-badge">#{t}</span>)}</div>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }}>
        <div>{posts.map((p) => <PostCard key={p.slug} href={`/blog/${p.slug}`} date={formatDate(p.publishedAt)} readingTime={p.readingTime} title={p.title} excerpt={p.summary} />)}</div>
      </section>
    </div>
  );
}
