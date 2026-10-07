"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/xerk/icon";
import { createClient } from "@/lib/supabase/client";
import { createUploadUrl, type ActionResult } from "@/app/admin/actions";
import { cx } from "@/lib/utils";

/** Marks <html data-admin> so the public HUD, footer, dock and achievement toasts hide inside /admin. */
export function AdminFlag() {
  useEffect(() => {
    document.documentElement.dataset.admin = "";
    return () => { delete document.documentElement.dataset.admin; };
  }, []);
  return null;
}

const NAV = [
  { href: "/admin", label: "Overview", icon: "chart-line-up" },
  { href: "/admin/posts", label: "Posts", icon: "pen-nib" },
  { href: "/admin/projects", label: "Projects", icon: "game-controller" },
  { href: "/admin/media", label: "Media", icon: "images" },
  { href: "/admin/leads", label: "Leads", icon: "envelope-simple" },
];

export function AdminNav({ email }: { email: string }) {
  const path = usePathname();
  return (
    <nav className="xk-admin-nav" aria-label="Admin">
      {NAV.map((n) => {
        const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}><Icon name={n.icon} />{n.label}</Link>;
      })}
      <div className="xk-admin-who">
        <span title={email}>{email}</span>
        <form action="/auth/signout" method="post"><button type="submit" className="xk-btn xk-btn-ghost xk-btn-sm">Log out</button></form>
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
    <span className={cx("xk-admin-msg", status.kind === "error" && "is-error", status.kind === "ok" && "is-ok")} role={status.kind === "error" ? "alert" : "status"}>
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
  const r = await createUploadUrl(folder, file.name, fixedName);
  if (!r.ok || !r.data) throw new Error(r.ok ? "No upload URL" : r.error);
  const { error } = await createClient().storage.from("media").uploadToSignedUrl(r.data.path, r.data.token, file, { contentType: file.type || undefined, upsert: true });
  if (error) throw new Error(error.message);
  return { path: r.data.path, publicUrl: r.data.publicUrl };
}

/** URL input + upload button + preview. Used for covers, videos and screens. */
export function MediaField({ label, value, onChange, folder, fixedName, accept = "image/*", kind = "image", hint, disabledReason }: { label: string; value: string; onChange: (url: string) => void; folder: string; fixedName?: string; accept?: string; kind?: "image" | "video"; hint?: string; disabledReason?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<Status>({ kind: "idle" });
  const pick = async (file?: File) => {
    if (!file) return;
    setState({ kind: "busy", text: `Uploading ${file.name}…` });
    try {
      const { publicUrl } = await uploadFile(folder, file, fixedName);
      onChange(publicUrl);
      setState({ kind: "ok", text: "Uploaded" });
    } catch (e) {
      setState({ kind: "error", text: e instanceof Error ? e.message : "Upload failed" });
    }
    if (input.current) input.current.value = "";
  };
  const isVideoFile = /\.(mp4|webm|mov)(\?|$)/i.test(value);
  return (
    <div className="xk-field xk-admin-upload">
      <span>{label}</span>
      <div className="xk-admin-upload-row">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={kind === "video" ? "https://… (YouTube, Vimeo, .mp4) or upload" : "https://… or /path, or upload"} />
        <input ref={input} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" disabled={!!disabledReason || state.kind === "busy"} title={disabledReason} onClick={() => input.current?.click()}>{state.kind === "busy" ? "Uploading…" : "Upload"}</button>
        {value && <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => onChange("")}>Clear</button>}
      </div>
      {(hint || disabledReason) && <span className="xk-field-hint">{disabledReason || hint}</span>}
      <StatusText status={state} />
      {value && kind === "image" && <img src={value} alt="" className="xk-admin-thumb" />}
      {value && kind === "video" && isVideoFile && <video src={value} className="xk-admin-thumb" muted controls playsInline preload="metadata" />}
    </div>
  );
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
