"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";

/* Form primitives shared by the editors. Styles: admin.css ("Form kit"). */

type Base = { label: ReactNode; hint?: ReactNode; placeholder?: string; mono?: boolean; required?: boolean; error?: string; className?: string };

export function TextField({ label, value, onChange, hint, placeholder, mono, type = "text", required, error, className, autoFocus, maxLength }: Base & { value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean; maxLength?: number }) {
  return (
    <label className={cx("xk-field", error && "has-error", className)}>
      <span>{label}{required && <i className="xk-req" aria-hidden>*</i>}</span>
      <input type={type} className={cx(mono && "is-mono")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required} autoFocus={autoFocus} data-autofocus={autoFocus ? "" : undefined} maxLength={maxLength} />
      {error ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{error}</span> : hint && <span className="xk-field-hint">{hint}</span>}
    </label>
  );
}

export function AreaField({ label, value, onChange, hint, placeholder, mono, rows = 3, count, required, error, className }: Base & { value: string; onChange: (v: string) => void; rows?: number; /** Show a counter with this soft limit. */ count?: number }) {
  return (
    <label className={cx("xk-field", error && "has-error", className)}>
      <span>{label}{required && <i className="xk-req" aria-hidden>*</i>}</span>
      <textarea className={cx(mono && "is-mono")} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {error ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{error}</span>
        : (hint || !!count) && <span className={cx("xk-field-hint", !!count && value.length > count && "is-over")}><span>{hint}</span>{!!count && <span className="is-count">{value.length}/{count}</span>}</span>}
    </label>
  );
}

const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

/** Text area bound to string[] (one per line). Keeps raw text while typing so blank lines don't vanish. */
export function LinesField({ value, onChange, ...rest }: Omit<Base, "error"> & { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [raw, setRaw] = useState(value.join("\n"));
  useEffect(() => { if (lines(raw).join("\n") !== value.join("\n")) setRaw(value.join("\n")); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <AreaField {...rest} value={raw} onChange={(v) => { setRaw(v); onChange(lines(v)); }} />;
}

/** Tokens as chips. Enter / comma / Tab adds, Backspace removes the last, arrow keys pick a suggestion. */
export function ChipInput({ label, value, onChange, suggestions = [], placeholder = "Add…", hint, prefix = "", max }: { label: ReactNode; value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string; hint?: ReactNode; prefix?: string; max?: number }) {
  const [draft, setDraft] = useState("");
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const needle = draft.trim().toLowerCase();
  const options = suggestions.filter((s) => !has(s) && (!needle || s.toLowerCase().includes(needle))).slice(0, 8);
  const add = (raw: string) => {
    const parts = raw.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).filter((t, i, a) => !has(t) && a.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i);
    if (parts.length) onChange([...value, ...parts].slice(0, max));
    setDraft("");
    setActive(0);
  };
  const open = focus && options.length > 0;
  return (
    <div className="xk-field xk-chips-field">
      <span>{label}</span>
      <div className={cx("xk-chips", focus && "is-focus")} onClick={() => input.current?.focus()}>
        {value.map((t, i) => (
          <span key={`${t}-${i}`} className="xk-chip-token">{prefix}{t}<button type="button" aria-label={`Remove ${t}`} onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, k) => k !== i)); }}><Icon name="x" /></button></span>
        ))}
        <input
          ref={input}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onFocus={() => setFocus(true)}
          onBlur={() => { setTimeout(() => setFocus(false), 120); if (draft.trim()) add(draft); }}
          onChange={(e) => { const v = e.target.value; if (v.includes(",")) add(v); else { setDraft(v); setActive(0); } }}
          onPaste={(e) => { const t = e.clipboardData.getData("text"); if (t.includes(",")) { e.preventDefault(); add(t); } }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && open) { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
            else if (e.key === "ArrowUp" && open) { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
            else if (e.key === "Enter" || (e.key === "Tab" && draft.trim())) {
              if (open && (needle ? options[active] : e.key === "Enter" && options[active])) { e.preventDefault(); add(options[active]); }
              else if (draft.trim()) { e.preventDefault(); add(draft); }
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
            else if (e.key === "Escape" && open) { e.stopPropagation(); setFocus(false); }
          }}
        />
      </div>
      {open && (
        <ul className="xk-chips-menu" id={listId} role="listbox">
          {options.map((o, i) => <li key={o} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); add(o); }} onMouseEnter={() => setActive(i)}>{prefix}{o}</li>)}
        </ul>
      )}
      {hint && <span className="xk-field-hint">{hint}</span>}
    </div>
  );
}

/** Slug shown as text; "Edit" reveals the input. Auto-follows the title until edited. */
export function SlugField({ prefix, value, onEdit, auto }: { prefix: string; value: string; onEdit: (v: string) => void; auto: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="xk-field">
      <span>URL</span>
      {editing ? (
        <span className="xk-admin-affix"><span>{prefix}</span><input className="is-mono" autoFocus value={value} onChange={(e) => onEdit(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEditing(false); } }} placeholder="my-slug" /></span>
      ) : (
        <span className="xk-slug"><code>{prefix}{value || "…"}</code><button type="button" className="xk-linkbtn" onClick={() => setEditing(true)}>Edit</button></span>
      )}
      <span className="xk-field-hint">{auto ? "Generated from the title" : "Changing it on a published page breaks old links"}</span>
    </div>
  );
}

export function Switch({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean }) {
  return (
    <label className="xk-switch-row">
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
      <span className="xk-switch"><input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /></span>
    </label>
  );
}

/** Collapsible group for optional fields (progressive disclosure). */
export function Disclosure({ title, summary, children, defaultOpen }: { title: ReactNode; summary?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="xk-disclosure" open={defaultOpen}>
      <summary><Icon name="caret-right" /><strong>{title}</strong>{summary && <span>{summary}</span>}</summary>
      <div className="xk-disclosure-body">{children}</div>
    </details>
  );
}

/** Segmented tabs; returns the bar. */
export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode; badge?: ReactNode }[]; label: string }) {
  return (
    <div className="xk-admin-tabs xk-editor-tabs" role="tablist" aria-label={label}>
      {items.map((t) => <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>{t.label}{t.badge}</button>)}
    </div>
  );
}

/* ---------- hooks ---------- */

/** Native "leave site?" prompt while there are unsaved changes. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}

/** Ctrl/Cmd+S runs `fn` (ignored while a sheet or dialog is open, those own the keyboard). */
export function useSaveShortcut(fn: () => void, enabled = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (document.querySelector(".xk-sheet-root, .xk-dialog-root")) return;
        ref.current();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [enabled]);
}

export type SaveStatus = { state: "clean" | "dirty" | "saving" | "saved" | "error"; at?: number; error?: string };

/** "Unsaved changes" / "Saving…" / "Saved 2 min ago". */
export function SaveState({ status }: { status: SaveStatus }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30_000); return () => clearInterval(t); }, []);
  const ago = status.at ? Math.round((Date.now() - status.at) / 60000) : 0;
  const text = status.state === "dirty" ? "Unsaved changes" : status.state === "saving" ? "Saving…" : status.state === "error" ? "Not saved" : status.state === "saved" ? (ago < 1 ? "Saved just now" : `Saved ${ago} min ago`) : "All changes saved";
  return (
    <span className={cx("xk-savestate", `is-${status.state}`)} role="status" title={status.error}>
      {status.state === "saved" || status.state === "clean" ? <Icon name="check" /> : status.state === "error" ? <Icon name="warning-circle" /> : null}
      {text}
    </span>
  );
}

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export function Kbd({ k }: { k: string }) {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(isMac()), []);
  return <kbd className="xk-kbd">{mac ? "⌘" : "Ctrl+"}{k}</kbd>;
}
