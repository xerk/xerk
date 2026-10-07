import { notFound } from "next/navigation";
import { Breadcrumbs, Button, CTABar, KeyTakeaways, PostCard, SocialLinks, TableOfContents } from "@/components/xerk/ui";
import { getPost, getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { pageMeta, JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL, profile, socials } from "@/data/profile";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return {};
  return pageMeta({ title: p.title, description: p.summary.slice(0, 160), path: `/blog/${p.slug}`, type: "article", publishedTime: p.publishedAt, image: `/og?title=${encodeURIComponent(p.title)}&kind=Field%20note` });
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const all = await getPosts();
  const more = all.filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t))).slice(0, 3);
  const url = `${SITE_URL}/blog/${post.slug}`;
  return (
    <div className="xk-container">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.summary, datePublished: post.publishedAt, dateModified: post.publishedAt, url, mainEntityOfPage: url, author: { "@id": `${SITE_URL}/#person`, name: profile.name, url: SITE_URL }, keywords: post.tags.join(", "), image: `${SITE_URL}/og?title=${encodeURIComponent(post.title)}&kind=Field%20note` }} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Notes", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      <header className="xk-page-head" data-hud="Field note">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Notes", href: "/blog" }, { label: post.title }]} />
        <span className="xk-label">{formatDate(post.publishedAt)} · {post.readingTime} · by {profile.name}</span>
        <h1 data-split="">{post.title}</h1>
        <div className="xk-tags">{post.tags.map((t) => <span key={t} className="xk-badge">#{t}</span>)}</div>
      </header>
      <div className="xk-article" style={{ paddingTop: 0 }}>
        <aside className="xk-article-side">
          {post.headings.length > 1 && <TableOfContents items={post.headings} />}
          <Button variant="primary" size="sm" block href="/hire" track="hire_click">Work with me</Button>
          <SocialLinks links={socials} medium="blog" />
        </aside>
        <article style={{ display: "flex", flexDirection: "column", gap: 32, minWidth: 0 }}>
          {post.summary && <KeyTakeaways title="In one line" answer={post.summary} />}
          <div className="xk-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
          <CTABar title="Building something like this?" text={`I'm ${profile.name}, a senior full-stack & AI engineer. I reply within one working day.`}>
            <Button variant="primary" href="/hire" iconRight="arrow-right" track="hire_click">Start a mission</Button>
          </CTABar>
          {more.length > 0 && <div><span className="xk-label">More notes</span>{more.map((p) => <PostCard key={p.slug} href={`/blog/${p.slug}`} date={formatDate(p.publishedAt)} readingTime={p.readingTime} title={p.title} excerpt={p.summary} />)}</div>}
        </article>
      </div>
    </div>
  );
}
