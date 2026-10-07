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
import { adminDb, publicDb } from "./supabase";
import { readingTime } from "./utils";

export type PostMeta = { slug: string; title: string; publishedAt: string; summary: string; tags: string[]; image?: string; video?: string; readingTime: string; source?: string; lang?: string; dir?: "ltr" | "rtl" };
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

/** A post from content/<slug>/index.mdx (repo fallback). */
export function fromFile(slug: string): Omit<Post, "html"> | null {
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
    video: data.video,
    source: data.source,
    readingTime: readingTime(content),
    markdown: content,
    headings,
  };
}

type DbPosts = { published: Omit<Post, "html">[]; hidden: Set<string> };

/** Published rows (RLS-bound public client) plus the slugs of rows that exist but aren't published. */
async function fromDb(): Promise<DbPosts> {
  const out: DbPosts = { published: [], hidden: new Set() };
  const db = publicDb();
  if (!db) return out;
  try {
    const { data, error } = await db.from("posts").select("slug,title,summary,tags,published_at,body_md,cover_url,video_url,source,lang,dir").eq("status", "published").order("published_at", { ascending: false });
    if (!error && data) {
      out.published = data.map((r) => ({
        slug: r.slug, title: r.title, summary: r.summary || "", tags: r.tags || [], publishedAt: r.published_at ? String(r.published_at).slice(0, 10) : "",
        image: r.cover_url || undefined, video: r.video_url || undefined, source: r.source || "supabase", lang: r.lang || undefined, dir: r.dir || undefined,
        readingTime: readingTime(r.body_md || ""), markdown: r.body_md || "",
        headings: [...(r.body_md || "").matchAll(/^##\s+(.+)$/gm)].map((m: RegExpMatchArray) => ({ id: slugify(m[1]), label: m[1].trim() })),
      }));
    }
    // Drafts/unpublished rows must also hide the content/ file with the same slug, or Unpublish would do nothing.
    const admin = adminDb();
    if (admin) {
      const { data: rest } = await admin.from("posts").select("slug").neq("status", "published");
      rest?.forEach((r) => out.hidden.add(r.slug));
    }
  } catch {
    // Network/DB failure: fall back to content/ files.
  }
  return out;
}

const loadDb = cache(fromDb);

export function fileSlugs(): string[] {
  return fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((d) => fs.existsSync(path.join(DIR, d, "index.mdx"))) : [];
}

export const getPosts = cache(async (): Promise<PostMeta[]> => {
  const db = await loadDb();
  const files = fileSlugs().filter((s) => !db.hidden.has(s)).map(fromFile).filter((p): p is Omit<Post, "html"> => !!p);
  const bySlug = new Map<string, Omit<Post, "html">>();
  // Supabase (edited in /admin) is the source of truth; content/ files fill in slugs the DB doesn't have.
  [...files, ...db.published].forEach((p) => bySlug.set(p.slug, p));
  return [...bySlug.values()]
    .map(({ markdown: _m, headings: _h, ...meta }) => meta)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
});

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const db = await loadDb();
  const p = db.published.find((x) => x.slug === slug) || (db.hidden.has(slug) ? null : fromFile(slug));
  if (!p) return null;
  return { ...p, html: await markdownToHtml(p.markdown) };
});
