import Link from "next/link";
import { adminHref } from "@/lib/admin-path";
import { adminDb } from "@/lib/supabase";
import { fileSlugs, fromFile } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/xerk/icon";
import { Alert, Chip, EmptyState, PageHeader, statusTone } from "@/components/admin/ui";

export const metadata = { title: "Posts" };
export const dynamic = "force-dynamic";

type Row = { slug: string; title: string; status: string; published_at: string | null; tags: string[] | null; updated_at: string | null; source: string | null };

export default async function AdminPosts() {
  const db = adminDb();
  const { data, error } = db ? await db.from("posts").select("slug,title,status,published_at,tags,updated_at,source").order("published_at", { ascending: false, nullsFirst: true }) : { data: [], error: null };
  const rows = (data || []) as Row[];
  const inDb = new Set(rows.map((r) => r.slug));
  // Posts that only exist as content/ files (not yet in Supabase) — still live on the site.
  const repoOnly = fileSlugs().filter((s) => !inDb.has(s)).map(fromFile).filter((p) => !!p).map((p) => ({ slug: p.slug, title: p.title, status: "repo", published_at: p.publishedAt, tags: p.tags, updated_at: null, source: "content/" }));
  const all = [...rows, ...repoOnly].sort((a, b) => (a.status === "draft" ? -1 : 0) - (b.status === "draft" ? -1 : 0) || String(b.published_at || "").localeCompare(String(a.published_at || "")));
  const published = rows.filter((r) => r.status === "published").length;
  const draftCount = rows.filter((r) => r.status !== "published").length;
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Posts"
        description="Blog posts at /blog. Drafts float to the top; repo files are live from content/ until you save them here."
        meta={<><Chip dot tone="accent">{published} published</Chip><Chip dot tone="warning">{draftCount} drafts</Chip>{repoOnly.length > 0 && <Chip dot tone="agent">{repoOnly.length} only in content/</Chip>}</>}
        actions={<Link className="xk-btn xk-btn-primary xk-btn-sm" href={adminHref("/posts/new")}><Icon name="plus" />New post</Link>}
      />
      {error && <Alert tone="error">{error.message}</Alert>}
      {all.length === 0 ? (
        <EmptyState icon="pen-nib" title="No posts yet" actions={<Link className="xk-btn xk-btn-primary xk-btn-sm" href={adminHref("/posts/new")}><Icon name="plus" />Write the first one</Link>}>Posts you write here publish to /blog, RSS and the sitemap.</EmptyState>
      ) : (
        <div className="xk-admin-table-wrap">
          <table className="xk-admin-table">
            <thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Tags</th></tr></thead>
            <tbody>
              {all.map((p) => (
                <tr key={p.slug}>
                  <td><div className="xk-admin-cell-title"><Link href={adminHref(`/posts/${p.slug}`)}>{p.title}</Link><span className="xk-admin-cell-sub">/blog/{p.slug}</span></div></td>
                  <td className="is-shrink"><Chip dot tone={statusTone(p.status)}>{p.status === "repo" ? "repo file" : p.status}</Chip></td>
                  <td className="is-num">{p.published_at ? formatDate(String(p.published_at).slice(0, 10)) : "—"}</td>
                  <td><div className="xk-tags">{(p.tags || []).slice(0, 4).map((t) => <Chip key={t} tag>#{t}</Chip>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
