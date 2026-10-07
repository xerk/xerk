import { BlogCard } from "@/components/xerk/blog";
import { BlogFilter } from "@/components/xerk/blog-filter";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { pageMeta, JsonLd } from "@/lib/seo";
import { SITE_URL } from "@/data/profile";

export const revalidate = 3600;
export const metadata = pageMeta({ title: "Blog: real-time systems, AI engineering, Node.js and Laravel", description: "Posts by Ahmed Mamdouh on WebSockets at scale, AI agents in production, RAG, NestJS, Laravel, caching and deploys.", path: "/blog" });

export default async function Blog() {
  const posts = await getPosts();
  const counts = new Map<string, number>();
  posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  const [featured, ...rest] = posts;
  return (
    <div className="xk-container">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Blog", name: "xerk.io blog", url: `${SITE_URL}/blog`, author: { "@id": `${SITE_URL}/#person` }, blogPost: posts.slice(0, 20).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.publishedAt })) }} />
      <header className="xk-page-head" data-hud="Blog">
        <span className="xk-label">Blog · {posts.length} posts</span>
        <h1 data-split="">Writing about real-time systems, AI and shipping software</h1>
        <p>What I learn from production work: WebSockets at scale, agents and RAG, NestJS, Laravel, caching and deploys.</p>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }}>
        {featured && <BlogCard post={featured} date={formatDate(featured.publishedAt)} featured />}
        <BlogFilter tags={tags}>
          <div className="xk-blog-grid">{rest.map((p) => <BlogCard key={p.slug} post={p} date={formatDate(p.publishedAt)} />)}</div>
        </BlogFilter>
      </section>
    </div>
  );
}
