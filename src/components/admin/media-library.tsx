"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia } from "@/app/[console]/actions";
import { Icon } from "@/components/xerk/icon";
import { ConfirmButton, StatusText, uploadFile, type Status } from "./shared";
import { cx } from "@/lib/utils";
import { EmptyState } from "./ui";

export type MediaFile = { path: string; url: string; size: number; type: string; updated: string };

const fmt = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

export function MediaLibrary({ files }: { files: MediaFile[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [state, setState] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState("");

  const upload = async (list?: FileList | null) => {
    if (!list?.length) return;
    const all = Array.from(list);
    try {
      for (const [i, f] of all.entries()) {
        setState({ kind: "busy", text: `Uploading ${f.name} (${i + 1}/${all.length})…` });
        await uploadFile("uploads", f);
      }
      setState({ kind: "ok", text: `Uploaded ${all.length} file${all.length > 1 ? "s" : ""}` });
      router.refresh();
    } catch (e) {
      setState({ kind: "error", text: e instanceof Error ? e.message : "Upload failed" });
    }
    if (input.current) input.current.value = "";
  };
  const remove = async (path: string) => {
    setState({ kind: "busy", text: "Deleting…" });
    const r = await deleteMedia(path);
    setState(r.ok ? { kind: "ok", text: "Deleted" } : { kind: "error", text: r.error });
    if (r.ok) router.refresh();
  };
  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(""), 1500); } catch { setState({ kind: "error", text: "Clipboard blocked; copy from the address bar instead" }); }
  };
  const shown = files.filter((f) => f.path.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div
        className={cx("xk-drop", over && "is-over")}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
      >
        <Icon name="upload-simple" />
        <strong>Drop files here or click to upload</strong>
        <span>Images, videos, PDFs, HTML. Goes straight to Supabase Storage (media/uploads/), no size cap from Vercel.</span>
        <input ref={input} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>
      <div className="xk-admin-toolbar">
        <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by path…" aria-label="Filter files" /></label>
        <div className="xk-admin-toolbar-end">
          <StatusText status={state} />
          <span className="xk-admin-count">{shown.length} file{shown.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      {shown.length === 0 ? <EmptyState icon="images" title={files.length ? "No files match" : "No files yet"} ticks={!files.length}>{files.length ? "Try a different path filter." : "Uploads, post covers and project media land here."}</EmptyState> : (
        <div className="xk-media-grid">
          {shown.map((f) => {
            const img = /^image\//.test(f.type) || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.path);
            const vid = /^video\//.test(f.type) || /\.(mp4|webm|mov)$/i.test(f.path);
            return (
              <div key={f.path} className="xk-media-tile">
                <a className="xk-media-tile-visual" href={f.url} target="_blank" rel="noopener">
                  {img ? <img src={f.url} alt="" loading="lazy" /> : vid ? <video src={f.url} muted preload="metadata" /> : <Icon name="file-text" />}
                </a>
                <div className="xk-media-tile-body">
                  <span className="xk-media-tile-name" title={f.path}>{f.path}</span>
                  <span className="xk-media-tile-meta">{fmt(f.size)}{f.updated && ` · ${f.updated.slice(0, 10)}`}</span>
                  <div className="xk-media-tile-actions">
                    <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => copy(f.url)}><Icon name={copied === f.url ? "check" : "copy"} />{copied === f.url ? "Copied" : "Copy URL"}</button>
                    <ConfirmButton label="Delete" question="Delete?" confirmLabel="Yes" onConfirm={() => remove(f.path)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
