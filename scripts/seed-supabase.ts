// Seed Supabase from the repo (src/data/projects.ts + content/*/index.mdx).
// Supabase is the source of truth once the /admin CMS is in use, so by default this only INSERTS rows that are
// missing and never touches rows that already exist (your CMS edits are safe).
//   pnpm seed                 # insert missing projects/posts only
//   pnpm seed -- --overwrite  # replace existing rows with the repo versions (discards CMS edits to those rows)
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. node --env-file=.env.local ...).
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import { projects } from "../src/data/projects.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const overwrite = process.argv.includes("--overwrite");
const db = createClient(url, key, { auth: { persistSession: false } });

// Projects: the full Project object (image, video, screens, embedUrl, sections, faq…) goes into `data`.
const projectRows = projects.map((p, i) => ({ slug: p.slug, code: p.code, title: p.title, data: p, video_url: p.video ?? null, embed_url: p.embedUrl ?? null, published: true, sort: i }));
const { data: pr, error: e1 } = await db.from("projects").upsert(projectRows, { onConflict: "slug", ignoreDuplicates: !overwrite }).select("slug");
console.log(e1 ? `projects: ${e1.message}` : `projects: ${pr?.length ?? 0} ${overwrite ? "upserted" : "inserted (existing rows left alone)"}`);

const dir = path.join(process.cwd(), "content");
const posts = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "index.mdx"))).map((slug) => {
  const { data, content } = matter(fs.readFileSync(path.join(dir, slug, "index.mdx"), "utf8"));
  return {
    slug,
    title: data.title,
    summary: data.summary,
    tags: data.tags || data.keywords || (data.category ? [data.category] : []),
    body_md: content,
    cover_url: data.image ?? null,
    video_url: data.video ?? null,
    status: "published",
    published_at: data.publishedAt,
    source: data.source || "site",
  };
});
const { data: po, error: e2 } = await db.from("posts").upsert(posts, { onConflict: "slug", ignoreDuplicates: !overwrite }).select("slug");
console.log(e2 ? `posts: ${e2.message}` : `posts: ${po?.length ?? 0} ${overwrite ? "upserted" : "inserted (existing rows left alone)"}`);
