"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reorderProjects, setProjectPublished } from "@/app/[console]/actions";
import { StatusText, useAction } from "./shared";
import { useAdminHref } from "@/components/admin/base";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/xerk/icon";

export type ProjectListItem = { slug: string; code: string; title: string; world: string; image?: string; published: boolean };

/** Drag (desktop) or ↑/↓ (anywhere) to reorder; each change saves `sort` right away. */
export function ProjectList({ initial }: { initial: ProjectListItem[] }) {
  const router = useRouter();
  const ah = useAdminHref();
  const [items, setItems] = useState(initial);
  const [drag, setDrag] = useState<number | null>(null);
  const { status, pending, exec } = useAction();

  const persist = async (next: ProjectListItem[]) => {
    const prev = items;
    setItems(next);
    const r = await exec(() => reorderProjects(next.map((p) => p.slug)), "Saving order…");
    if (!r.ok) setItems(prev); else router.refresh();
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
    const r = await exec(() => setProjectPublished(slug, published));
    if (!r.ok) setItems((list) => list.map((p) => (p.slug === slug ? { ...p, published: !published } : p))); else router.refresh();
  };

  return (
    <>
    {status.kind !== "idle" && <div className="xk-admin-toolbar"><StatusText status={status} /></div>}
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
            <span><b className="xk-order-code">{p.code}</b>{p.world} · /work/{p.slug}</span>
          </div>
          <div className="xk-order-side">
            <label className="xk-switch"><input type="checkbox" checked={p.published} disabled={pending} onChange={(e) => toggle(p.slug, e.target.checked)} />{p.published ? "Live" : "Hidden"}</label>
            <button type="button" className="xk-iconbtn-sm" aria-label={`Move ${p.title} up`} disabled={i === 0 || pending} onClick={() => move(i, -1)}><Icon name="arrow-up" /></button>
            <button type="button" className="xk-iconbtn-sm" aria-label={`Move ${p.title} down`} disabled={i === items.length - 1 || pending} onClick={() => move(i, 1)}><Icon name="arrow-down" /></button>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
