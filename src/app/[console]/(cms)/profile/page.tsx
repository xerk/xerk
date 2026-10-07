import { ProfileEditor } from "@/components/admin/content-editors";
import { getSite, readContentRows } from "@/lib/content";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [site, rows] = await Promise.all([getSite(), readContentRows()]);
  return <ProfileEditor initial={site.profile} socials={site.socials} updatedAt={rows.profile?.updated_at} />;
}
