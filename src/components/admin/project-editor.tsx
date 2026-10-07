"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/data/projects";
import { deleteProject, importDemo, saveProject } from "@/app/admin/actions";
import { Icon } from "@/components/xerk/icon";
import { ConfirmButton, MediaField, StatusText, slugify, uploadFile, useAction, type Status } from "./shared";

type SectionForm = { id: string; title: string; body: string };
type Form = {
  slug: string; code: string; title: string; world: string; company: string; period: string; role: string;
  summary: string; answer: string; takeaways: string; boss: string; big: string; bigLabel: string;
  image: string; video: string; embedUrl: string; url: string; ai: boolean; featured: boolean;
  stack: string; metrics: string; sections: SectionForm[]; faq: { q: string; a: string }[]; screens: { src: string; alt: string }[];
  updated: string;
};

function toForm(p: Project): Form {
  return {
    slug: p.slug, code: p.code, title: p.title, world: p.world || "", company: p.company || "", period: p.period || "", role: p.role || "",
    summary: p.summary || "", answer: p.answer || "", takeaways: (p.takeaways || []).join("\n"), boss: p.boss || "", big: p.big || "", bigLabel: p.bigLabel || "",
    image: p.image || "", video: p.video || "", embedUrl: p.embedUrl || "", url: p.url || "", ai: !!p.ai, featured: !!p.featured,
    stack: (p.stack || []).join(", "), metrics: (p.metrics || []).map((m) => [m.value, m.label, m.hint].filter((x) => x !== undefined).join(" | ")).join("\n"),
    sections: (p.sections || []).map((s) => ({ id: s.id, title: s.title, body: s.body.join("\n\n") })), faq: p.faq || [], screens: p.screens || [], updated: p.updated || "",
  };
}

function toProject(f: Form): Project {
  const opt = (s: string) => s.trim() || undefined;
  return {
    slug: f.slug.trim(), code: f.code.trim(), title: f.title.trim(), world: f.world.trim(), company: f.company.trim(), period: f.period.trim(), role: f.role.trim(),
    summary: f.summary.trim(), answer: f.answer.trim(), takeaways: f.takeaways.split("\n").map((t) => t.trim()).filter(Boolean), boss: f.boss.trim(),
    big: opt(f.big), bigLabel: opt(f.bigLabel), image: opt(f.image), video: opt(f.video), embedUrl: opt(f.embedUrl), url: opt(f.url),
    ai: f.ai || undefined, featured: f.featured || undefined,
    screens: f.screens.filter((s) => s.src.trim()).length ? f.screens.filter((s) => s.src.trim()).map((s) => ({ src: s.src.trim(), alt: s.alt.trim() })) : undefined,
    stack: f.stack.split(",").map((s) => s.trim()).filter(Boolean),
    metrics: f.metrics.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((r) => r[0]).map(([value, label = "", hint]) => ({ value, label, ...(hint ? { hint } : {}) })),
    sections: f.sections.filter((s) => s.title.trim() || s.body.trim()).map((s) => ({ id: s.id.trim() || slugify(s.title), title: s.title.trim(), body: s.body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean) })),
    faq: f.faq.filter((q) => q.q.trim()).map((q) => ({ q: q.q.trim(), a: q.a.trim() })),
    updated: f.updated,
  };
}

const Text = ({ label, value, onChange, hint, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; mono?: boolean }) => (
  <label className="xk-field"><span>{label}</span><input className={mono ? "is-mono" : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />{hint && <span className="xk-field-hint">{hint}</span>}</label>
);
const Area = ({ label, value, onChange, hint, rows = 3, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number; placeholder?: string; mono?: boolean }) => (
  <label className="xk-field"><span>{label}</span><textarea className={mono ? "is-mono" : undefined} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />{hint && <span className="xk-field-hint">{hint}</span>}</label>
);

export function ProjectEditor({ initial, isNew, published: initialPublished, inDb }: { initial: Project; isNew: boolean; published: boolean; inDb: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(() => toForm(initial));
  const [published, setPublished] = useState(initialPublished);
  const [savedSlug, setSavedSlug] = useState<string | undefined>(isNew ? undefined : initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [dirty, setDirty] = useState(false);
  const { status, pending, exec } = useAction();
  const [demo, setDemo] = useState<Status>({ kind: "idle" });
  const demoInput = useRef<HTMLInputElement>(null);
  const screensInput = useRef<HTMLInputElement>(null);
  const [screensState, setScreensState] = useState<Status>({ kind: "idle" });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setDirty(true);
    setF((p) => ({ ...p, [k]: v, ...(k === "title" && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
  };

  useEffect(() => {
    if (!dirty) return;
    const on = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", on);
    return () => window.removeEventListener("beforeunload", on);
  }, [dirty]);

  const folder = `projects/${f.slug || "untitled"}`;
  const needSlug = f.slug ? undefined : "Add a title or slug first";

  const save = async () => {
    const r = await exec(() => saveProject({ originalSlug: savedSlug, project: toProject(f), published }));
    if (r.ok && r.data) {
      setDirty(false);
      if (r.data.slug !== savedSlug) { setSavedSlug(r.data.slug); router.replace(`/admin/projects/${r.data.slug}`); } else router.refresh();
    }
  };

  const remove = async () => {
    if (!savedSlug) return;
    const r = await exec(() => deleteProject(savedSlug), "Deleting…");
    if (r.ok) { setDirty(false); router.push("/admin/projects"); }
  };

  const uploadDemo = async (file?: File) => {
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) { setDemo({ kind: "error", text: "Pick an .html file" }); return; }
    setDemo({ kind: "busy", text: "Uploading demo…" });
    try {
      const { path } = await uploadFile(folder, file, "demo");
      const r = await importDemo(f.slug, path);
      if (!r.ok || !r.data) throw new Error(r.ok ? "Import failed" : r.error);
      set("embedUrl", r.data.embedUrl);
      setDemo({ kind: "ok", text: `Demo stored, served at ${r.data.embedUrl}. Save the project to use it.` });
    } catch (e) {
      setDemo({ kind: "error", text: e instanceof Error ? e.message : "Upload failed" });
    }
    if (demoInput.current) demoInput.current.value = "";
  };

  const uploadScreens = async (files?: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setScreensState({ kind: "busy", text: `Uploading ${list.length} image${list.length > 1 ? "s" : ""}…` });
    try {
      const added: { src: string; alt: string }[] = [];
      for (const file of list) {
        const { publicUrl } = await uploadFile(`${folder}/screens`, file);
        added.push({ src: publicUrl, alt: `${f.title || "Project"} screenshot` });
      }
      set("screens", [...f.screens, ...added]);
      setScreensState({ kind: "ok", text: "Uploaded" });
    } catch (e) {
      setScreensState({ kind: "error", text: e instanceof Error ? e.message : "Upload failed" });
    }
    if (screensInput.current) screensInput.current.value = "";
  };

  const move = <T,>(list: T[], i: number, d: number) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; };

  return (
    <div className="xk-admin-main" style={{ paddingBottom: 0 }}>
      <div className="xk-admin-head">
        <div>
          <span className="xk-label">{!savedSlug ? "New project" : `Stage ${f.code}`}{savedSlug && !inDb && " · static data (saving copies it to Supabase)"}</span>
          <h1>{f.title || "Untitled project"}</h1>
        </div>
        <div className="xk-admin-actions">
          {savedSlug && published && <a className="xk-btn xk-btn-ghost xk-btn-sm" href={`/work/${savedSlug}`} target="_blank" rel="noopener">View on site ↗</a>}
        </div>
      </div>

      <section className="xk-admin-panel">
        <h2>Basics</h2>
        <Text label="Title" value={f.title} onChange={(v) => set("title", v)} />
        <div className="xk-field-row is-3">
          <label className="xk-field"><span>Slug</span><input className="is-mono" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : "")); }} /><span className="xk-field-hint">/work/{f.slug || "…"}</span></label>
          <Text label="Code" value={f.code} onChange={(v) => set("code", v)} placeholder="1-7" mono hint="Stage number in the level select" />
          <Text label="World" value={f.world} onChange={(v) => set("world", v)} placeholder="Enterprise · AI" />
        </div>
        <div className="xk-field-row is-3">
          <Text label="Company" value={f.company} onChange={(v) => set("company", v)} />
          <Text label="Period" value={f.period} onChange={(v) => set("period", v)} placeholder="2024 — Now" />
          <Text label="Role" value={f.role} onChange={(v) => set("role", v)} />
        </div>
        <Area label="Summary" value={f.summary} onChange={(v) => set("summary", v)} rows={2} />
        <Area label="Answer (TL;DR)" value={f.answer} onChange={(v) => set("answer", v)} rows={2} hint="One answer-first sentence: used in the TL;DR box, meta description and llms.txt" />
        <Area label="Takeaways" value={f.takeaways} onChange={(v) => set("takeaways", v)} rows={3} hint="One per line" />
        <div className="xk-field-row is-3">
          <Text label="Boss" value={f.boss} onChange={(v) => set("boss", v)} placeholder="100,000 sockets that can't drop" />
          <Text label="Big number" value={f.big} onChange={(v) => set("big", v)} placeholder="100K+" />
          <Text label="Big number label" value={f.bigLabel} onChange={(v) => set("bigLabel", v)} placeholder="concurrent devices" />
        </div>
        <Text label="Stack" value={f.stack} onChange={(v) => set("stack", v)} hint="Comma separated" />
        <Area label="Metrics" value={f.metrics} onChange={(v) => set("metrics", v)} rows={3} mono hint="One per line: value | label | hint (hint optional)" placeholder="100K+ | Concurrent connections" />
        <div className="xk-field-row">
          <Text label="Live site URL (optional)" value={f.url} onChange={(v) => set("url", v)} placeholder="https://…" />
          <div className="xk-field"><span>Flags</span>
            <div className="xk-admin-actions">
              <label className="xk-switch"><input type="checkbox" checked={published} onChange={(e) => { setDirty(true); setPublished(e.target.checked); }} />Published</label>
              <label className="xk-switch"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />Featured</label>
              <label className="xk-switch"><input type="checkbox" checked={f.ai} onChange={(e) => set("ai", e.target.checked)} />AI project</label>
            </div>
          </div>
        </div>
      </section>

      <section className="xk-admin-panel">
        <h2>Media</h2>
        <div className="xk-field-row">
          <MediaField label="Cover image" value={f.image} onChange={(v) => set("image", v)} folder={folder} fixedName="cover" disabledReason={needSlug} hint="media/projects/<slug>/cover.*" />
          <MediaField label="Preview video" kind="video" accept="video/mp4,video/webm" value={f.video} onChange={(v) => set("video", v)} folder={folder} fixedName="preview" disabledReason={needSlug} hint="Short muted loop (mp4). media/projects/<slug>/preview.*" />
        </div>
        <div className="xk-field xk-admin-upload">
          <span>Interactive demo</span>
          <div className="xk-admin-upload-row">
            <input type="text" value={f.embedUrl} onChange={(e) => set("embedUrl", e.target.value)} placeholder="https://claude.site/… or /demos/… or upload an .html file" />
            <input ref={demoInput} type="file" accept=".html,.htm,text/html" hidden onChange={(e) => uploadDemo(e.target.files?.[0])} />
            <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" disabled={!!needSlug || demo.kind === "busy"} onClick={() => demoInput.current?.click()}>{demo.kind === "busy" ? "Uploading…" : "Upload .html"}</button>
            {f.embedUrl && <a className="xk-btn xk-btn-ghost xk-btn-sm" href={f.embedUrl} target="_blank" rel="noopener">Open ↗</a>}
            {f.embedUrl && <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => set("embedUrl", "")}>Clear</button>}
          </div>
          <span className="xk-field-hint">Embed URL, or upload a self-contained demo/artifact HTML. Uploaded demos are served from /demos/&lt;slug&gt; in a sandbox.</span>
          <StatusText status={demo} />
        </div>
        <div className="xk-field">
          <span>Screens</span>
          <div className="xk-repeat">
            {f.screens.map((s, i) => (
              <div key={i} className="xk-order-item" style={{ gridTemplateColumns: "56px minmax(0,1fr) auto" }}>
                <img src={s.src} alt="" />
                <input value={s.alt} onChange={(e) => set("screens", f.screens.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} placeholder="Alt text" style={{ padding: "6px 10px", border: "1px solid var(--border-strong)", borderRadius: 8, background: "var(--bg)", color: "var(--ink)" }} />
                <div className="xk-admin-actions">
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => set("screens", move(f.screens, i, -1))}>↑</button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === f.screens.length - 1} onClick={() => set("screens", move(f.screens, i, 1))}>↓</button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Remove" onClick={() => set("screens", f.screens.filter((_, k) => k !== i))}><Icon name="x" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="xk-admin-upload-row">
            <input ref={screensInput} type="file" accept="image/*" multiple hidden onChange={(e) => uploadScreens(e.target.files)} />
            <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" disabled={!!needSlug || screensState.kind === "busy"} onClick={() => screensInput.current?.click()}><Icon name="plus" />Upload screens</button>
            <StatusText status={screensState} />
          </div>
        </div>
      </section>

      <section className="xk-admin-panel">
        <h2>Sections</h2>
        <div className="xk-repeat">
          {f.sections.map((s, i) => (
            <div key={i} className="xk-repeat-item">
              <div className="xk-repeat-head">
                <span className="xk-label">Section {i + 1}</span>
                <div className="xk-admin-actions">
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => set("sections", move(f.sections, i, -1))}>↑</button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === f.sections.length - 1} onClick={() => set("sections", move(f.sections, i, 1))}>↓</button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Remove section" onClick={() => set("sections", f.sections.filter((_, k) => k !== i))}><Icon name="x" /></button>
                </div>
              </div>
              <div className="xk-field-row">
                <Text label="Title" value={s.title} onChange={(v) => set("sections", f.sections.map((x, k) => (k === i ? { ...x, title: v } : x)))} />
                <Text label="Anchor id" value={s.id} onChange={(v) => set("sections", f.sections.map((x, k) => (k === i ? { ...x, id: slugify(v) } : x)))} mono hint={`#${s.id || slugify(s.title) || "…"} · "approach" adds the AI callout on AI projects`} />
              </div>
              <Area label="Body" value={s.body} onChange={(v) => set("sections", f.sections.map((x, k) => (k === i ? { ...x, body: v } : x)))} rows={5} hint="Paragraphs separated by a blank line" />
            </div>
          ))}
          <div><button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => set("sections", [...f.sections, { id: "", title: "", body: "" }])}><Icon name="plus" />Add section</button></div>
        </div>
      </section>

      <section className="xk-admin-panel">
        <h2>FAQ</h2>
        <div className="xk-repeat">
          {f.faq.map((q, i) => (
            <div key={i} className="xk-repeat-item">
              <div className="xk-repeat-head">
                <span className="xk-label">Question {i + 1}</span>
                <div className="xk-admin-actions">
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => set("faq", move(f.faq, i, -1))}>↑</button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === f.faq.length - 1} onClick={() => set("faq", move(f.faq, i, 1))}>↓</button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Remove question" onClick={() => set("faq", f.faq.filter((_, k) => k !== i))}><Icon name="x" /></button>
                </div>
              </div>
              <Text label="Question" value={q.q} onChange={(v) => set("faq", f.faq.map((x, k) => (k === i ? { ...x, q: v } : x)))} />
              <Area label="Answer" value={q.a} onChange={(v) => set("faq", f.faq.map((x, k) => (k === i ? { ...x, a: v } : x)))} rows={2} />
            </div>
          ))}
          <div><button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => set("faq", [...f.faq, { q: "", a: "" }])}><Icon name="plus" />Add question</button></div>
        </div>
      </section>

      <div className="xk-admin-bar">
        <div className="xk-admin-actions">
          <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={pending} onClick={save}>{savedSlug ? "Save project" : "Create project"}</button>
          {savedSlug && inDb && <ConfirmButton label="Delete" question="Delete this project?" onConfirm={remove} disabled={pending} />}
        </div>
        <div className="xk-admin-actions">
          {dirty && status.kind !== "busy" && <span className="xk-admin-msg">Unsaved changes</span>}
          <StatusText status={status} />
        </div>
      </div>
    </div>
  );
}
