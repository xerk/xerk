import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icon";
import { cx, pad2 } from "@/lib/utils";
import type { Social, Stat, Achievement as AchievementT, Quest } from "@/data/profile";

/* ---------- Brand ---------- */
export function LogoMark({ size = 28, tile, mono, blink = true }: { size?: number; tile?: boolean; mono?: boolean; blink?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={cx("xk-mark", tile && "xk-mark-on-tile", mono && "xk-mark-mono", blink && "is-blink")} aria-hidden>
      {tile && <rect className="xk-mark-tile" width="64" height="64" rx="14" />}
      <g className="xk-mark-a" strokeWidth="6.5" strokeLinecap="round"><path d="M15 21 32 43" /><path d="M32 21 15 43" /></g>
      <rect className="xk-mark-b-fill xk-mark-cursor" x="38" y="19" width="11" height="26" rx="2.5" />
    </svg>
  );
}

export function Logo({ size = 28, href, mono, wordmark = true }: { size?: number; href?: string; mono?: boolean; wordmark?: boolean }) {
  const inner = (
    <>
      <LogoMark size={size} mono={mono} />
      {wordmark && <span className="xk-wordmark" style={{ fontSize: size * 0.72 }}>xerk</span>}
    </>
  );
  return href ? <Link href={href} className="xk-logo" aria-label="xerk — home">{inner}</Link> : <span className="xk-logo">{inner}</span>;
}

/* ---------- Actions ---------- */
type BtnProps = { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "agent"; size?: "sm" | "md" | "lg"; icon?: string; brand?: string; iconRight?: string; href?: string; block?: boolean; magnetic?: boolean; className?: string; external?: boolean; type?: "button" | "submit"; track?: string };
export function Button({ children, variant = "secondary", size, icon, brand, iconRight, href, block, magnetic, className, external, type = "button", track }: BtnProps) {
  const cls = cx("xk-btn", `xk-btn-${variant}`, size && size !== "md" && `xk-btn-${size}`, block && "xk-btn-block", className);
  const body = (
    <>
      {(icon || brand) && <Icon name={icon} brand={brand} />}
      {children}
      {iconRight && <Icon name={iconRight} className="xk-btn-trail" />}
    </>
  );
  const data = { "data-magnetic": magnetic ? "" : undefined, "data-track": track };
  if (href) {
    if (external || /^(https?:|mailto:)/.test(href)) return <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" {...data}>{body}</a>;
    return <Link href={href} className={cls} {...data}>{body}</Link>;
  }
  return <button type={type} className={cls} {...data}>{body}</button>;
}

export function IconLink({ href, icon, brand, label, track }: { href: string; icon?: string; brand?: string; label: string; track?: string }) {
  return <a href={href} className="xk-iconbtn" aria-label={label} title={label} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener me" data-track={track}><Icon name={icon} brand={brand} /></a>;
}

export function SocialLinks({ links, variant = "icons", medium = "site" }: { links: Social[]; variant?: "icons" | "list"; medium?: string }) {
  const utm = (h: string) => (h.startsWith("http") && !h.includes("dub.sh") ? h + (h.includes("?") ? "&" : "?") + `utm_source=xerk.io&utm_medium=${medium}` : h);
  if (variant === "list")
    return (
      <ul className="xk-social-list">
        {links.map((l) => (
          <li key={l.brand}><a href={utm(l.href)} target="_blank" rel="noopener me" data-track={`${l.brand}_click`}><Icon brand={l.brand} /><span>{l.label}</span>{l.handle && <span className="xk-muted">{l.handle}</span>}<Icon name="arrow-up-right" className="xk-trail" /></a></li>
        ))}
      </ul>
    );
  return <div className="xk-social">{links.map((l) => <IconLink key={l.brand} href={utm(l.href)} brand={l.brand} label={l.label} track={`${l.brand}_click`} />)}</div>;
}

/* ---------- Small content ---------- */
export function Badge({ children, tone, icon }: { children: ReactNode; tone?: "neutral" | "accent" | "agent" | "danger"; icon?: string }) {
  return <span className={cx("xk-badge", tone && tone !== "neutral" && `xk-badge-${tone}`)}>{icon && <Icon name={icon} />}{children}</span>;
}

export function StatusPill({ children, busy, href }: { children?: ReactNode; busy?: boolean; href?: string }) {
  const body = <><span className="xk-dot" aria-hidden />{children || (busy ? "Limited availability" : "Available for work")}</>;
  return href ? <Link href={href} className={cx("xk-pill", busy && "xk-pill-busy")}>{body}</Link> : <span className={cx("xk-pill", busy && "xk-pill-busy")}>{body}</span>;
}

export function SectionHeader({ eyebrow, title, text, action, as: Tag = "h2", scramble }: { eyebrow?: string; title: string; text?: ReactNode; action?: ReactNode; as?: "h1" | "h2"; scramble?: boolean }) {
  return (
    <div className="xk-sh">
      <div>
        {eyebrow && <span className="xk-label">{eyebrow}</span>}
        <Tag data-scramble={scramble ? "" : undefined}>{title}</Tag>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({ value, suffix, label, hint, bare }: Stat & { bare?: boolean }) {
  return (
    <div className={cx("xk-stat", bare && "xk-stat-bare")}>
      <div className="xk-stat-value"><span data-count={typeof value === "number" ? value : undefined}>{value}</span>{suffix && <em>{suffix}</em>}</div>
      <span className="xk-label">{label}</span>
      {hint && <span className="xk-stat-hint">{hint}</span>}
    </div>
  );
}

export function MetricRow({ items }: { items: Stat[] }) {
  return <div className="xk-metrics">{items.map((m) => <StatTile key={m.label} bare {...m} />)}</div>;
}

export function XPBar({ value, label = "XP", text }: { value: number; label?: string; text?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="xk-xp">
      <div className="xk-xp-head"><span className="xk-label">{label}</span><span className="xk-xp-val">{text || `${pct}%`}</span></div>
      <div className="xk-xp-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="xk-xp-fill" style={{ ["--xp" as string]: `${pct}%` }} />
        <div className="xk-xp-ticks" />
      </div>
    </div>
  );
}

/* ---------- Navigation ---------- */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="xk-crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={it.label}>{i === items.length - 1 ? <span aria-current="page">{it.label}</span> : <><Link href={it.href || "/"}>{it.label}</Link><Icon name="caret-right" /></>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function TableOfContents({ items, title = "On this page" }: { items: { id: string; label: string }[]; title?: string }) {
  return (
    <nav className="xk-toc" aria-label={title} data-toc="">
      <span className="xk-label">{title}</span>
      <ol>{items.map((it, i) => <li key={it.id}><a href={`#${it.id}`} data-toc-link={it.id}><span className="xk-toc-n">{pad2(i + 1)}</span>{it.label}</a></li>)}</ol>
    </nav>
  );
}

export function DockNav({ items }: { items: ({ label: string; href: string; icon?: string; brand?: string; active?: boolean } | { divider: true })[] }) {
  return (
    <nav className="xk-dock" aria-label="Quick navigation">
      {items.map((it, i) => ("divider" in it ? <hr key={`d${i}`} /> : <Link key={it.label} href={it.href} aria-label={it.label} data-tip={it.label} aria-current={it.active ? "page" : undefined}><Icon name={it.icon} brand={it.brand} /></Link>))}
    </nav>
  );
}

/* ---------- Cards ---------- */
export function ProjectCard(p: { slug: string; title: string; eyebrow?: string; summary: string; image?: string; video?: string; big?: string; bigLabel?: string; stack?: string[]; ai?: boolean; interactive?: boolean; hasVideo?: boolean; featured?: boolean; wide?: boolean }) {
  return (
    <Link href={`/work/${p.slug}`} className={cx("xk-card", "xk-project", p.wide && "xk-project-wide", p.featured && "xk-card-featured")} data-reveal="">
      <div className="xk-media">
        {p.video ? <video src={p.video} poster={p.image} autoPlay muted loop playsInline /> : p.image ? <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" /> : <div className="xk-level-poster"><span>{p.big}</span><em>{p.bigLabel}</em></div>}
        {(p.interactive || p.hasVideo) && <div className="xk-media-flags">{p.interactive && <Badge tone="accent" icon="cursor-click">Interactive demo</Badge>}{p.hasVideo && <Badge icon="play">Video</Badge>}</div>}
      </div>
      <div className="xk-card-body">
        <div className="xk-project-meta"><span className="xk-label">{p.eyebrow}</span>{p.ai && <Badge tone="agent">AI</Badge>}</div>
        <h3 className="xk-card-title">{p.title}</h3>
        <p className="xk-card-text">{p.summary}</p>
        {p.stack && <div className="xk-tags">{p.stack.slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}</div>}
        <span className="xk-readmore">Read case study<Icon name="arrow-right" /></span>
      </div>
    </Link>
  );
}

export function PostCard({ href, date, readingTime, title, excerpt }: { href: string; date: string; readingTime?: string; title: string; excerpt?: string }) {
  return (
    <Link href={href} className="xk-post">
      <span className="xk-label">{date}</span>
      <div><h3>{title}</h3>{excerpt && <p>{excerpt}</p>}</div>
      <span className="xk-post-meta">{readingTime}<Icon name="arrow-up-right" /></span>
    </Link>
  );
}

export function SpotlightCard({ children, className, href }: { children: ReactNode; className?: string; href?: string }) {
  return href ? <Link href={href} className={cx("xk-spot", className)}>{children}</Link> : <div className={cx("xk-spot", className)}>{children}</div>;
}

export function BentoGrid({ children }: { children: ReactNode }) {
  return <div className="xk-bento">{children}</div>;
}
export function BentoTile({ span, tall, tone, icon, brand, eyebrow, value, title, text, children }: { span?: 2 | 3 | 4; tall?: boolean; tone?: "accent" | "agent"; icon?: string; brand?: string; eyebrow?: string; value?: string; title?: string; text?: string; children?: ReactNode }) {
  return (
    <SpotlightCard className={cx("xk-bento-tile", span && `span-${span}`, tall && "is-tall", tone && `tone-${tone}`)}>
      {(icon || brand || eyebrow) && <div className="xk-bento-top">{(icon || brand) && <span className="xk-bento-icon"><Icon name={icon} brand={brand} /></span>}{eyebrow && <span className="xk-label">{eyebrow}</span>}</div>}
      {value && <div className="xk-bento-value">{value}</div>}
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {children}
    </SpotlightCard>
  );
}

export function Marquee({ items, reverse, speed = 40 }: { items: { label: string; value?: string; icon?: string; brand?: string }[]; reverse?: boolean; speed?: number }) {
  const row = items.map((it, i) => <span key={i} className="xk-mq-item">{(it.icon || it.brand) && <Icon name={it.icon} brand={it.brand} />}<span>{it.label}</span>{it.value && <b>{it.value}</b>}</span>);
  return (
    <div className={cx("xk-mq", reverse && "is-reverse")} style={{ ["--mq-speed" as string]: `${speed}s` }} role="marquee" aria-label={items.map((i) => `${i.label}${i.value ? " " + i.value : ""}`).join(", ")}>
      <div className="xk-mq-track" aria-hidden>{row}{row}</div>
    </div>
  );
}

/* ---------- Game layer (static) ---------- */
export function PlayerCard({ name, level, className, avatar, status, xp, stats, loadout }: { name: string; level: number; className: string; avatar?: string; status?: string; xp?: { value: number; label?: string; text?: string }; stats: Stat[]; loadout?: { brand?: string; icon?: string; label: string }[] }) {
  return (
    <div className="xk-player">
      <div className="xk-player-top">
        <div className="xk-player-avatar">{avatar && <img src={avatar} alt={name} width={72} height={72} />}<span className="xk-player-lvl">LV {level}</span></div>
        <div><span className="xk-label">Player 1</span><strong>{name}</strong><span className="xk-player-class">{className}</span></div>
      </div>
      <div className="xk-player-status"><span className="xk-dot" />{status}</div>
      {xp && <XPBar {...xp} />}
      <dl className="xk-player-stats">{stats.map((s) => <div key={s.label}><dt><Icon name={s.icon || "lightning"} />{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
      {loadout && <div className="xk-player-loadout"><span className="xk-label">Loadout</span><div className="xk-player-gear">{loadout.map((g) => <span key={g.label} title={g.label}><Icon brand={g.brand} name={g.icon} /></span>)}</div></div>}
    </div>
  );
}

const RARITY = { legendary: "Legendary", epic: "Epic", rare: "Rare" } as const;
export function AchievementGrid({ items }: { items: AchievementT[] }) {
  return (
    <div className="xk-achs">
      {items.map((a, i) => (
        <div key={i} className={cx("xk-ach", `is-${a.rarity || "rare"}`, a.locked && "is-locked")} tabIndex={0}>
          <div className="xk-ach-icon"><Icon name={a.locked ? "lock-simple" : a.icon || "trophy"} /></div>
          <div className="xk-ach-body">
            <span className="xk-ach-rarity">{a.locked ? "Locked" : RARITY[a.rarity || "rare"]}</span>
            <strong>{a.value && <b>{a.value}</b>} {a.title}</strong>
            <p>{a.text}</p>
          </div>
          {a.source && <span className="xk-ach-src">{a.source}</span>}
        </div>
      ))}
    </div>
  );
}

export function SkillTree({ root, rootNote, branches }: { root: string; rootNote?: string; branches: { name: string; icon: string; ai?: boolean; nodes: { name: string; brand?: string; icon?: string; proof: string }[] }[] }) {
  return (
    <div className="xk-tree">
      <div className="xk-tree-root"><Icon name="cube-duo" /><strong>{root}</strong><span>{rootNote}</span></div>
      <div className="xk-tree-branches">
        {branches.map((b) => (
          <section key={b.name} className={cx("xk-tree-branch", b.ai && "is-ai")} aria-label={`${b.name} skills`}>
            <header className="xk-tree-head"><span className="xk-tree-hicon"><Icon name={b.icon} /></span><div><strong>{b.name}</strong><span>{b.nodes.length}/{b.nodes.length} unlocked</span></div></header>
            <ol className="xk-tree-nodes">{b.nodes.map((n) => <li key={n.name} tabIndex={0}><span className="xk-tree-node"><Icon brand={n.brand} name={n.brand ? undefined : n.icon} /></span><div><strong>{n.name}</strong><span>{n.proof}</span></div></li>)}</ol>
          </section>
        ))}
      </div>
    </div>
  );
}

export function QuestLog({ quests }: { quests: Quest[] }) {
  return (
    <div className="xk-quests">
      {quests.map((q) => {
        const active = q.status === "active";
        return (
          <article key={q.company} className={cx("xk-quest", active && "is-active")}>
            <div className="xk-quest-rail"><span className="xk-quest-dot"><Icon name={active ? "sword" : "check"} /></span></div>
            <div className="xk-quest-main">
              <div className="xk-quest-head"><span className={cx("xk-quest-status", active && "is-active")}>{active ? "Active quest" : "Completed"}</span><span className="xk-label">{q.period}</span></div>
              <h3>{q.company}<span> · {q.role}</span></h3>
              <span className="xk-quest-where"><Icon name="map-pin" />{q.where}</span>
              <ul>{q.objectives.map((o) => <li key={o}><Icon name="check-square" /><span>{o}</span></li>)}</ul>
              <div className="xk-quest-loot"><span className="xk-label">Loot</span>{q.loot.map((l) => <span key={l} className="xk-loot">{l}</span>)}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function AIStack({ items }: { items: { brand?: string; icon?: string; label: string; note?: string; ai?: boolean }[] }) {
  return <div className="xk-aistack">{items.map((it) => <div key={it.label} className={cx("xk-aistack-item", it.ai && "is-ai")}><span className="xk-aistack-icon"><Icon brand={it.brand} name={it.icon} /></span><div><strong>{it.label}</strong>{it.note && <span>{it.note}</span>}</div></div>)}</div>;
}

export function GitHubHeatmap({ weeks, user, total, stats }: { weeks: number[][]; user: string; total: number; stats: { value: string; label: string }[] }) {
  const max = Math.max(1, ...weeks.flat());
  const lvl = (c: number) => (!c ? 0 : c / max > 0.45 ? 4 : c / max > 0.2 ? 3 : c / max > 0.06 ? 2 : 1);
  return (
    <div className="xk-heat">
      <div className="xk-heat-head"><Icon brand="github" /><strong>{user}</strong><span className="xk-heat-total"><b>{total.toLocaleString("en-US")}</b> contributions in the last year</span></div>
      <div className="xk-heat-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} role="img" aria-label={`${total} GitHub contributions in the last year`}>
        {weeks.map((w, wi) => <div key={wi} className="xk-heat-col">{w.map((c, di) => <i key={di} className={`l${lvl(c)}`} title={`${c} contributions`} style={{ animationDelay: `${wi * 12}ms` }} />)}</div>)}
      </div>
      <div className="xk-heat-foot"><span>{stats.map((s) => <span key={s.label}><b>{s.value}</b> {s.label}</span>)}</span><span className="xk-heat-legend">Less{[0, 1, 2, 3, 4].map((l) => <i key={l} className={`l${l}`} />)}More</span></div>
    </div>
  );
}

/* ---------- Article ---------- */
export function CaseStudyHeader({ crumbs, eyebrow, title, summary, meta, actions, ai }: { crumbs: { label: string; href?: string }[]; eyebrow: string; title: string; summary: string; meta: { label: string; value: ReactNode }[]; actions?: ReactNode; ai?: boolean }) {
  return (
    <header className="xk-csh">
      <Breadcrumbs items={crumbs} />
      <div className="xk-csh-eyebrow">{ai && <Badge tone="agent">AI</Badge>}<span className="xk-label">{eyebrow}</span></div>
      <h1 data-split="">{title}</h1>
      <p className="xk-csh-lead">{summary}</p>
      {meta.length > 0 && <dl className="xk-csh-meta">{meta.map((m) => <div key={m.label}><dt className="xk-label">{m.label}</dt><dd>{m.value}</dd></div>)}</dl>}
      {actions && <div className="xk-csh-actions">{actions}</div>}
    </header>
  );
}

export function KeyTakeaways({ answer, items, updated, title = "TL;DR" }: { answer: string; items?: string[]; updated?: string; title?: string }) {
  return (
    <aside className="xk-tldr" aria-label="Key takeaways">
      <div className="xk-tldr-head"><Icon name="lightning-duo" /><span className="xk-label">{title}</span>{updated && <span className="xk-tldr-date">Updated {updated}</span>}</div>
      <p className="xk-tldr-answer">{answer}</p>
      {items && <ul>{items.map((t) => <li key={t}><Icon name="check" /><span>{t}</span></li>)}</ul>}
    </aside>
  );
}

export function Callout({ title, tone = "note", children }: { title?: string; tone?: "note" | "ai" | "tip" | "warning"; children: ReactNode }) {
  const icon = { note: "info", ai: "sparkle", warning: "warning-circle", tip: "lightning" }[tone];
  return <div className={`xk-callout xk-callout-${tone}`} role="note"><Icon name={icon} /><div>{title && <strong>{title}</strong>}<div>{children}</div></div></div>;
}

/** Native <details> keeps every answer in the HTML for search engines and AI crawlers. */
export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="xk-faq">
      {items.map((it, i) => (
        <details key={it.q} className="xk-faq-item" open={i === 0}>
          <summary><h3>{it.q}</h3><Icon name="plus" /></summary>
          <div className="xk-faq-a">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function RelatedProjects({ items, title = "Next stage" }: { items: { slug: string; title: string; summary: string; image?: string; code?: string }[]; title?: string }) {
  return (
    <div className="xk-related">
      <span className="xk-label">{title}</span>
      <div className="xk-related-list">
        {items.map((it) => (
          <Link key={it.slug} href={`/work/${it.slug}`} className="xk-related-item">
            {it.image ? <img src={it.image} alt="" /> : <span className="xk-related-code">{it.code}</span>}
            <div><strong>{it.title}</strong><span>{it.summary}</span></div>
            <Icon name="arrow-right" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- Hire ---------- */
export function ServiceCard(p: { icon: string; title: string; text: string; price: string; unit?: string; timeline?: string; features: string[]; featured?: boolean; ai?: boolean; href: string }) {
  return (
    <div className={cx("xk-card", "xk-service", p.featured && "is-featured")}>
      {p.featured && <span className="xk-service-flag">Most booked</span>}
      <span className={cx("xk-service-icon", p.ai && "is-ai")}><Icon name={p.icon} /></span>
      <h3>{p.title}</h3>
      <p className="xk-card-text">{p.text}</p>
      <div className="xk-service-price"><strong>{p.price}</strong>{p.unit && <span>{p.unit}</span>}</div>
      {p.timeline && <span className="xk-label"><Icon name="timer" /> {p.timeline}</span>}
      <ul>{p.features.map((f) => <li key={f}><Icon name="check-circle" />{f}</li>)}</ul>
      <Button variant={p.featured ? "primary" : "secondary"} block href={p.href} iconRight="arrow-right" track="hire_click">Start a project</Button>
    </div>
  );
}

export function ProcessSteps({ steps }: { steps: { title: string; text: string; time?: string }[] }) {
  return <ol className="xk-steps">{steps.map((s, i) => <li key={s.title}><span className="xk-steps-n">{pad2(i + 1)}</span><div><h3>{s.title}</h3><p>{s.text}</p></div>{s.time && <span className="xk-label">{s.time}</span>}</li>)}</ol>;
}

export function PlatformProof({ items }: { items: { brand: string; value: string; label: string; href: string }[] }) {
  return <div className="xk-proof">{items.map((it) => <a key={it.brand} href={it.href} target="_blank" rel="noopener me" className="xk-proof-item" data-track={`${it.brand}_click`}><span className="xk-proof-logo"><Icon brand={it.brand} /></span><div><strong>{it.value}</strong><span>{it.label}</span></div><Icon name="arrow-up-right" className="xk-trail" /></a>)}</div>;
}

export function CTABar({ eyebrow, title, text, tone, children }: { eyebrow?: string; title: string; text?: string; tone?: "accent"; children: ReactNode }) {
  return (
    <section className={cx("xk-cta", tone === "accent" && "xk-cta-accent")} data-reveal="">
      <div>{eyebrow && <span className="xk-label">{eyebrow}</span>}<h2>{title}</h2>{text && <p>{text}</p>}</div>
      <div className="xk-cta-actions">{children}</div>
    </section>
  );
}

export function Section({ id, eyebrow, title, text, action, children, scramble = true }: { id?: string; eyebrow: string; title: string; text?: ReactNode; action?: ReactNode; children: ReactNode; scramble?: boolean }) {
  return (
    <section className="xk-section" id={id} data-hud={eyebrow}>
      <SectionHeader eyebrow={eyebrow} title={title} text={text} action={action} scramble={scramble} />
      <div data-reveal="">{children}</div>
    </section>
  );
}
