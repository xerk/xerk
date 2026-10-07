import { MediaLibrary } from "@/components/admin/media-library";
import { listMedia } from "@/app/[console]/actions";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";

export default async function AdminMedia() {
  const r = await listMedia();
  return <MediaLibrary initial={r.ok ? r.data || [] : []} error={r.ok ? undefined : r.error} />;
}
