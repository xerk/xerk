import { Suspense } from "react";
import { ProjectList, type ProjectListItem } from "@/components/admin/project-list";
import { adminDb } from "@/lib/supabase";
import { rowToProject, type ProjectRow } from "@/lib/projects";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const db = adminDb();
  const { data, error } = db ? await db.from("projects").select("slug,code,title,data,video_url,embed_url,published,sort").order("sort", { ascending: true }) : { data: [], error: null };
  const items: ProjectListItem[] = ((data || []) as ProjectRow[]).map((r) => {
    const p = rowToProject(r);
    return { slug: p.slug, code: p.code, title: p.title, world: p.world, image: p.image, published: r.published };
  });
  return <Suspense><ProjectList initial={items} error={error?.message} /></Suspense>;
}
