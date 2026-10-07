"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";

/* Sheets and dialogs for the dashboard.
   - <Sheet>: right-side drawer on desktop, bottom sheet at ≤900px. Focus trap, Esc / overlay to close,
     unsaved-changes guard (`dirty`), sticky header + footer, reduced-motion aware.
   - <Dialog>: small centered confirm.
   - useConfirm(): promise-based confirm that renders a <Dialog>.
   Both portal into #xk-admin-layer (inside .xk-admin) so the scoped admin styles apply. */

const EXIT_MS = 220;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), video[controls]';

function layer() {
  return document.getElementById("xk-admin-layer") || document.querySelector(".xk-admin") || document.body;
}

/** Keeps an element mounted for the exit animation. */
function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  /** Element focused when `open` flipped on, captured before autoFocus inside the layer can steal it. */
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      if (!opener.current) opener.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setMounted(false), reduce ? 0 : EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);
  return { mounted, shown, opener };
}

let locks = 0;
function lockScroll() {
  locks++;
  if (locks === 1) {
    const sb = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--xk-sb", `${sb}px`);
    document.documentElement.classList.add("xk-scroll-locked");
  }
  return () => {
    locks = Math.max(0, locks - 1);
    if (!locks) document.documentElement.classList.remove("xk-scroll-locked");
  };
}

/** Focus trap + Esc + return focus. Only the top-most layer reacts. */
const stack: HTMLElement[] = [];
function useModal(ref: React.RefObject<HTMLElement | null>, active: boolean, onEscape: () => void, initialFocus?: string, openerRef?: React.RefObject<HTMLElement | null>) {
  const esc = useRef(onEscape);
  esc.current = onEscape;
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const captured = openerRef?.current;
    const opener = captured && !el.contains(captured) ? captured : (document.activeElement as HTMLElement | null);
    stack.push(el);
    const unlock = lockScroll();
    const first = (initialFocus && el.querySelector<HTMLElement>(initialFocus)) || el.querySelector<HTMLElement>("[data-autofocus]") || el.querySelector<HTMLElement>("[data-sheet-panel]") || el;
    requestAnimationFrame(() => first?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== el) return;
      if (e.key === "Escape") {
        // Let an open combobox/menu inside the layer close itself first.
        if ((e.target as HTMLElement | null)?.closest?.('[aria-expanded="true"]')) return;
        e.preventDefault(); e.stopPropagation(); esc.current(); return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0], z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      const i = stack.lastIndexOf(el);
      if (i >= 0) stack.splice(i, 1);
      unlock();
      if (openerRef) openerRef.current = null;
      if (opener && document.contains(opener) && !el.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Footer content, usually the primary action on the right. */
  footer?: ReactNode;
  /** Shows a "Discard changes?" prompt before closing. */
  dirty?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  /** Extra header controls (left of the close button). */
  headerActions?: ReactNode;
  /** CSS selector for the element to focus when it opens. */
  initialFocus?: string;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, description, footer, dirty, size = "md", headerActions, initialFocus, children, className }: SheetProps) {
  const { mounted, shown, opener } = usePresence(open);
  const ref = useRef<HTMLDivElement>(null);
  const [asking, setAsking] = useState(false);
  const titleId = useId();
  const descId = useId();
  const tryClose = useCallback(() => { if (dirty) setAsking(true); else onClose(); }, [dirty, onClose]);
  useEffect(() => { if (!open) setAsking(false); }, [open]);
  useModal(ref, mounted && open, () => (asking ? setAsking(false) : tryClose()), initialFocus, opener);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    <div ref={ref} className={cx("xk-sheet-root", shown && "is-open")} data-size={size}>
      <div className="xk-sheet-overlay" aria-hidden onClick={tryClose} />
      <div className={cx("xk-sheet", className)} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} tabIndex={-1} data-sheet-panel>
        <span className="xk-sheet-grabber" aria-hidden />
        <header className="xk-sheet-head">
          <div className="xk-sheet-titles">
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descId}>{description}</p>}
          </div>
          {headerActions}
          <button type="button" className="xk-iconbtn-sm xk-sheet-close" aria-label="Close" onClick={tryClose}><Icon name="x" /></button>
        </header>
        <div className="xk-sheet-body">{children}</div>
        {(footer || asking) && (
          <footer className={cx("xk-sheet-foot", asking && "is-asking")}>
            {asking ? (
              <>
                <span className="xk-sheet-ask"><Icon name="warning-circle" />Discard unsaved changes?</span>
                <div className="xk-admin-actions">
                  <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => setAsking(false)} data-autofocus>Keep editing</button>
                  <button type="button" className="xk-btn xk-btn-danger is-solid xk-btn-sm" onClick={() => { setAsking(false); onClose(); }}>Discard</button>
                </div>
              </>
            ) : footer}
          </footer>
        )}
      </div>
    </div>,
    layer(),
  );
}

/** Footer layout helper: secondary things on the left, primary on the right. */
export function SheetFooter({ start, children }: { start?: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="xk-admin-actions xk-sheet-foot-start">{start}</div>
      <div className="xk-admin-actions xk-sheet-foot-end">{children}</div>
    </>
  );
}

/* ---------- Dialog (small, centered) ---------- */

export function Dialog({ open, onClose, title, children, actions, tone }: { open: boolean; onClose: () => void; title: ReactNode; children?: ReactNode; actions: ReactNode; tone?: "danger" }) {
  const { mounted, shown, opener } = usePresence(open);
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModal(ref, mounted && open, onClose, undefined, opener);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    <div ref={ref} className={cx("xk-dialog-root", shown && "is-open")}>
      <div className="xk-sheet-overlay" aria-hidden onClick={onClose} />
      <div className={cx("xk-dialog", tone === "danger" && "is-danger")} role="alertdialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-sheet-panel>
        <h2 id={titleId}>{title}</h2>
        {children && <div className="xk-dialog-body">{children}</div>}
        <div className="xk-dialog-actions">{actions}</div>
      </div>
    </div>,
    layer(),
  );
}

type ConfirmOpts = { title: ReactNode; body?: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

/** `const [confirm, confirmNode] = useConfirm(); if (await confirm({ title: "Delete?" })) …` — render confirmNode once. */
export function useConfirm(): [(o: ConfirmOpts) => Promise<boolean>, ReactNode] {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [open, setOpen] = useState(false);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => { setState({ ...o, resolve }); setOpen(true); }), []);
  const done = (v: boolean) => { state?.resolve(v); setOpen(false); };
  const node = (
    <Dialog
      open={open}
      onClose={() => done(false)}
      title={state?.title}
      tone={state?.danger ? "danger" : undefined}
      actions={<>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => done(false)}>{state?.cancelLabel || "Cancel"}</button>
        <button type="button" className={cx("xk-btn xk-btn-sm", state?.danger ? "xk-btn-danger is-solid" : "xk-btn-primary")} onClick={() => done(true)} data-autofocus>{state?.confirmLabel || "Confirm"}</button>
      </>}
    >{state?.body}</Dialog>
  );
  return [confirm, node];
}

/* ---------- Toasts ---------- */

export type Toast = { id: number; tone?: "ok" | "error" | "info"; title: ReactNode; body?: ReactNode; action?: { label: string; run: () => void }; ms?: number };
type ToastApi = { push: (t: Omit<Toast, "id">) => number; dismiss: (id: number) => void };
const ToastCtx = createContext<ToastApi | null>(null);

export function Toaster({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setList((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++seq.current;
    setList((l) => [...l.slice(-3), { ...t, id }]);
    const ms = t.ms ?? (t.action ? 7000 : t.tone === "error" ? 6000 : 3200);
    setTimeout(() => dismiss(id), ms);
    return id;
  }, [dismiss]);
  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <div className="xk-admin-toasts" aria-live="polite" aria-atomic="false">
        {list.map((t) => (
          <div key={t.id} className={cx("xk-admin-toast", t.tone === "error" && "is-error", t.tone === "info" && "is-info")} role={t.tone === "error" ? "alert" : "status"}>
            <Icon name={t.tone === "error" ? "warning-circle" : t.tone === "info" ? "info" : "check-circle"} />
            <div><strong>{t.title}</strong>{t.body && <span>{t.body}</span>}</div>
            {t.action && <button type="button" className="xk-linkbtn" onClick={() => { t.action!.run(); dismiss(t.id); }}>{t.action.label}</button>}
            <button type="button" className="xk-admin-toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}><Icon name="x" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const noop: ToastApi = { push: () => 0, dismiss: () => {} };
export function useToast() {
  const api = useContext(ToastCtx) || noop;
  return {
    ...api,
    ok: (title: ReactNode, body?: ReactNode) => api.push({ tone: "ok", title, body }),
    error: (title: ReactNode, body?: ReactNode) => api.push({ tone: "error", title, body }),
    info: (title: ReactNode, body?: ReactNode) => api.push({ tone: "info", title, body }),
  };
}
