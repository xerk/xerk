import { ExperienceEditor } from "@/components/admin/content-editors";
import { getSite, readContentRows } from "@/lib/content";

export const metadata = { title: "Experience" };
export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const [site, rows] = await Promise.all([getSite(), readContentRows()]);
  return (
    <>
      <div className="xk-admin-head">
        <div>
          <span className="xk-label">Content</span>
          <h1>Experience</h1>
          <p className="xk-muted">Your roles, newest first. Shown on the home page, the CV page, /play and in Ask my CV.</p>
        </div>
      </div>
      <ExperienceEditor initial={site.experience} updatedAt={rows.experience?.updated_at} />
    </>
  );
}
