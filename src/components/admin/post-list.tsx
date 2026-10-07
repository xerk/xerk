"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/xerk/icon";
import { useAdminHref } from "./base";
import { Chip, EmptyState, PageHeader, statusTone } from "./ui";
import { NewPostSheet } from "./post-editor";

export type PostRow = { slug: string; title: string; status: string; date: string; tags: string[]; cover?: string };

const FILTERS = [["all", "All"], ["published", "Published"], ["draft", "Drafts"], ["repo", "Repo files"]] as const;
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "No date");

export function PostList({ rows, error }: { rows: PostRow[]; error?: string }) {
  const ah = useAdminHref();
  const params = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [q, setQ] = useState("");
  useEffect(() => { if (params.get("new") !== null) setCreating(true); }, [params]);
  const count = (f: string) => (f === "all" ? rows.length : rows.filter((r) => r.status === f).length);
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => (filter === "all" || r.status === filter) && (!needle || r.title.toLowerCase().includes(needle) || r.tags.some((t) => t.toLowerCase().includes(needle))));
  const newBtn = <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" onClick={() => setCreating(true)}><Icon name="plus" />New post</button>;
  return (
    <>
      <PageHeader eyebrow="Content" title="Posts" description="Everything on /blog. Drafts stay hidden until you publish; repo files are live from content/ until you save them here." meta={<><Chip dot tone="accent">{count("published")} published</Chip><Chip dot tone="warning">{count("draft")} drafts</Chip>{count("repo") > 0 && <Chip dot tone="agent">{count("repo")} repo files</Chip>}</>} actions={newBtn} />
      {error && <div className="xk-admin-alert is-error"><Icon name="warning-circle" /><div>{error}</div></div>}
      {rows.length === 0 ? (
        <EmptyState icon="pen-nib" title="No posts yet" actions={newBtn}>Posts you write here publish to /blog, RSS and the sitemap.</EmptyState>
      ) : (
        <>
          <div className="xk-admin-toolbar">
            <div className="xk-admin-tabs" role="group" aria-label="Filter posts">
              {FILTERS.filter(([id]) => id === "all" || count(id) > 0).map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}<span className="xk-admin-count">{count(id)}</span></button>)}
            </div>
            <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and tags…" aria-label="Search posts" /></label>
          </div>
          {shown.length === 0 ? <EmptyState icon="funnel" title="Nothing matches" ticks={false} actions={<button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</button>}>Try another filter or search.</EmptyState> : (
            <ul className="xk-list">
              {shown.map((p) => (
                <li key={p.slug}>
                  <Link href={ah(`/posts/${p.slug}`)} className="xk-list-row">
                    <span className="xk-list-thumb">{p.cover ? <img src={p.cover} alt="" loading="lazy" /> : <Icon name="file-text" />}</span>
                    <span className="xk-list-main">
                      <strong>{p.title || "Untitled"}</strong>
                      <span className="xk-list-sub">{fmt(p.date)} · /blog/{p.slug}</span>
                      {p.tags.length > 0 && <span className="xk-list-tags">{p.tags.slice(0, 4).map((t) => <Chip key={t} tag>#{t}</Chip>)}</span>}
                    </span>
                    <span className="xk-list-side"><Chip dot tone={statusTone(p.status)}>{p.status === "repo" ? "repo file" : p.status}</Chip><Icon name="caret-right" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <NewPostSheet open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
