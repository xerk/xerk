import { MediaLibrary, type MediaFile } from "@/components/admin/media-library";
import { adminDb } from "@/lib/supabase";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof adminDb>>;

/** Storage list() isn't recursive: walk folders (entries without an id are folders). */
async function walk(db: Db, prefix = "", depth = 0): Promise<MediaFile[]> {
  if (depth > 5) return [];
  const { data, error } = await db.storage.from("media").list(prefix, { limit: 1000, sortBy: { column: "updated_at", order: "desc" } });
  if (error || !data) return [];
  const out: MediaFile[] = [];
  const folders: string[] = [];
  for (const e of data) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    if (!e.id) { folders.push(path); continue; }
    if (e.name === ".emptyFolderPlaceholder") continue;
    const meta = (e.metadata || {}) as { size?: number; mimetype?: string };
    out.push({ path, url: db.storage.from("media").getPublicUrl(path).data.publicUrl, size: meta.size || 0, type: meta.mimetype || "", updated: e.updated_at || e.created_at || "" });
  }
  const nested = await Promise.all(folders.map((f) => walk(db, f, depth + 1)));
  return [...out, ...nested.flat()];
}

export default async function AdminMedia() {
  const db = adminDb();
  const files = db ? (await walk(db)).sort((a, b) => b.updated.localeCompare(a.updated)) : [];
  return (
    <>
      <div className="xk-admin-head">
        <div><span className="xk-label">Library</span><h1>Media</h1><p>Everything in the public <code>media</code> bucket: post covers, project covers, previews, screens and uploads.</p></div>
      </div>
      <MediaLibrary files={files} />
    </>
  );
}
