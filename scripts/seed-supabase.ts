// Seed Supabase from the repo's source of truth.
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import { projects } from "../src/data/projects.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const rows = projects.map((p, i) => ({ slug: p.slug, code: p.code, title: p.title, data: p, video_url: p.video ?? null, embed_url: p.embedUrl ?? null, published: true, sort: i }));
const { error: e1 } = await db.from("projects").upsert(rows);
console.log(e1 ? `projects: ${e1.message}` : `projects: ${rows.length} upserted`);

const dir = path.join(process.cwd(), "content");
const posts = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "index.mdx"))).map((slug) => {
  const { data, content } = matter(fs.readFileSync(path.join(dir, slug, "index.mdx"), "utf8"));
  return { slug, title: data.title, summary: data.summary, tags: data.tags || data.keywords || [], body_md: content, cover_url: data.image ?? null, status: "published", published_at: data.publishedAt, source: data.source || "site" };
});
const { error: e2 } = await db.from("posts").upsert(posts);
console.log(e2 ? `posts: ${e2.message}` : `posts: ${posts.length} upserted`);
