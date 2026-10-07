import { SiteDataEditor } from "@/components/admin/content-editors";
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
  return <SiteDataEditor sections={SECTIONS.map((s) => ({ ...s, value: site[s.key], updatedAt: rows[s.key]?.updated_at }))} />;
}
