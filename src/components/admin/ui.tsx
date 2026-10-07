import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";

/* Presentational dashboard primitives (no hooks: usable from server and client components).
   Styles: src/styles/admin.css. Live reference: <admin base>/ui */

export type Tone = "neutral" | "accent" | "agent" | "warning" | "danger";

/** Page title block: eyebrow (mono), h1, description, right-aligned actions, optional meta chips row. */
export function PageHeader({ eyebrow, title, description, actions, meta }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="xk-admin-head">
      <div>
        {eyebrow && <span className="xk-label">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {meta && <div className="xk-admin-head-meta">{meta}</div>}
      </div>
      {actions && <div className="xk-admin-actions">{actions}</div>}
    </header>
  );
}

/** Card section with an optional header (title, description, icon, actions). `flush` removes padding for tables. */
export function Panel({ title, description, icon, actions, flush, className, children, id }: { title?: ReactNode; description?: ReactNode; icon?: string; actions?: ReactNode; flush?: boolean; className?: string; children?: ReactNode; id?: string }) {
  return (
    <section className={cx("xk-admin-panel", flush && "is-flush", className)} id={id}>
      {(title || actions) && (
        <div className="xk-admin-panel-head">
          <div>
            {title && <h2>{icon && <Icon name={icon} />}{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="xk-admin-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export type KpiItem = { label: string; value: ReactNode; hint?: ReactNode; icon?: string; tone?: "accent" | "agent"; href?: string };

export function Kpi({ label, value, hint, icon, tone, href }: KpiItem) {
  const body = (
    <>
      <span className="xk-admin-kpi-label">{icon && <Icon name={icon} />}{label}</span>
      <span className="xk-admin-kpi-value">{value}</span>
      {(hint || href) && <span className="xk-admin-kpi-hint">{hint}{href && <Icon name="arrow-right" />}</span>}
    </>
  );
  const cls = cx("xk-admin-kpi", tone && `is-${tone}`);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** A strip of KPI tiles separated by hairlines. `ticks` adds the HUD corner marks. */
export function KpiGrid({ items, ticks }: { items: KpiItem[]; ticks?: boolean }) {
  return <div className={cx("xk-admin-kpis", ticks && "xk-admin-ticks")}>{items.map((k) => <Kpi key={k.label} {...k} />)}</div>;
}

/** Status pill. `dot` adds a leading status dot. */
export function Chip({ tone = "neutral", dot, icon, outline, tag, children, title }: { tone?: Tone; dot?: boolean; icon?: string; outline?: boolean; tag?: boolean; children: ReactNode; title?: string }) {
  return <span title={title} className={cx("xk-admin-chip", tone !== "neutral" && `is-${tone}`, dot && "has-dot", outline && "is-outline", tag && "is-tag")}>{icon && <Icon name={icon} />}{children}</span>;
}

/** Map common record statuses to chip tones. */
export function statusTone(s: string): Tone {
  if (["published", "live", "connected", "won", "new"].includes(s)) return "accent";
  if (["draft", "pending", "hidden"].includes(s)) return "warning";
  if (["replied", "repo", "static"].includes(s)) return "agent";
  if (["spam", "missing", "error", "failed"].includes(s)) return "danger";
  return "neutral";
}

export function EmptyState({ icon = "tray", title, children, actions, ticks = true }: { icon?: string; title: ReactNode; children?: ReactNode; actions?: ReactNode; ticks?: boolean }) {
  return (
    <div className={cx("xk-admin-empty", ticks && "xk-admin-ticks")}>
      <span className="xk-admin-empty-icon"><Icon name={icon} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="xk-admin-actions">{actions}</div>}
    </div>
  );
}

export function Alert({ tone, icon, children }: { tone?: "error" | "warning"; icon?: string; children: ReactNode }) {
  return (
    <div className={cx("xk-admin-alert", tone && `is-${tone}`)} role={tone === "error" ? "alert" : undefined}>
      <Icon name={icon || (tone ? "warning-circle" : "info")} />
      <div>{children}</div>
    </div>
  );
}

/** Ranked list with proportional bars. */
export function RankList({ items, empty = "Nothing yet", format }: { items: [string, number][]; empty?: string; format?: (k: string) => string }) {
  if (!items.length) return <p className="xk-muted" style={{ margin: 0, fontSize: 13 }}>{empty}</p>;
  const max = Math.max(...items.map(([, n]) => n), 1);
  return (
    <ul className="xk-admin-rank">
      {items.map(([k, n]) => <li key={k} style={{ "--w": `${Math.round((n / max) * 100)}%` } as CSSProperties}><span title={k}>{format ? format(k) : k}</span><span>{n}</span></li>)}
    </ul>
  );
}

export function Skeleton({ variant, width }: { variant?: "title" | "block" | "circle"; width?: string | number }) {
  return <span aria-hidden className={cx("xk-admin-skel", variant && `is-${variant}`)} style={width ? { width } : undefined} />;
}

/** Comma-separated tags rendered as chips (the "tag input" look under a plain text field). */
export function TagPreview({ value }: { value: string | string[] }) {
  const tags = (Array.isArray(value) ? value : value.split(",")).map((t) => t.trim()).filter(Boolean);
  return <div className="xk-admin-taglist">{tags.map((t, i) => <Chip key={`${t}-${i}`} tag>#{t}</Chip>)}</div>;
}
