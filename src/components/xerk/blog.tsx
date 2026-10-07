import Link from "next/link";
import { Icon } from "./icon";
import { cx } from "@/lib/utils";
import type { PostMeta } from "@/lib/posts";

const AI_TAGS = /ai|llm|rag|agent|mcp|claude|prompt/i;
const PATTERNS = ["dots", "grid", "rings", "stripes", "bars"] as const;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Cover art for a post: its own image if it has one, otherwise a generated, themed cover (no stock images). */
export function PostCover({ post, size = "md", priority }: { post: PostMeta; size?: "md" | "lg"; priority?: boolean }) {
  if (post.image) return <div className={cx("xk-cover", `is-${size}`)}><img src={post.image} alt="" loading={priority ? "eager" : "lazy"} /></div>;
  const h = hash(post.slug);
  const ai = post.tags.some((t) => AI_TAGS.test(t));
  const pattern = PATTERNS[h % PATTERNS.length];
  const tag = (post.tags[0] || "engineering").replace(/-/g, " ");
  return (
    <div className={cx("xk-cover", `is-${size}`, `p-${pattern}`, ai && "is-ai")} aria-hidden>
      <span className="xk-cover-tag">#{tag}</span>
      <span className="xk-cover-word" style={{ ["--len" as string]: Math.max(5, tag.split(" ")[0].length) }}>{tag.split(" ")[0]}</span>
      <span className="xk-cover-meta"><Icon name={post.video ? "play" : ai ? "sparkle" : "pen-nib"} />{post.video ? "Video" : post.readingTime}</span>
    </div>
  );
}

export function BlogCard({ post, date, featured }: { post: PostMeta; date: string; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={cx("xk-bcard", featured && "is-featured")} data-tags={post.tags.join(" ")}>
      <PostCover post={post} size={featured ? "lg" : "md"} priority={featured} />
      <div className="xk-bcard-body">
        <span className="xk-label">{date} · {post.readingTime}{post.video && " · video"}</span>
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
        <div className="xk-tags">{post.tags.slice(0, 3).map((t) => <span key={t} className="xk-badge">#{t}</span>)}</div>
        {featured && <span className="xk-readmore">Read the post<Icon name="arrow-right" /></span>}
      </div>
    </Link>
  );
}

/** YouTube / Vimeo / mp4 */
export function PostVideo({ src, title }: { src: string; title: string }) {
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  const vimeo = src.match(/vimeo\.com\/(\d+)/);
  const embed = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : null;
  return (
    <figure className="xk-frame" style={{ margin: 0 }}>
      <div className="xk-media" style={{ aspectRatio: "16 / 9" }}>
        {embed ? <iframe src={embed} title={title} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" style={{ width: "100%", height: "100%", border: 0 }} /> : <video src={src} controls playsInline preload="metadata" />}
      </div>
    </figure>
  );
}
