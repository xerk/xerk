"use client";

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { createUploadUrl, listMedia, type MediaItem, type MediaKind } from "@/app/[console]/actions";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import { Sheet } from "./sheet";

/* One upload control for every media field: drag & drop, click, paste, URL, or pick from the library.
   Uploads go browser → Supabase Storage through a signed URL, with real progress (XHR) and cancel. */

export type UploadKind = "image" | "video" | "pdf" | "html" | "any";

const RULES: Record<UploadKind, { accept: string; maxMB: number; test: (f: File) => boolean; noun: string; library?: MediaKind }> = {
  image: { accept: "image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml", maxMB: 10, test: (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name), noun: "an image (PNG, JPG, WebP, GIF, AVIF or SVG)", library: "image" },
  video: { accept: "video/mp4,video/webm,video/quicktime", maxMB: 100, test: (f) => f.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(f.name), noun: "a video (MP4, WebM or MOV)", library: "video" },
  pdf: { accept: "application/pdf,.pdf", maxMB: 20, test: (f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name), noun: "a PDF", library: "doc" },
  html: { accept: ".html,.htm,text/html", maxMB: 5, test: (f) => /\.html?$/i.test(f.name), noun: "an .html file" },
  any: { accept: "", maxMB: 100, test: () => true, noun: "a file" },
};

export const fmtBytes = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`);

/** Returns an error message, or "" when the file is fine. */
export function validateFile(file: File, kind: UploadKind, maxMB?: number) {
  const r = RULES[kind];
  if (!r.test(file)) return `“${file.name}” isn't ${r.noun}.`;
  const cap = maxMB ?? r.maxMB;
  if (file.size > cap * 1e6) return `“${file.name}” is ${fmtBytes(file.size)}. The limit here is ${cap} MB.`;
  if (file.size === 0) return `“${file.name}” is empty.`;
  return "";
}

export class UploadAborted extends Error { constructor() { super("Upload cancelled"); } }

/** Upload with progress. `signal` cancels the XHR. */
export async function uploadWithProgress(folder: string, file: File, opts: { fixedName?: string; onProgress?: (pct: number) => void; signal?: AbortSignal } = {}): Promise<{ path: string; publicUrl: string }> {
  const r = await createUploadUrl(folder, file.name, opts.fixedName);
  if (!r.ok || !r.data) throw new Error(r.ok ? "Could not get an upload URL." : r.error);
  const { signedUrl, path, publicUrl } = r.data;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Upload failed (${xhr.status})`;
      try { const j = JSON.parse(xhr.responseText); msg = j.message || j.error || msg; } catch { /* keep default */ }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.onabort = () => reject(new UploadAborted());
    opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
  opts.onProgress?.(100);
  return { path, publicUrl };
}

const isVideoUrl = (u: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(u);
const isImageUrl = (u: string) => /\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i.test(u) || /\/image\//.test(u);
const fileName = (u: string) => decodeURIComponent(u.split("?")[0].split("/").pop() || u);

function filesFrom(e: DragEvent | ClipboardEvent) {
  const list = "dataTransfer" in e ? e.dataTransfer?.files : e.clipboardData?.files;
  return list ? Array.from(list) : [];
}

type Progress = { name: string; pct: number; size: number };

/** Upload state machine shared by single and multi uploaders. */
export function useUploads(folder: string, kind: UploadKind, maxMB?: number, fixedName?: string) {
  const [items, setItems] = useState<(Progress & { id: number; ctrl: AbortController })[]>([]);
  const [error, setError] = useState("");
  const seq = useRef(0);
  const ctrls = useRef(new Set<AbortController>());
  useEffect(() => () => ctrls.current.forEach((c) => c.abort()), []);
  const run = async (files: File[], onDone: (url: string, file: File, path: string) => void) => {
    setError("");
    for (const file of files) {
      const bad = validateFile(file, kind, maxMB);
      if (bad) { setError(bad); continue; }
      const id = ++seq.current;
      const ctrl = new AbortController();
      ctrls.current.add(ctrl);
      setItems((l) => [...l, { id, name: file.name, size: file.size, pct: 0, ctrl }]);
      try {
        const { publicUrl, path } = await uploadWithProgress(folder, file, { fixedName, signal: ctrl.signal, onProgress: (pct) => setItems((l) => l.map((x) => (x.id === id ? { ...x, pct } : x))) });
        onDone(publicUrl, file, path);
      } catch (e) {
        if (!(e instanceof UploadAborted)) setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        ctrls.current.delete(ctrl);
        setItems((l) => l.filter((x) => x.id !== id));
      }
    }
  };
  return { items, error, setError, run, cancelAll: () => items.forEach((i) => i.ctrl.abort()) };
}

export function ProgressRow({ p, onCancel }: { p: Progress; onCancel?: () => void }) {
  return (
    <div className="xk-up-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.pct} aria-label={`Uploading ${p.name}`}>
      <div className="xk-up-progress-top">
        <span className="xk-up-progress-name" title={p.name}>{p.name}</span>
        <span className="xk-up-progress-pct">{p.pct}% · {fmtBytes(p.size)}</span>
        {onCancel && <button type="button" className="xk-linkbtn" onClick={onCancel}>Cancel</button>}
      </div>
      <div className="xk-up-bar"><i style={{ width: `${Math.max(3, p.pct)}%` }} /></div>
    </div>
  );
}

export type UploaderProps = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** Storage folder, e.g. "posts/my-slug". */
  folder: string;
  fixedName?: string;
  kind?: UploadKind;
  hint?: string;
  /** Disable uploads (e.g. no slug yet). URL entry and the library still work. */
  disabledReason?: string;
  maxMB?: number;
  /** Allow typing a URL (YouTube, Vimeo, external image…). */
  allowUrl?: boolean;
  /** Called with the storage path after an upload (e.g. to import a demo). Return an URL to store instead. */
  onUploaded?: (path: string, publicUrl: string) => Promise<string | void>;
  /** Visual shape of the preview. */
  aspect?: "wide" | "square" | "doc";
  compact?: boolean;
};

export function Uploader({ label, value, onChange, folder, fixedName, kind = "image", hint, disabledReason, maxMB, allowUrl = true, onUploaded, aspect = "wide", compact }: UploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [picker, setPicker] = useState(false);
  const up = useUploads(folder, kind, maxMB, fixedName);
  const busy = up.items[0];
  const rule = RULES[kind];

  const accept = async (files: File[]) => {
    if (disabledReason) { up.setError(disabledReason); return; }
    if (!files.length) return;
    await up.run(files.slice(0, 1), async (url, _f, path) => {
      if (onUploaded) {
        try { const next = await onUploaded(path, url); onChange(next || url); } catch (e) { up.setError(e instanceof Error ? e.message : "Upload failed"); }
      } else onChange(url);
    });
    if (input.current) input.current.value = "";
  };
  const onPaste = (e: ClipboardEvent) => {
    const files = filesFrom(e);
    if (files.length) { e.preventDefault(); accept(files); }
  };
  const drop = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => { e.preventDefault(); setOver(false); accept(filesFrom(e)); },
  };
  const pick = () => { if (disabledReason) up.setError(disabledReason); else input.current?.click(); };
  const showImage = value && (kind === "image" || (kind === "any" && isImageUrl(value)));
  const showVideo = value && kind === "video" && isVideoUrl(value);

  return (
    <div className={cx("xk-field xk-up", compact && "is-compact")} onPaste={onPaste}>
      {label && <span className="xk-up-label">{label}</span>}
      <input ref={input} type="file" accept={rule.accept || undefined} hidden onChange={(e) => accept(Array.from(e.target.files || []))} />
      {busy ? (
        <div className="xk-up-box is-busy"><ProgressRow p={busy} onCancel={up.cancelAll} /></div>
      ) : value ? (
        <div className={cx("xk-up-box is-filled", over && "is-over")} {...drop}>
          <div className={cx("xk-up-preview", `is-${aspect}`)}>
            {showImage ? <img src={value} alt="" /> : showVideo ? <video src={value} muted playsInline preload="metadata" controls /> : <span className="xk-up-file"><Icon name={kind === "video" ? "video-camera" : "file-text"} /></span>}
          </div>
          <div className="xk-up-meta">
            <a className="xk-up-name" href={value} target="_blank" rel="noopener" title={value}>{fileName(value)}<Icon name="arrow-square-out" /></a>
            <div className="xk-up-actions">
              <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={pick} disabled={!!disabledReason}><Icon name="arrows-clockwise" />Replace</button>
              {rule.library && <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => setPicker(true)}><Icon name="images" />Library</button>}
              <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm xk-up-remove" onClick={() => onChange("")}><Icon name="trash" />Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cx("xk-up-box is-empty", over && "is-over", disabledReason && "is-disabled")}
          role="button"
          tabIndex={0}
          aria-label={`${label || "File"}: drop, paste or click to upload ${rule.noun}`}
          onClick={pick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }}
          {...drop}
        >
          <span className="xk-up-icon"><Icon name="upload-simple" /></span>
          <span className="xk-up-cta"><strong>{disabledReason ? disabledReason : "Drop, paste or click to upload"}</strong><span>{rule.noun.replace(/^an? /, "").replace(/^\w/, (c) => c.toUpperCase())} · up to {maxMB ?? rule.maxMB} MB</span></span>
          <span className="xk-up-alt" onClick={(e) => e.stopPropagation()}>
            {rule.library && <button type="button" className="xk-linkbtn" onClick={() => setPicker(true)}>Choose from library</button>}
            {allowUrl && <button type="button" className="xk-linkbtn" onClick={() => setUrlMode((v) => !v)}>Use a URL</button>}
          </span>
        </div>
      )}
      {(urlMode || (value && allowUrl && !isImageUrl(value) && !isVideoUrl(value) && kind !== "pdf" && kind !== "html")) && !busy && (
        <input className="xk-admin-input is-mono xk-up-url" type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder={kind === "video" ? "https://youtube.com/… or https://…/clip.mp4" : "https://… or /path/in/public.webp"} aria-label={`${label || "File"} URL`} />
      )}
      {up.error ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{up.error}</span> : hint ? <span className="xk-field-hint">{hint}</span> : null}
      {rule.library && <MediaPicker open={picker} onClose={() => setPicker(false)} kind={rule.library} onPick={(m) => { onChange(m.url); setPicker(false); up.setError(""); }} />}
    </div>
  );
}

/* ---------- Multiple images, reorderable (project screens) ---------- */

export type Screen = { src: string; alt: string };

export function MultiUploader({ label, value, onChange, folder, hint, disabledReason, defaultAlt = "" }: { label?: string; value: Screen[]; onChange: (v: Screen[]) => void; folder: string; hint?: string; disabledReason?: string; defaultAlt?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);
  const latest = useRef(value);
  latest.current = value;
  const up = useUploads(folder, "image");

  const add = async (files: File[]) => {
    if (disabledReason) { up.setError(disabledReason); return; }
    await up.run(files, (url) => onChange([...latest.current, { src: url, alt: defaultAlt }]));
    if (input.current) input.current.value = "";
  };
  const move = (i: number, j: number) => {
    if (j < 0 || j >= value.length || i === j) return;
    const n = [...value]; const [m] = n.splice(i, 1); n.splice(j, 0, m); onChange(n);
  };

  return (
    <div className="xk-field xk-up" onPaste={(e) => { const f = filesFrom(e); if (f.length) { e.preventDefault(); add(f); } }}>
      {label && <span className="xk-up-label">{label}<span className="xk-admin-count">{value.length}</span></span>}
      <input ref={input} type="file" accept={RULES.image.accept} multiple hidden onChange={(e) => add(Array.from(e.target.files || []))} />
      <div className="xk-up-grid">
        {value.map((s, i) => (
          <figure
            key={`${s.src}-${i}`}
            className={cx("xk-up-tile", drag === i && "is-drag")}
            draggable
            onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); }}
            onDragEnd={() => setDrag(null)}
          >
            <div className="xk-up-tile-img"><img src={s.src} alt="" /><span className="xk-up-tile-n">{i + 1}</span></div>
            <input className="xk-admin-input" value={s.alt} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} placeholder="Alt text" aria-label={`Alt text for image ${i + 1}`} />
            <div className="xk-up-tile-tools">
              <span className="xk-order-handle" aria-hidden title="Drag to reorder"><Icon name="dots-six-vertical" /></span>
              <button type="button" className="xk-iconbtn-sm" aria-label={`Move image ${i + 1} left`} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="arrow-left" /></button>
              <button type="button" className="xk-iconbtn-sm" aria-label={`Move image ${i + 1} right`} disabled={i === value.length - 1} onClick={() => move(i, i + 1)}><Icon name="arrow-right" /></button>
              <button type="button" className="xk-iconbtn-sm is-danger" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(value.filter((_, k) => k !== i))}><Icon name="trash" /></button>
            </div>
          </figure>
        ))}
        {up.items.map((p) => <div key={p.id} className="xk-up-tile is-busy"><ProgressRow p={p} onCancel={() => p.ctrl.abort()} /></div>)}
        <div
          className={cx("xk-up-box is-empty is-tile", over && "is-over", disabledReason && "is-disabled")}
          role="button"
          tabIndex={0}
          aria-label="Add images: drop, paste or click"
          onClick={() => (disabledReason ? up.setError(disabledReason) : input.current?.click())}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
          onDragOver={(e) => { if (drag === null) { e.preventDefault(); setOver(true); } }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { if (drag !== null) return; e.preventDefault(); setOver(false); add(filesFrom(e)); }}
        >
          <span className="xk-up-icon"><Icon name="plus" /></span>
          <span className="xk-up-cta"><strong>Add images</strong><span>Drop several at once</span></span>
          <span className="xk-up-alt" onClick={(e) => e.stopPropagation()}><button type="button" className="xk-linkbtn" onClick={() => setPicker(true)}>From library</button></span>
        </div>
      </div>
      {up.error ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{up.error}</span> : hint ? <span className="xk-field-hint">{hint}</span> : null}
      <MediaPicker open={picker} onClose={() => setPicker(false)} kind="image" onPick={(m) => { onChange([...value, { src: m.url, alt: defaultAlt }]); setPicker(false); }} />
    </div>
  );
}

/* ---------- Library picker (sheet) ---------- */

export function useMediaList(enabled: boolean) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled || items) return;
    let live = true;
    listMedia().then((r) => { if (!live) return; if (r.ok) setItems(r.data || []); else setError(r.error); }).catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [enabled, items]);
  return { items, error };
}

export function MediaThumb({ m }: { m: Pick<MediaItem, "kind" | "url" | "name"> }) {
  if (m.kind === "image") return <img src={m.url} alt="" loading="lazy" />;
  if (m.kind === "video") return <video src={`${m.url}#t=0.5`} muted playsInline preload="metadata" />;
  return <span className="xk-media-doc"><Icon name="file-text" /><b>{m.name.split(".").pop()?.toUpperCase()}</b></span>;
}

export function MediaPicker({ open, onClose, kind, onPick }: { open: boolean; onClose: () => void; kind: MediaKind; onPick: (m: MediaItem) => void }) {
  const { items, error } = useMediaList(open);
  const [q, setQ] = useState("");
  const shown = useMemo(() => (items || []).filter((m) => m.kind === kind && (!q || m.path.toLowerCase().includes(q.toLowerCase()))), [items, kind, q]);
  return (
    <Sheet open={open} onClose={onClose} size="lg" title="Choose from library" description={`${kind === "doc" ? "Documents" : kind === "video" ? "Videos" : "Images"} from uploads and the repo's /public folder.`} initialFocus="input">
      <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or folder…" aria-label="Search media" /></label>
      {error && <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{error}</span>}
      {!items && !error ? (
        <div className="xk-media-grid is-picker">{Array.from({ length: 8 }, (_, i) => <span key={i} className="xk-admin-skel is-block" style={{ height: 150 }} />)}</div>
      ) : shown.length === 0 ? (
        <p className="xk-muted" style={{ margin: 0 }}>{q ? "Nothing matches that search." : "Nothing here yet."}</p>
      ) : (
        <div className="xk-media-grid is-picker">
          {shown.map((m) => (
            <button key={m.source + m.path} type="button" className="xk-media-tile is-pick" onClick={() => onPick(m)}>
              <span className="xk-media-tile-visual"><MediaThumb m={m} /></span>
              <span className="xk-media-tile-body"><span className="xk-media-tile-name" title={m.path}>{m.path.replace(/^\//, "").split("/").slice(-2, -1)[0] || m.name}</span><span className="xk-media-tile-meta">{m.name} · {m.source === "repo" ? "in repo" : "uploaded"} · {fmtBytes(m.size)}</span></span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
