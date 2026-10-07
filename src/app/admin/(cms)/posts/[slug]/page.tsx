import { notFound } from "next/navigation";
import { PostEditor, type PostDraft } from "@/components/admin/post-editor";
import { adminDb } from "@/lib/supabase";
import { fromFile } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug === "new" ? "New post" : `Edit ${slug}` };
}

export default async function EditPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "new") {
    const blank: PostDraft = { slug: "", title: "", summary: "", tags: "", body_md: "", cover_url: "", video_url: "", status: "draft", published_at: "" };
    return <PostEditor key="new" initial={blank} isNew />;
  }
  const db = adminDb();
  const { data: row } = db ? await db.from("posts").select("*").eq("slug", slug).maybeSingle() : { data: null };
  if (row) {
    const initial: PostDraft = {
      slug: row.slug, title: row.title || "", summary: row.summary || "", tags: (row.tags || []).join(", "), body_md: row.body_md || "",
      cover_url: row.cover_url || "", video_url: row.video_url || "", status: row.status === "published" ? "published" : "draft",
      published_at: row.published_at ? String(row.published_at).slice(0, 10) : "",
    };
    return <PostEditor key={slug} initial={initial} isNew={false} />;
  }
  // Repo-only post: open it from content/; saving copies it into Supabase.
  const file = fromFile(slug);
  if (!file) notFound();
  const initial: PostDraft = { slug, title: file.title, summary: file.summary, tags: file.tags.join(", "), body_md: file.markdown, cover_url: file.image || "", video_url: file.video || "", status: "published", published_at: file.publishedAt };
  return <PostEditor key={slug} initial={initial} isNew={false} fromRepo />;
}
