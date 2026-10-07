"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/xerk/icon";
import { LogoMark } from "@/components/xerk/ui";
import { ThemeToggle } from "@/components/xerk/client";
import type { ActionResult } from "@/app/[console]/actions";
import { Uploader, uploadWithProgress, type UploadKind } from "./uploader";
import { cx } from "@/lib/utils";
import { useAdminHref } from "./base";

/** Marks <html data-admin> so the public HUD, footer, dock and achievement toasts hide inside /admin. */
export function AdminFlag() {
  useEffect(() => {
    document.documentElement.dataset.admin = "";
    return () => { delete document.documentElement.dataset.admin; };
  }, []);
  return null;
}

const NAV = [
  { href: "", label: "Overview", icon: "chart-line-up" },
  { href: "/posts", label: "Posts", icon: "pen-nib" },
  { href: "/projects", label: "Projects", icon: "game-controller" },
  { href: "/media", label: "Media", icon: "images" },
  { href: "/profile", label: "Profile", icon: "user-circle" },
  { href: "/experience", label: "Experience", icon: "briefcase" },
  { href: "/site", label: "Site data", icon: "sliders" },
  { href: "/seo", label: "SEO", icon: "magnifying-glass" },
  { href: "/leads", label: "Leads", icon: "envelope-simple" },
  { href: "/studio", label: "Studio", icon: "film-strip" },
];

/** Sidebar grouping is presentational only: anything not listed lands in "Content". */
const GROUP_OF: Record<string, string> = { Overview: "", Posts: "Content", Projects: "Content", Media: "Content", Profile: "Content", Experience: "Content", Leads: "Inbox", "Site data": "System", SEO: "Growth", Studio: "System" };
const GROUP_ORDER = ["", "Content", "Inbox", "Growth", "System"];

export function AdminNav({ email }: { email: string }) {
  const path = usePathname();
  const ah = useAdminHref();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const groups = new Map<string, typeof NAV>(GROUP_ORDER.map((g) => [g, []]));
  for (const n of NAV) {
    const g = GROUP_OF[n.label] ?? "Content";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(n);
  }
  return (
    <nav className={cx("xk-admin-nav", open && "is-open")} aria-label="Admin">
      <div className="xk-admin-topbar">
        <Link href={ah("")} className="xk-admin-brand" aria-label="Dashboard home"><LogoMark size={26} /><span className="xk-wordmark">xerk</span><span className="xk-admin-brand-tag">console</span></Link>
        <span className="xk-admin-topbar-end"><ThemeToggle /></span>
        <button type="button" className="xk-iconbtn-sm xk-admin-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="xk-admin-navbody" onClick={() => setOpen((o) => !o)}><Icon name={open ? "x" : "list"} /></button>
      </div>
      <button type="button" className="xk-admin-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />
      <div className="xk-admin-navbody" id="xk-admin-navbody" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
        {[...groups].filter(([, items]) => items.length).map(([group, items]) => (
          <div key={group || "main"} className="xk-admin-navgroup">
            {group && <span className="xk-label">{group}</span>}
            {items.map((n) => {
              const href = ah(n.href);
              const active = n.href === "" ? path === href : path.startsWith(href);
              return <Link key={n.href} href={href} className="xk-admin-navlink" aria-current={active ? "page" : undefined}><Icon name={n.icon} />{n.label}</Link>;
            })}
          </div>
        ))}
        <div className="xk-admin-who">
          <span className="xk-admin-avatar" aria-hidden>{email.slice(0, 1)}</span>
          <div className="xk-admin-who-text"><strong title={email}>{email}</strong><span>Signed in</span></div>
          <Link href={ah("/ui")} className="xk-iconbtn-sm" aria-label="UI kit" title="UI kit"><Icon name="palette" /></Link>
          <form action="/auth/signout" method="post"><button type="submit" className="xk-iconbtn-sm" aria-label="Log out" title="Log out"><Icon name="sign-out" /></button></form>
        </div>
      </div>
    </nav>
  );
}

export type Status = { kind: "idle" | "busy" | "ok" | "error"; text?: string };

/** Run a server action with a status line. */
export function useAction() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, start] = useTransition();
  const exec = <T,>(fn: () => Promise<ActionResult<T>>, busyText = "Saving…") =>
    new Promise<ActionResult<T>>((resolve) => {
      setStatus({ kind: "busy", text: busyText });
      start(async () => {
        try {
          const r = await fn();
          setStatus(r.ok ? { kind: "ok", text: r.message || "Done" } : { kind: "error", text: r.error });
          resolve(r);
        } catch (e) {
          const error = e instanceof Error ? e.message : "Something went wrong";
          setStatus({ kind: "error", text: error });
          resolve({ ok: false, error });
        }
      });
    });
  return { status, setStatus, pending: pending || status.kind === "busy", exec };
}

export function StatusText({ status }: { status: Status }) {
  if (status.kind === "idle" || !status.text) return null;
  return (
    <span className={cx("xk-admin-msg", status.kind === "error" && "is-error", status.kind === "ok" && "is-ok", status.kind === "busy" && "is-busy")} role={status.kind === "error" ? "alert" : "status"}>
      {status.kind === "ok" && <Icon name="check" />}{status.kind === "error" && <Icon name="warning-circle" />}{status.text}
    </span>
  );
}

/** Two-step destructive button: first click asks, second confirms. No window.confirm. */
export function ConfirmButton({ label, confirmLabel = "Yes, delete", question = "Are you sure?", onConfirm, disabled, small = true }: { label: ReactNode; confirmLabel?: string; question?: string; onConfirm: () => void; disabled?: boolean; small?: boolean }) {
  const [asking, setAsking] = useState(false);
  if (asking) {
    return (
      <span className="xk-confirm" role="group" aria-label={question}>
        {question}
        <button type="button" className="xk-btn xk-btn-danger xk-btn-sm" onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => setAsking(false)}>Cancel</button>
      </span>
    );
  }
  return <button type="button" className={cx("xk-btn xk-btn-danger", small && "xk-btn-sm")} disabled={disabled} onClick={() => setAsking(true)}>{label}</button>;
}

/** Upload a file straight from the browser to the `media` bucket via a signed URL from a server action. */
export async function uploadFile(folder: string, file: File, fixedName?: string): Promise<{ path: string; publicUrl: string }> {
  return uploadWithProgress(folder, file, { fixedName });
}

/** Back-compat wrapper: prefer <Uploader> from ./uploader. */
export function MediaField({ label, value, onChange, folder, fixedName, accept, kind = "image", hint, disabledReason }: { label: string; value: string; onChange: (url: string) => void; folder: string; fixedName?: string; accept?: string; kind?: "image" | "video"; hint?: string; disabledReason?: string }) {
  const k: UploadKind = accept?.includes("pdf") ? "pdf" : kind;
  return <Uploader label={label} value={value} onChange={onChange} folder={folder} fixedName={fixedName} kind={k} hint={hint} disabledReason={disabledReason} />;
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
