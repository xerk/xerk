import { ProfileEditor } from "@/components/admin/content-editors";
import { getSite, readContentRows } from "@/lib/content";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [site, rows] = await Promise.all([getSite(), readContentRows()]);
  return (
    <>
      <div className="xk-admin-head">
        <div>
          <span className="xk-label">Content</span>
          <h1>Profile</h1>
          <p className="xk-muted">Name, headline, availability and links. Used on every page, in SEO data, llms.txt and Ask my CV.</p>
        </div>
      </div>
      <ProfileEditor initial={site.profile} socials={site.socials} updatedAt={rows.profile?.updated_at} />
    </>
  );
}
