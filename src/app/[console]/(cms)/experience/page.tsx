import { ExperienceEditor } from "@/components/admin/content-editors";
import { getSite, readContentRows } from "@/lib/content";

export const metadata = { title: "Experience" };
export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const [site, rows] = await Promise.all([getSite(), readContentRows()]);
  return <ExperienceEditor initial={site.experience} updatedAt={rows.experience?.updated_at} />;
}
