import { Suspense } from "react";
import { adminDb } from "@/lib/supabase";
import { fileSlugs, fromFile } from "@/lib/posts";
import { PostList, type PostRow } from "@/components/admin/post-list";

export const metadata = { title: "Posts" };
export const dynamic = "force-dynamic";

type Row = { slug: string; title: string; status: string; published_at: string | null; tags: string[] | null; cover_url: string | null };

export default async function AdminPosts() {
  const db = adminDb();
  const { data, error } = db ? await db.from("posts").select("slug,title,status,published_at,tags,cover_url").order("published_at", { ascending: false, nullsFirst: true }) : { data: [], error: null };
  const rows: PostRow[] = ((data || []) as Row[]).map((r) => ({ slug: r.slug, title: r.title, status: r.status === "published" ? "published" : "draft", date: r.published_at ? String(r.published_at).slice(0, 10) : "", tags: r.tags || [], cover: r.cover_url || undefined }));
  const inDb = new Set(rows.map((r) => r.slug));
  // Posts that only exist as content/ files (not yet in Supabase) are still live on the site.
  const repoOnly: PostRow[] = fileSlugs().filter((s) => !inDb.has(s)).map(fromFile).filter((p) => !!p).map((p) => ({ slug: p.slug, title: p.title, status: "repo", date: p.publishedAt, tags: p.tags, cover: p.image }));
  const all = [...rows, ...repoOnly].sort((a, b) => Number(b.status === "draft") - Number(a.status === "draft") || b.date.localeCompare(a.date));
  return <Suspense><PostList rows={all} error={error?.message} /></Suspense>;
}
