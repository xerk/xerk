import Link from "next/link";
import { Icon } from "@/components/xerk/icon";
import { Alert, Chip, EmptyState, PageHeader } from "@/components/admin/ui";
import { adminHref } from "@/lib/admin-path";
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
  const live = items.filter((p) => p.published).length;
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Projects"
        description="Case studies at /work, in this order on the home page, /work and the level select. Drag a row or use the arrows to reorder; it saves right away."
        meta={items.length > 0 ? <><Chip dot tone="accent">{live} live</Chip>{items.length - live > 0 && <Chip dot tone="warning">{items.length - live} hidden</Chip>}</> : undefined}
        actions={<Link className="xk-btn xk-btn-primary xk-btn-sm" href={adminHref("/projects/new")}><Icon name="plus" />New project</Link>}
      />
      {error && <Alert tone="error">{error.message}</Alert>}
      {items.length === 0 ? (
        <EmptyState icon="game-controller" title="No projects in Supabase yet" actions={<Link className="xk-btn xk-btn-primary xk-btn-sm" href={adminHref("/projects/new")}><Icon name="plus" />Create one</Link>}>The site is showing the static list from src/data/projects.ts. Run <code>pnpm seed</code> to import it, or create one.</EmptyState>
      ) : <ProjectList initial={items} />}
    </>
  );
}
