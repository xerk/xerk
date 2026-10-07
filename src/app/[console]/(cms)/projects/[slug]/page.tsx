import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/project-editor";
import { adminDb } from "@/lib/supabase";
import { rowToProject, type ProjectRow } from "@/lib/projects";
import { projects as staticProjects, type Project } from "@/data/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug === "new" ? "New project" : `Edit ${slug}` };
}

export default async function EditProject({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "new") {
    const db = adminDb();
    const { count } = db ? await db.from("projects").select("slug", { count: "exact", head: true }) : { count: 0 };
    const blank: Project = { slug: "", code: `1-${(count ?? 0) + 1}`, title: "", world: "", company: "", period: "", role: "", summary: "", answer: "", takeaways: [], boss: "", stack: [], metrics: [], sections: [{ id: "problem", title: "The problem", body: [] }, { id: "approach", title: "Approach", body: [] }, { id: "results", title: "Results", body: [] }], faq: [], updated: "" };
    return <ProjectEditor key="new" initial={blank} isNew published inDb={false} />;
  }
  const db = adminDb();
  const { data: row } = db ? await db.from("projects").select("slug,code,title,data,video_url,embed_url,published,sort").eq("slug", slug).maybeSingle() : { data: null };
  if (row) return <ProjectEditor key={slug} initial={rowToProject(row as ProjectRow)} isNew={false} published={(row as ProjectRow).published} inDb />;
  const fallback = staticProjects.find((p) => p.slug === slug);
  if (!fallback) notFound();
  return <ProjectEditor key={slug} initial={fallback} isNew={false} published inDb={false} />;
}
