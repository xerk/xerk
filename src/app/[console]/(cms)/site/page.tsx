import { JsonSectionEditor } from "@/components/admin/content-editors";
import { getSite, readContentRows, type ContentKey } from "@/lib/content";

export const metadata = { title: "Site data" };
export const dynamic = "force-dynamic";

const SECTIONS: { key: Exclude<ContentKey, "profile" | "socials" | "experience">; label: string; help: string }[] = [
  { key: "stats", label: "Stats", help: "The number tiles on the home page and /play" },
  { key: "ticker", label: "Ticker", help: "The scrolling strip on /play" },
  { key: "skills", label: "Skills", help: "Grouped skills on /cv and /uses: { group: [items] }" },
  { key: "skillTree", label: "Skill tree", help: "Branches and nodes on /play" },
  { key: "aiStack", label: "AI stack", help: "Tools on /ai and /uses" },
  { key: "services", label: "Services", help: "Cards on /hire" },
  { key: "process", label: "Process", help: "Steps on /hire" },
  { key: "hireFaq", label: "Hire FAQ", help: "Questions on /hire (also FAQ rich results)" },
  { key: "achievements", label: "Achievements", help: "Badges on /play" },
  { key: "github", label: "GitHub numbers", help: "Fallback stats for the contribution heatmap" },
];

export default async function SitePage() {
  const [site, rows] = await Promise.all([getSite(), readContentRows()]);
  return (
    <>
      <div className="xk-admin-head">
        <div>
          <span className="xk-label">Content</span>
          <h1>Site data</h1>
          <p className="xk-muted">Everything else the site shows. Edit as JSON; it&rsquo;s checked before saving, and Reset brings back the built-in version.</p>
        </div>
      </div>
      <div className="xk-admin-stack">
        {SECTIONS.map((s) => <JsonSectionEditor key={s.key} sectionKey={s.key} label={s.label} help={s.help} initial={site[s.key]} updatedAt={rows[s.key]?.updated_at} />)}
      </div>
    </>
  );
}
