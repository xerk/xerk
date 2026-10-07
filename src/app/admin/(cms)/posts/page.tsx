import Link from "next/link";
import { adminDb } from "@/lib/supabase";
import { fileSlugs, fromFile } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

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
  return (
    <>
      <div className="xk-admin-head">
        <div><span className="xk-label">Content</span><h1>Posts</h1><p>{rows.filter((r) => r.status === "published").length} published · {rows.filter((r) => r.status !== "published").length} drafts{repoOnly.length ? ` · ${repoOnly.length} only in content/` : ""}</p></div>
        <Link className="xk-btn xk-btn-primary xk-btn-sm" href="/admin/posts/new">New post</Link>
      </div>
      {error && <p className="xk-admin-msg is-error">{error.message}</p>}
      <div className="xk-admin-table-wrap">
        <table className="xk-admin-table">
          <thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Tags</th></tr></thead>
          <tbody>
            {all.map((p) => (
              <tr key={p.slug}>
                <td><Link href={`/admin/posts/${p.slug}`}>{p.title}</Link><br /><span className="xk-muted" style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>/blog/{p.slug}</span></td>
                <td><span className={`xk-badge${p.status === "published" ? " xk-badge-accent" : ""}`}>{p.status === "repo" ? "repo file" : p.status}</span></td>
                <td className="is-num">{p.published_at ? formatDate(String(p.published_at).slice(0, 10)) : "—"}</td>
                <td><div className="xk-tags">{(p.tags || []).slice(0, 4).map((t) => <span key={t} className="xk-badge">#{t}</span>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
