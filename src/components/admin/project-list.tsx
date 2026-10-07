"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { reorderProjects, setProjectPublished } from "@/app/[console]/actions";
import { useAdminHref } from "@/components/admin/base";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/xerk/icon";
import { Chip, EmptyState, PageHeader } from "./ui";
import { useToast } from "./sheet";
import { NewProjectSheet } from "./project-editor";

export type ProjectListItem = { slug: string; code: string; title: string; world: string; image?: string; published: boolean };

/** Drag (desktop) or ↑/↓ (anywhere) to reorder; each change saves `sort` right away. */
export function ProjectList({ initial, error }: { initial: ProjectListItem[]; error?: string }) {
  const router = useRouter();
  const ah = useAdminHref();
  const params = useSearchParams();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [drag, setDrag] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  useEffect(() => setItems(initial), [initial]);
  useEffect(() => { if (params.get("new") !== null) setCreating(true); }, [params]);

  const persist = async (next: ProjectListItem[]) => {
    const prev = items;
    setItems(next);
    setBusy(true);
    const r = await reorderProjects(next.map((p) => p.slug));
    setBusy(false);
    if (!r.ok) { setItems(prev); toast.error("Couldn't save the order", r.error); return; }
    toast.push({ tone: "ok", title: "Order saved", action: { label: "Undo", run: async () => { setItems(prev); const u = await reorderProjects(prev.map((p) => p.slug)); if (u.ok) router.refresh(); } } });
    router.refresh();
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = [...items];
    [n[i], n[j]] = [n[j], n[i]];
    persist(n);
  };
  const toggle = async (slug: string, published: boolean) => {
    setItems((list) => list.map((p) => (p.slug === slug ? { ...p, published } : p)));
    const r = await setProjectPublished(slug, published);
    if (!r.ok) { setItems((list) => list.map((p) => (p.slug === slug ? { ...p, published: !published } : p))); toast.error("Couldn't update", r.error); return; }
    toast.ok(published ? "Live on the site" : "Hidden from the site");
    router.refresh();
  };
  const live = items.filter((p) => p.published).length;
  const newBtn = <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" onClick={() => setCreating(true)}><Icon name="plus" />New project</button>;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Projects"
        description="Case studies at /work, in this order on the home page, /work and the level select. Drag or use the arrows to reorder; it saves right away."
        meta={items.length > 0 ? <><Chip dot tone="accent">{live} live</Chip>{items.length - live > 0 && <Chip dot tone="warning">{items.length - live} hidden</Chip>}</> : undefined}
        actions={newBtn}
      />
      {error && <div className="xk-admin-alert is-error"><Icon name="warning-circle" /><div>{error}</div></div>}
      {items.length === 0 ? (
        <EmptyState icon="game-controller" title="No projects in Supabase yet" actions={newBtn}>The site is showing the static list from src/data/projects.ts. Run <code>pnpm seed</code> to import it, or create one.</EmptyState>
      ) : (
        <div className="xk-order">
          {items.map((p, i) => (
            <div
              key={p.slug}
              className={cx("xk-order-item", drag === i && "is-drag", !p.published && "is-hidden")}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag === null || drag === i) return; const n = [...items]; const [m] = n.splice(drag, 1); n.splice(i, 0, m); setDrag(null); persist(n); }}
              onDragEnd={() => setDrag(null)}
            >
              <span className="xk-order-handle" aria-hidden title="Drag to reorder"><Icon name="dots-six-vertical" /></span>
              {p.image ? <img src={p.image} alt="" /> : <span className="xk-order-thumb" />}
              <div className="xk-order-title">
                <Link href={ah(`/projects/${p.slug}`)}>{p.title}</Link>
                <span><b className="xk-order-code">{p.code}</b>{p.world ? `${p.world} · ` : ""}/work/{p.slug}</span>
              </div>
              <div className="xk-order-side">
                <label className="xk-switch"><input type="checkbox" role="switch" checked={p.published} disabled={busy} onChange={(e) => toggle(p.slug, e.target.checked)} />{p.published ? "Live" : "Hidden"}</label>
                <button type="button" className="xk-iconbtn-sm" aria-label={`Move ${p.title} up`} disabled={i === 0 || busy} onClick={() => move(i, -1)}><Icon name="arrow-up" /></button>
                <button type="button" className="xk-iconbtn-sm" aria-label={`Move ${p.title} down`} disabled={i === items.length - 1 || busy} onClick={() => move(i, 1)}><Icon name="arrow-down" /></button>
                <Link href={ah(`/projects/${p.slug}`)} className="xk-btn xk-btn-secondary xk-btn-sm"><Icon name="pencil-simple" />Edit</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <NewProjectSheet open={creating} onClose={() => setCreating(false)} nextCode={`1-${items.length + 1}`} />
    </>
  );
}
