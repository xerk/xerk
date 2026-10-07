import Link from "next/link";
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
  return (
    <>
      <div className="xk-admin-head">
        <div><span className="xk-label">Content</span><h1>Projects</h1><p>Case studies at /work, in this order on the home page, /work and the level select. Drag or use the arrows to reorder.</p></div>
        <Link className="xk-btn xk-btn-primary xk-btn-sm" href="/admin/projects/new">New project</Link>
      </div>
      {error && <p className="xk-admin-msg is-error">{error.message}</p>}
      {items.length === 0 ? <p className="xk-muted">No projects in Supabase yet; the site is showing the static list from src/data/projects.ts. Run <code>pnpm seed</code> or create one.</p> : <ProjectList initial={items} />}
    </>
  );
}
