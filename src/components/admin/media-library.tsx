"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { deleteMedia, listMedia, type MediaItem } from "@/app/[console]/actions";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import { Chip, EmptyState, PageHeader } from "./ui";
import { Sheet, SheetFooter, useConfirm, useToast } from "./sheet";
import { MediaThumb, ProgressRow, fmtBytes, useUploads } from "./uploader";

export type { MediaItem };

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "image", label: "Images", test: (m: MediaItem) => m.kind === "image" },
  { id: "video", label: "Videos", test: (m: MediaItem) => m.kind === "video" },
  { id: "doc", label: "Docs", test: (m: MediaItem) => m.kind === "doc" || m.kind === "other" },
  { id: "storage", label: "Uploaded", test: (m: MediaItem) => m.source === "storage" },
  { id: "repo", label: "In repo", test: (m: MediaItem) => m.source === "repo" },
] as const;

/** "posts/my-post/cover.webp" → "my-post". Root files have no folder. */
const folderOf = (m: MediaItem) => m.path.replace(/^\//, "").split("/").slice(-2, -1)[0] || "";

export function MediaLibrary({ initial, error }: { initial: MediaItem[]; error?: string }) {
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState<MediaItem | null>(null);
  const up = useUploads("uploads", "any");

  const refresh = async () => { const r = await listMedia(); if (r.ok && r.data) setItems(r.data); };
  const upload = async (files: File[]) => {
    if (!files.length) return;
    let n = 0;
    await up.run(files, () => { n++; });
    if (input.current) input.current.value = "";
    if (n) { toast.ok(`Uploaded ${n} file${n > 1 ? "s" : ""}`, "Saved to media/uploads/"); await refresh(); }
  };
  const remove = async (m: MediaItem) => {
    const ok = await confirm({ title: `Delete ${m.name}?`, body: m.usedBy.length ? <>It's still used by {m.usedBy.join(", ")}. Those pages will show a broken image.</> : "This removes it from Supabase Storage. It can't be undone.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    const r = await deleteMedia(m.path);
    if (!r.ok) { toast.error("Couldn't delete", r.error); return; }
    setItems((l) => l.filter((x) => !(x.source === "storage" && x.path === m.path)));
    setOpen(null);
    toast.ok("Deleted", m.name);
  };

  // Paste an image anywhere on the page (except while typing in a field or when a sheet is open).
  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, .xk-sheet-root, .xk-dialog-root")) return;
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) { e.preventDefault(); uploadRef.current(files); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const needle = q.trim().toLowerCase();
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const shown = useMemo(() => items.filter((m) => test(m) && (!needle || m.path.toLowerCase().includes(needle))), [items, test, needle]);
  const count = (id: string) => items.filter(FILTERS.find((f) => f.id === id)!.test).length;
  const uploaded = count("storage");

  const dropProps = {
    onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } },
    onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); },
    onDrop: (e: DragEvent) => { e.preventDefault(); setOver(false); upload(Array.from(e.dataTransfer.files)); },
  };

  return (
    <div className={cx("xk-admin-stack xk-media-page", over && "is-over")} {...dropProps}>
      <PageHeader
        eyebrow="Library"
        title="Media"
        description="Uploads in Supabase Storage plus the images, videos and PDFs committed to the repo's /public folder. Drop or paste files anywhere on this page to upload."
        meta={<><Chip dot tone="accent">{uploaded} uploaded</Chip><Chip dot tone="agent">{count("repo")} in repo</Chip></>}
        actions={<button type="button" className="xk-btn xk-btn-primary xk-btn-sm" onClick={() => input.current?.click()}><Icon name="upload-simple" />Upload</button>}
      />
      <input ref={input} type="file" multiple hidden onChange={(e) => upload(Array.from(e.target.files || []))} />
      {error && <div className="xk-admin-alert is-error"><Icon name="warning-circle" /><div>{error}</div></div>}
      {(up.items.length > 0 || up.error) && (
        <div className="xk-admin-panel xk-media-queue">
          {up.items.map((p) => <ProgressRow key={p.id} p={p} onCancel={() => p.ctrl.abort()} />)}
          {up.error && <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{up.error}</span>}
        </div>
      )}
      <div className="xk-admin-toolbar">
        <div className="xk-admin-tabs" role="group" aria-label="Filter media">
          {FILTERS.map((f) => <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}<span className="xk-admin-count">{count(f.id)}</span></button>)}
        </div>
        <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or folder…" aria-label="Search media" /></label>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="images" title={items.length ? "Nothing matches" : "No media yet"} ticks={!items.length} actions={!items.length ? <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" onClick={() => input.current?.click()}><Icon name="upload-simple" />Upload files</button> : <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</button>}>
          {items.length ? "Try another filter or search." : "Drop images, videos or PDFs here. They go straight to Supabase Storage."}
        </EmptyState>
      ) : (
        <div className="xk-media-grid">
          {shown.map((m) => (
            <button key={m.source + m.path} type="button" className="xk-media-tile is-pick" onClick={() => setOpen(m)}>
              <span className="xk-media-tile-visual"><MediaThumb m={m} />{m.kind === "video" && <span className="xk-media-badge"><Icon name="play" /></span>}</span>
              <span className="xk-media-tile-body">
                <span className="xk-media-tile-name" title={m.path}>{folderOf(m) || m.name}</span>
                <span className="xk-media-tile-meta">{folderOf(m) ? `${m.name} · ` : ""}{fmtBytes(m.size)}</span>
                <span className="xk-media-tile-tags"><Chip tone={m.source === "repo" ? "agent" : "accent"}>{m.source === "repo" ? "in repo" : "uploaded"}</Chip>{m.usedBy.length > 0 ? <Chip outline title={m.usedBy.join("\n")}>used {m.usedBy.length}×</Chip> : <Chip outline>unused</Chip>}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <MediaDetails item={open} onClose={() => setOpen(null)} onDelete={remove} />
      {over && <div className="xk-media-dropveil" aria-hidden><Icon name="upload-simple" /><strong>Drop to upload</strong></div>}
      {confirmNode}
    </div>
  );
}

function MediaDetails({ item, onClose, onDelete }: { item: MediaItem | null; onClose: () => void; onDelete: (m: MediaItem) => void }) {
  const toast = useToast();
  const [dims, setDims] = useState("");
  const [last, setLast] = useState<MediaItem | null>(item);
  if (item && item !== last) { setLast(item); setDims(""); }
  const m = item || last;
  const abs = m ? (m.url.startsWith("/") && typeof window !== "undefined" ? window.location.origin + m.url : m.url) : "";
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast.ok(`${what} copied`); } catch { toast.error("Clipboard blocked", "Select the text and copy it instead."); }
  };
  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      size="lg"
      title={m?.name || ""}
      description={m ? <>{m.source === "repo" ? "Committed in /public (read-only here)" : "Uploaded to Supabase Storage"}</> : undefined}
      footer={m && (
        <SheetFooter start={m.source === "storage" ? <button type="button" className="xk-btn xk-btn-danger xk-btn-sm" onClick={() => onDelete(m)}><Icon name="trash" />Delete</button> : <span className="xk-muted" style={{ fontSize: 12.5 }}>Remove repo files with git.</span>}>
          <a className="xk-btn xk-btn-secondary xk-btn-sm" href={m.url} target="_blank" rel="noopener"><Icon name="arrow-square-out" />Open</a>
          <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" onClick={() => copy(m.url, "URL")}><Icon name="copy" />Copy URL</button>
        </SheetFooter>
      )}
    >
      {m && (
        <>
          <div className="xk-media-detail-visual">
            {m.kind === "image" ? <img src={m.url} alt="" onLoad={(e) => setDims(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}`)} />
              : m.kind === "video" ? <video src={m.url} controls playsInline preload="metadata" onLoadedMetadata={(e) => setDims(`${e.currentTarget.videoWidth} × ${e.currentTarget.videoHeight} · ${Math.round(e.currentTarget.duration)}s`)} />
              : /\.pdf$/i.test(m.name) ? <iframe src={m.url} title={m.name} />
              : <MediaThumb m={m} />}
          </div>
          <label className="xk-field">
            <span>URL</span>
            <span className="xk-media-copy"><input readOnly className="xk-admin-input is-mono" value={m.url} onFocus={(e) => e.currentTarget.select()} /><button type="button" className="xk-iconbtn-sm" aria-label="Copy URL" onClick={() => copy(m.url, "URL")}><Icon name="copy" /></button></span>
            {m.url !== abs && <span className="xk-field-hint">Works as-is in any field. Full link: {abs}</span>}
          </label>
          {m.kind === "image" && <button type="button" className="xk-linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => copy(`![](${m.url})`, "Markdown")}>Copy as Markdown image</button>}
          <dl className="xk-media-facts">
            <div><dt>Type</dt><dd>{m.type || m.kind}</dd></div>
            <div><dt>Size</dt><dd>{fmtBytes(m.size)}</dd></div>
            {dims && <div><dt>Dimensions</dt><dd>{dims}</dd></div>}
            <div><dt>Source</dt><dd>{m.source === "repo" ? "Repo /public" : "Storage · media"}</dd></div>
            <div><dt>Path</dt><dd className="is-mono">{m.path}</dd></div>
            {m.updated && <div><dt>Updated</dt><dd>{new Date(m.updated).toLocaleString()}</dd></div>}
          </dl>
          <div className="xk-sheet-section">
            <h3>Used by</h3>
            {m.usedBy.length ? <div className="xk-tags">{m.usedBy.map((u) => <Chip key={u} tag>{u}</Chip>)}</div> : <p className="xk-muted" style={{ margin: 0, fontSize: 13 }}>Not referenced by any post, project or site section that we can see.</p>}
          </div>
        </>
      )}
    </Sheet>
  );
}
