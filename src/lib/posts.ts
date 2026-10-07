import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { publicDb } from "./supabase";
import { readingTime } from "./utils";

export type PostMeta = { slug: string; title: string; publishedAt: string; summary: string; tags: string[]; image?: string; readingTime: string; source?: string };
export type Post = PostMeta & { html: string; markdown: string; headings: { id: string; label: string }[] };

const DIR = path.join(process.cwd(), "content");

export async function markdownToHtml(md: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, { theme: { light: "min-light", dark: "min-dark" }, keepBackground: false })
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function fromFile(slug: string): Omit<Post, "html"> | null {
  const file = path.join(DIR, slug, "index.mdx");
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((m) => ({ id: slugify(m[1]), label: m[1].trim() }));
  return {
    slug,
    title: data.title || slug,
    publishedAt: String(data.publishedAt || ""),
    summary: data.summary || "",
    tags: data.tags || data.keywords || (data.category ? [data.category] : []),
    image: data.image,
    source: data.source,
    readingTime: readingTime(content),
    markdown: content,
    headings,
  };
}

async function fromDb(): Promise<Omit<Post, "html">[]> {
  const db = publicDb();
  if (!db) return [];
  const { data, error } = await db.from("posts").select("slug,title,summary,tags,published_at,body_md,cover_url").eq("status", "published").order("published_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    slug: r.slug, title: r.title, summary: r.summary || "", tags: r.tags || [], publishedAt: String(r.published_at).slice(0, 10), image: r.cover_url || undefined,
    readingTime: readingTime(r.body_md || ""), markdown: r.body_md || "", source: "supabase",
    headings: [...(r.body_md || "").matchAll(/^##\s+(.+)$/gm)].map((m: RegExpMatchArray) => ({ id: slugify(m[1]), label: m[1].trim() })),
  }));
}

export const getPosts = cache(async (): Promise<PostMeta[]> => {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).map(fromFile).filter((p): p is Omit<Post, "html"> => !!p) : [];
  const db = await fromDb();
  const bySlug = new Map<string, Omit<Post, "html">>();
  [...files, ...db].forEach((p) => bySlug.set(p.slug, p));
  return [...bySlug.values()]
    .map(({ markdown: _m, headings: _h, ...meta }) => meta)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
});

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const p = fromFile(slug) || (await fromDb()).find((x) => x.slug === slug) || null;
  if (!p) return null;
  return { ...p, html: await markdownToHtml(p.markdown) };
});
