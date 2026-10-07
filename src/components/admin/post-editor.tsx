"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost, previewMarkdown, savePost, setPostStatus, type PostInput } from "@/app/admin/actions";
import { ConfirmButton, MediaField, StatusText, slugify, useAction } from "./shared";
import { cx } from "@/lib/utils";

export type PostDraft = Omit<PostInput, "originalSlug" | "tags"> & { tags: string };

export function PostEditor({ initial, isNew, fromRepo }: { initial: PostDraft; isNew: boolean; fromRepo?: boolean }) {
  const router = useRouter();
  const [post, setPost] = useState<PostDraft>(initial);
  const [savedSlug, setSavedSlug] = useState<string | undefined>(isNew ? undefined : initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [html, setHtml] = useState("");
  const [previewState, setPreviewState] = useState<"idle" | "busy" | "error">("idle");
  const [pane, setPane] = useState<"write" | "preview">("write");
  const [dirty, setDirty] = useState(false);
  const [inDb, setInDb] = useState(!isNew && !fromRepo);
  const { status, pending, exec } = useAction();
  const seq = useRef(0);

  const set = <K extends keyof PostDraft>(k: K, v: PostDraft[K]) => {
    setDirty(true);
    setPost((p) => {
      const next = { ...p, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
  };

  // Live preview through the site's own markdown pipeline (server action), debounced.
  useEffect(() => {
    const id = ++seq.current;
    setPreviewState("busy");
    const t = setTimeout(async () => {
      const r = await previewMarkdown(post.body_md).catch(() => null);
      if (id !== seq.current) return;
      if (r?.ok) { setHtml(r.data || ""); setPreviewState("idle"); } else setPreviewState("error");
    }, 450);
    return () => clearTimeout(t);
  }, [post.body_md]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", on);
    return () => window.removeEventListener("beforeunload", on);
  }, [dirty]);

  const save = async (status: "draft" | "published") => {
    const r = await exec(() => savePost({ ...post, status, originalSlug: savedSlug, tags: post.tags.split(",").map((t) => t.trim()).filter(Boolean) }), status === "published" ? "Publishing…" : "Saving…");
    if (r.ok && r.data) {
      setDirty(false);
      setInDb(true);
      setPost((p) => ({ ...p, status, published_at: p.published_at || (status === "published" ? new Date().toISOString().slice(0, 10) : "") }));
      if (r.data.slug !== savedSlug) {
        setSavedSlug(r.data.slug);
        router.replace(`/admin/posts/${r.data.slug}`);
      } else router.refresh();
    }
  };

  const unpublish = async () => {
    if (!savedSlug) return;
    const r = await exec(() => setPostStatus(savedSlug, "draft"), "Unpublishing…");
    if (r.ok) { setPost((p) => ({ ...p, status: "draft" })); router.refresh(); }
  };

  const remove = async () => {
    if (!savedSlug) return;
    const r = await exec(() => deletePost(savedSlug), "Deleting…");
    if (r.ok) { setDirty(false); if (r.message === "Deleted") router.push("/admin/posts"); else { setPost((p) => ({ ...p, status: "draft" })); router.refresh(); } }
  };

  const summaryLen = post.summary.length;
  const live = !!savedSlug && post.status === "published";
  const folder = `posts/${post.slug || "untitled"}`;

  return (
    <div className="xk-admin-main" style={{ paddingBottom: 0 }}>
      <div className="xk-admin-head">
        <div>
          <span className="xk-label">{!savedSlug ? "New post" : post.status === "published" ? "Published" : "Draft"}{!inDb && fromRepo && " · from content/ (saving copies it to Supabase)"}</span>
          <h1>{post.title || "Untitled post"}</h1>
        </div>
        <div className="xk-admin-actions">
          {live && savedSlug && <a className="xk-btn xk-btn-ghost xk-btn-sm" href={`/blog/${savedSlug}`} target="_blank" rel="noopener">View on site ↗</a>}
        </div>
      </div>

      <section className="xk-admin-panel">
        <label className="xk-field"><span>Title</span><input value={post.title} onChange={(e) => set("title", e.target.value)} placeholder="What the post is about" /></label>
        <div className="xk-field-row">
          <label className="xk-field"><span>Slug</span><input className="is-mono" value={post.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : "")); }} placeholder="my-post" /><span className="xk-field-hint">/blog/{post.slug || "…"}</span></label>
          <label className="xk-field"><span>Tags</span><input value={post.tags} onChange={(e) => set("tags", e.target.value)} placeholder="nodejs, ai, architecture" /><span className="xk-field-hint">Comma separated</span></label>
        </div>
        <label className="xk-field">
          <span>Summary</span>
          <textarea rows={2} value={post.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One or two sentences for cards, RSS and search results" />
          <span className={cx("xk-field-hint", summaryLen > 160 && "is-over")}><span>Shown on cards and as the meta description</span><span>{summaryLen}/160</span></span>
        </label>
        <div className="xk-field-row">
          <div className="xk-field"><span>Status</span><div><span className={cx("xk-badge", post.status === "published" && "xk-badge-accent")}>{post.status === "published" ? "Published" : "Draft"}</span></div><span className="xk-field-hint">Change it with Publish / Unpublish below</span></div>
          <label className="xk-field"><span>Published date</span><input type="date" value={post.published_at} onChange={(e) => set("published_at", e.target.value)} /><span className="xk-field-hint">Defaults to today when you publish</span></label>
        </div>
      </section>

      <section className="xk-admin-panel">
        <h2>Media</h2>
        <div className="xk-field-row">
          <MediaField label="Cover image" value={post.cover_url} onChange={(v) => set("cover_url", v)} folder={folder} disabledReason={post.slug ? undefined : "Add a title or slug first"} hint="Uploads to media/posts/<slug>/. 1600×1000 works well." />
          <MediaField label="Video (optional)" kind="video" accept="video/*" value={post.video_url} onChange={(v) => set("video_url", v)} folder={folder} disabledReason={post.slug ? undefined : "Add a title or slug first"} hint="YouTube, Vimeo or .mp4 URL, or upload an mp4" />
        </div>
      </section>

      <section className="xk-admin-panel">
        <div className="xk-admin-head" style={{ alignItems: "center" }}>
          <h2 style={{ margin: 0, font: "600 18px/24px var(--font-sans)" }}>Body</h2>
          <div className="xk-admin-tabs" role="group" aria-label="Editor pane">
            <button type="button" aria-pressed={pane === "write"} onClick={() => setPane("write")}>Write</button>
            <button type="button" aria-pressed={pane === "preview"} onClick={() => setPane("preview")}>Preview</button>
          </div>
          <span className="xk-field-hint">{previewState === "busy" ? "Rendering preview…" : previewState === "error" ? "Preview failed" : "Markdown · preview uses the site's renderer"}</span>
        </div>
        <div className="xk-admin-split">
          <label className={cx("xk-field", pane !== "write" && "is-off")}>
            <span className="xk-label">Markdown</span>
            <textarea className="is-mono" value={post.body_md} onChange={(e) => set("body_md", e.target.value)} spellCheck placeholder={"Start with the point.\n\n## A section\n\nText, `code`, lists, links…"} />
          </label>
          <div className={cx("xk-field", pane !== "preview" && "is-off")}>
            <span className="xk-label">Preview</span>
            <div className="xk-admin-preview"><div className="xk-prose" dangerouslySetInnerHTML={{ __html: html }} /></div>
          </div>
        </div>
      </section>

      <div className="xk-admin-bar">
        <div className="xk-admin-actions">
          {live
            ? <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={pending} onClick={() => save("published")}>Save changes (live)</button>
            : <>
                <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" disabled={pending} onClick={() => save("draft")}>Save draft</button>
                <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={pending} onClick={() => save("published")}>Publish</button>
              </>}
          {live && inDb && <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" disabled={pending} onClick={unpublish}>Unpublish</button>}
          {savedSlug && inDb && <ConfirmButton label="Delete" question="Delete this post?" onConfirm={remove} disabled={pending} />}
        </div>
        <div className="xk-admin-actions">
          {dirty && status.kind !== "busy" && <span className="xk-admin-msg">Unsaved changes</span>}
          <StatusText status={status} />
        </div>
      </div>
    </div>
  );
}
