"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deletePost, previewMarkdown, savePost, setPostStatus, type PostInput } from "@/app/[console]/actions";
import { useAdminHref } from "@/components/admin/base";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import { slugify } from "./shared";
import { Chip } from "./ui";
import { Sheet, useConfirm, useToast } from "./sheet";
import { Uploader } from "./uploader";
import { ChipInput, Disclosure, Kbd, SaveState, SlugField, type SaveStatus, useSaveShortcut, useUnsavedGuard } from "./form";

export type PostDraft = Omit<PostInput, "originalSlug" | "tags"> & { tags: string };

const today = () => new Date().toISOString().slice(0, 10);
const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Wide screens keep Details docked beside the editor; narrow ones open it in a sheet. */
function useWide(min = 1180) {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [min]);
  return wide;
}

export function PostEditor({ initial, isNew, fromRepo, allTags = [] }: { initial: PostDraft; isNew: boolean; fromRepo?: boolean; allTags?: string[] }) {
  const router = useRouter();
  const ah = useAdminHref();
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const wide = useWide();
  const [post, setPost] = useState<PostDraft>(() => ({ ...initial, published_at: initial.published_at || (isNew ? today() : initial.published_at) }));
  const [savedSlug, setSavedSlug] = useState<string | undefined>(isNew ? undefined : initial.slug);
  const [slugAuto, setSlugAuto] = useState(isNew || !initial.slug);
  const [inDb, setInDb] = useState(!isNew && !fromRepo);
  const [status, setStatus] = useState<SaveStatus>({ state: "clean" });
  const [mode, setMode] = useState<"write" | "split" | "preview">("write");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [html, setHtml] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "busy" | "error">("idle");
  const seq = useRef(0);
  const saving = useRef(false);
  const version = useRef(0);
  const dirty = status.state === "dirty" || status.state === "error";
  useUnsavedGuard(dirty);

  const set = <K extends keyof PostDraft>(k: K, v: PostDraft[K]) => {
    version.current++;
    setStatus({ state: "dirty" });
    setPost((p) => ({ ...p, [k]: v, ...(k === "title" && slugAuto ? { slug: slugify(String(v)) } : {}) }));
  };

  // Live preview through the site's own markdown pipeline, only while it's visible.
  const showPreview = mode !== "write";
  useEffect(() => {
    if (!showPreview) return;
    const id = ++seq.current;
    setPreviewState("busy");
    const t = setTimeout(async () => {
      const r = await previewMarkdown(post.body_md).catch(() => null);
      if (id !== seq.current) return;
      if (r?.ok) { setHtml(r.data || ""); setPreviewState("idle"); } else setPreviewState("error");
    }, 350);
    return () => clearTimeout(t);
  }, [post.body_md, showPreview]);
  useEffect(() => { if (!wide && mode === "split") setMode("write"); }, [wide, mode]);

  const save = useCallback(async (next: "draft" | "published", opts: { quiet?: boolean } = {}) => {
    if (saving.current) return;
    if (!post.title.trim()) { toast.error("Add a title first"); return; }
    const slug = post.slug || slugify(post.title);
    if (!SLUG_RE.test(slug)) { toast.error("The URL needs letters or numbers", "Edit it in Details."); return; }
    saving.current = true;
    const v = version.current;
    setStatus({ state: "saving" });
    const r = await savePost({ ...post, slug, status: next, originalSlug: savedSlug, tags: splitTags(post.tags) }).catch((e) => ({ ok: false as const, error: String(e) }));
    saving.current = false;
    if (!r.ok || !r.data) {
      setStatus({ state: "error", error: r.ok ? "Save failed" : r.error });
      toast.error(next === "published" ? "Couldn't publish" : "Couldn't save", r.ok ? undefined : r.error);
      return;
    }
    setInDb(true);
    setStatus(version.current === v ? { state: "saved", at: Date.now() } : { state: "dirty" });
    setPost((p) => ({ ...p, slug, status: next, published_at: p.published_at || (next === "published" ? today() : "") }));
    if (!opts.quiet) toast.ok(next === "published" ? (post.status === "published" && savedSlug ? "Changes are live" : "Published") : "Draft saved", next === "published" ? `/blog/${slug}` : undefined);
    if (r.data.slug !== savedSlug) { setSavedSlug(r.data.slug); router.replace(ah(`/posts/${r.data.slug}`)); }
    else if (!opts.quiet) router.refresh();
  }, [post, savedSlug, toast, router, ah]);

  const live = !!savedSlug && inDb && post.status === "published";
  useSaveShortcut(() => save(live ? "published" : "draft"));

  // Autosave drafts that already exist (never touches live posts or renames).
  useEffect(() => {
    if (status.state !== "dirty" || !inDb || post.status !== "draft" || !savedSlug || post.slug !== savedSlug || !post.title.trim()) return;
    const t = setTimeout(() => save("draft", { quiet: true }), 2500);
    return () => clearTimeout(t);
  }, [status.state, inDb, post, savedSlug, save]);

  const unpublish = async () => {
    if (!savedSlug) return;
    const r = await setPostStatus(savedSlug, "draft");
    if (!r.ok) { toast.error("Couldn't unpublish", r.error); return; }
    setPost((p) => ({ ...p, status: "draft" }));
    toast.ok("Unpublished", "It's a draft again and hidden from /blog.");
    router.refresh();
  };
  const remove = async () => {
    if (!savedSlug) return;
    const ok = await confirm({ title: "Delete this post?", body: fromRepo ? "It also lives in content/, so it will be unpublished instead." : "This can't be undone.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    const r = await deletePost(savedSlug);
    if (!r.ok) { toast.error("Couldn't delete", r.error); return; }
    setStatus({ state: "clean" });
    if (r.message === "Deleted") { toast.ok("Post deleted"); router.push(ah("/posts")); }
    else { setPost((p) => ({ ...p, status: "draft" })); toast.info("Unpublished instead", r.message); router.refresh(); }
  };

  const words = post.body_md.trim() ? post.body_md.trim().split(/\s+/).length : 0;
  const folder = `posts/${post.slug || "untitled"}`;
  const needSlug = post.slug ? undefined : "Add a title first";

  const details: ReactNode = (
    <div className="xk-editor-details">
      <div className="xk-sheet-section">
        <h3>Publishing</h3>
        <div className="xk-editor-status">
          <Chip dot tone={!savedSlug || !inDb ? "neutral" : post.status === "published" ? "accent" : "warning"}>{!savedSlug ? "not saved yet" : !inDb ? "repo file" : post.status === "published" ? "published" : "draft"}</Chip>
          {live && <button type="button" className="xk-linkbtn" onClick={unpublish}>Unpublish</button>}
        </div>
        <label className="xk-field"><span>Publish date</span><input type="date" value={post.published_at} onChange={(e) => set("published_at", e.target.value)} /><span className="xk-field-hint">Shown on the post and used for ordering</span></label>
        <SlugField prefix="/blog/" value={post.slug} auto={slugAuto} onEdit={(v) => { setSlugAuto(false); set("slug", slugify(v) + (v.endsWith("-") ? "-" : "")); }} />
      </div>
      <div className="xk-sheet-section">
        <h3>Discovery</h3>
        <ChipInput label="Tags" value={splitTags(post.tags)} onChange={(v) => set("tags", v.join(", "))} suggestions={allTags} prefix="#" placeholder="Type a tag, press Enter" />
      </div>
      <div className="xk-sheet-section">
        <h3>Media</h3>
        <Uploader label="Cover image" value={post.cover_url} onChange={(v) => set("cover_url", v)} folder={folder} disabledReason={needSlug} hint="Cards and social previews. 1600×900 works well." />
        <Disclosure title="Video" summary={post.video_url ? "1 attached" : "optional"} defaultOpen={!!post.video_url}>
          <Uploader label="Video" kind="video" value={post.video_url} onChange={(v) => set("video_url", v)} folder={folder} disabledReason={needSlug} hint="Upload an MP4 or use a YouTube / Vimeo URL" />
        </Disclosure>
      </div>
      {savedSlug && inDb && (
        <div className="xk-sheet-section">
          <h3>Danger zone</h3>
          <button type="button" className="xk-btn xk-btn-danger xk-btn-sm" style={{ alignSelf: "flex-start" }} onClick={remove}><Icon name="trash" />Delete post</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="xk-editor">
      <div className="xk-editor-top">
        <div className="xk-editor-top-start">
          <Link href={ah("/posts")} className="xk-iconbtn-sm" aria-label="Back to posts" title="Back to posts"><Icon name="arrow-left" /></Link>
          <span className="xk-editor-crumb"><Link href={ah("/posts")} className="xk-admin-crumb">Posts</Link><span aria-hidden>/</span><b>{post.title || "Untitled"}</b></span>
          <SaveState status={status} />
          {fromRepo && !inDb && <Chip dot tone="agent" title="Saving copies it into Supabase">from content/</Chip>}
        </div>
        <div className="xk-editor-top-end">
          {live && <a className="xk-btn xk-btn-ghost xk-btn-sm xk-hide-sm" href={`/blog/${savedSlug}`} target="_blank" rel="noopener"><Icon name="arrow-square-out" />View</a>}
          <button type="button" className={cx("xk-btn xk-btn-secondary xk-btn-sm", wide && detailsOpen && "is-active")} aria-pressed={wide ? detailsOpen : undefined} onClick={() => (wide ? setDetailsOpen((o) => !o) : setSheetOpen(true))}><Icon name="sidebar-simple" /><span className="xk-hide-sm">Details</span></button>
          {!live && <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" disabled={status.state === "saving"} onClick={() => save("draft")} title="Save draft (Ctrl/⌘+S)">Save draft</button>}
          <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={status.state === "saving"} onClick={() => save("published")}><Icon name={live ? "check" : "rocket-launch"} />{live ? "Update" : "Publish"}</button>
        </div>
      </div>

      <div className={cx("xk-editor-body", wide && detailsOpen && "has-side")}>
        <div className="xk-editor-main">
          <textarea className="xk-editor-title" rows={1} value={post.title} onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))} placeholder="Post title" aria-label="Title" autoFocus={isNew} />
          <textarea className="xk-editor-summary" rows={1} value={post.summary} onChange={(e) => set("summary", e.target.value.replace(/\n/g, " "))} placeholder="One-line summary for cards, RSS and search results" aria-label="Summary" />
          <div className={cx("xk-editor-summary-count", post.summary.length > 160 && "is-over")}>{post.summary.length > 0 && `${post.summary.length}/160`}</div>
          <div className="xk-editor-modebar">
            <div className="xk-admin-tabs" role="tablist" aria-label="Editor view">
              <button type="button" role="tab" aria-selected={mode === "write"} onClick={() => setMode("write")}><Icon name="pencil-simple" />Write</button>
              {wide && <button type="button" role="tab" aria-selected={mode === "split"} onClick={() => setMode("split")}><Icon name="sidebar-simple" />Split</button>}
              <button type="button" role="tab" aria-selected={mode === "preview"} onClick={() => setMode("preview")}><Icon name="eye" />Preview</button>
            </div>
            <span className="xk-editor-meta">{words} words · {Math.max(1, Math.round(words / 220))} min read{previewState === "busy" && showPreview ? " · rendering…" : ""}<span className="xk-hide-sm"> · <Kbd k="S" /> to save</span></span>
          </div>
          <div className={cx("xk-editor-panes", `is-${mode}`)}>
            {mode !== "preview" && (
              <textarea className="xk-editor-md" value={post.body_md} onChange={(e) => set("body_md", e.target.value)} spellCheck aria-label="Body (Markdown)" placeholder={"Start with the point.\n\n## A section\n\nText, `code`, lists, links. Markdown works."} />
            )}
            {mode !== "write" && (
              <div className="xk-editor-preview">{previewState === "error" ? <p className="xk-muted">Preview failed to render.</p> : html ? <div className="xk-prose" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="xk-muted">{post.body_md.trim() ? "Rendering…" : "Nothing to preview yet."}</p>}</div>
            )}
          </div>
        </div>
        {wide && detailsOpen && <aside className="xk-editor-side" aria-label="Post details">{details}</aside>}
      </div>

      {!wide && <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Post details" description="URL, tags, cover and publishing." footer={<button type="button" className="xk-btn xk-btn-primary xk-btn-sm" style={{ marginLeft: "auto" }} onClick={() => setSheetOpen(false)}>Done</button>}>{details}</Sheet>}
      {confirmNode}
    </div>
  );
}

/* ---------- Quick create (title → draft → editor) ---------- */

export function NewPostSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const ah = useAdminHref();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setTitle(""); setError(""); } }, [open]);
  const slug = slugify(title);
  const create = async () => {
    if (!title.trim()) { setError("Give it a working title. You can change it later."); return; }
    if (!slug) { setError("The title needs some letters or numbers."); return; }
    setBusy(true);
    let r: Awaited<ReturnType<typeof savePost>> | null = null;
    for (const s of [slug, `${slug}-2`, `${slug}-${Date.now().toString(36).slice(-4)}`]) {
      r = await savePost({ slug: s, title: title.trim(), summary: "", tags: [], body_md: "", cover_url: "", video_url: "", status: "draft", published_at: today() });
      if (r.ok || !/already exists/.test(r.error)) break;
    }
    setBusy(false);
    if (!r?.ok || !r.data) { setError(r && !r.ok ? r.error : "Couldn't create the draft"); return; }
    toast.ok("Draft created");
    onClose();
    router.push(ah(`/posts/${r.data.slug}`));
  };
  return (
    <Sheet open={open} onClose={onClose} size="sm" title="New post" description="Start with a title. Everything else lives in the editor." dirty={!!title.trim() && !busy}
      footer={<><button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={onClose}>Cancel</button><button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={busy} onClick={create}>{busy ? "Creating…" : <>Create draft<Icon name="arrow-right" /></>}</button></>}>
      <form className="xk-sheet-section" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <label className={cx("xk-field", error && "has-error")}>
          <span>Title</span>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="What's it about?" data-autofocus autoComplete="off" />
          {error ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{error}</span> : <span className="xk-field-hint">URL: /blog/{slug || "…"}</span>}
        </label>
        <p className="xk-muted" style={{ margin: 0, fontSize: 13 }}>It's saved as a hidden draft right away, so the cover upload and autosave work from the first keystroke.</p>
      </form>
    </Sheet>
  );
}
