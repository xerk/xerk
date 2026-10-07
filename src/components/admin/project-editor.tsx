"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { deleteProject, importDemo, saveProject } from "@/app/[console]/actions";
import { Icon } from "@/components/xerk/icon";
import { useAdminHref } from "@/components/admin/base";
import { cx } from "@/lib/utils";
import { Chip } from "./ui";
import { slugify } from "./shared";
import { Sheet, SheetFooter, useConfirm, useToast } from "./sheet";
import { MultiUploader, Uploader } from "./uploader";
import { AreaField, ChipInput, Disclosure, Kbd, LinesField, SaveState, SlugField, Switch, Tabs, TextField, type SaveStatus, useSaveShortcut, useUnsavedGuard } from "./form";

type Section = { id: string; title: string; body: string };
type Faq = { q: string; a: string };
type Metric = { value: string; label: string; hint: string };
type Form = {
  slug: string; code: string; title: string; world: string; company: string; period: string; role: string;
  summary: string; answer: string; takeaways: string[]; boss: string; big: string; bigLabel: string;
  image: string; video: string; embedUrl: string; url: string; ai: boolean; featured: boolean;
  stack: string[]; metrics: Metric[]; sections: Section[]; faq: Faq[]; screens: { src: string; alt: string }[];
  updated: string;
};

function toForm(p: Project): Form {
  return {
    slug: p.slug, code: p.code, title: p.title, world: p.world || "", company: p.company || "", period: p.period || "", role: p.role || "",
    summary: p.summary || "", answer: p.answer || "", takeaways: p.takeaways || [], boss: p.boss || "", big: p.big || "", bigLabel: p.bigLabel || "",
    image: p.image || "", video: p.video || "", embedUrl: p.embedUrl || "", url: p.url || "", ai: !!p.ai, featured: !!p.featured,
    stack: p.stack || [], metrics: (p.metrics || []).map((m) => ({ value: m.value, label: m.label, hint: m.hint || "" })),
    sections: (p.sections || []).map((s) => ({ id: s.id, title: s.title, body: s.body.join("\n\n") })), faq: p.faq || [], screens: p.screens || [], updated: p.updated || "",
  };
}

function toProject(f: Form, fallbackCode: string): Project {
  const opt = (s: string) => s.trim() || undefined;
  const screens = f.screens.filter((s) => s.src.trim());
  return {
    slug: f.slug.trim() || slugify(f.title), code: f.code.trim() || fallbackCode, title: f.title.trim(), world: f.world.trim(), company: f.company.trim(), period: f.period.trim(), role: f.role.trim(),
    summary: f.summary.trim(), answer: f.answer.trim(), takeaways: f.takeaways, boss: f.boss.trim(),
    big: opt(f.big), bigLabel: opt(f.bigLabel), image: opt(f.image), video: opt(f.video), embedUrl: opt(f.embedUrl), url: opt(f.url),
    ai: f.ai || undefined, featured: f.featured || undefined,
    screens: screens.length ? screens.map((s) => ({ src: s.src.trim(), alt: s.alt.trim() })) : undefined,
    stack: f.stack,
    metrics: f.metrics.filter((m) => m.value.trim()).map((m) => ({ value: m.value.trim(), label: m.label.trim(), ...(m.hint.trim() ? { hint: m.hint.trim() } : {}) })),
    sections: f.sections.filter((s) => s.title.trim() || s.body.trim()).map((s) => ({ id: s.id.trim() || slugify(s.title), title: s.title.trim(), body: s.body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean) })),
    faq: f.faq.filter((q) => q.q.trim()).map((q) => ({ q: q.q.trim(), a: q.a.trim() })),
    updated: f.updated,
  };
}

const TABS = [{ id: "basics", label: "Basics" }, { id: "story", label: "Story" }, { id: "media", label: "Media" }, { id: "seo", label: "SEO & FAQ" }] as const;
type TabId = (typeof TABS)[number]["id"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const move = <T,>(list: T[], i: number, d: number) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; };

export function ProjectEditor({ initial, isNew, published: initialPublished, inDb: initialInDb, allStack = [] }: { initial: Project; isNew: boolean; published: boolean; inDb: boolean; allStack?: string[] }) {
  const router = useRouter();
  const ah = useAdminHref();
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const [f, setF] = useState<Form>(() => toForm(initial));
  const [published, setPublished] = useState(initialPublished);
  const [savedSlug, setSavedSlug] = useState<string | undefined>(isNew ? undefined : initial.slug);
  const [inDb, setInDb] = useState(initialInDb);
  const [slugAuto, setSlugAuto] = useState(isNew || !initial.slug);
  const [tab, setTab] = useState<TabId>("basics");
  const [status, setStatus] = useState<SaveStatus>({ state: "clean" });
  const [section, setSection] = useState<{ i: number; v: Section } | null>(null);
  const [faq, setFaq] = useState<{ i: number; v: Faq } | null>(null);
  const [titleError, setTitleError] = useState("");
  const version = useRef(0);
  const saving = useRef(false);
  const fallbackCode = initial.code || "1-1";
  useUnsavedGuard(status.state === "dirty" || status.state === "error");

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    version.current++;
    setStatus({ state: "dirty" });
    if (k === "title") setTitleError("");
    setF((p) => ({ ...p, [k]: v, ...(k === "title" && slugAuto ? { slug: slugify(String(v)) } : {}) }));
  };

  const save = async (override?: Partial<Form>, nextPublished = published) => {
    if (saving.current) return false;
    const form = { ...f, ...override };
    if (!form.title.trim()) { setTab("basics"); setTitleError("A title is the only thing needed to save."); return false; }
    const project = toProject(form, fallbackCode);
    if (!SLUG_RE.test(project.slug)) { setTab("seo"); toast.error("The URL needs letters or numbers", "Edit it under SEO & FAQ."); return false; }
    saving.current = true;
    const v = version.current;
    setStatus({ state: "saving" });
    const r = await saveProject({ originalSlug: savedSlug, project, published: nextPublished }).catch((e) => ({ ok: false as const, error: String(e) }));
    saving.current = false;
    if (!r.ok || !r.data) { setStatus({ state: "error", error: r.ok ? "" : r.error }); toast.error("Couldn't save", r.ok ? undefined : r.error); return false; }
    setInDb(true);
    setF((p) => ({ ...p, slug: project.slug, code: project.code }));
    setStatus(version.current === v ? { state: "saved", at: Date.now() } : { state: "dirty" });
    toast.ok(isNew && !savedSlug ? "Project created" : "Saved", nextPublished ? `Live at /work/${project.slug}` : "Hidden from the site");
    if (r.data.slug !== savedSlug) { setSavedSlug(r.data.slug); router.replace(ah(`/projects/${r.data.slug}`)); } else router.refresh();
    return true;
  };
  useSaveShortcut(() => save());

  const togglePublished = async (v: boolean) => {
    setPublished(v);
    if (inDb && savedSlug) { const ok = await save(undefined, v); if (!ok) setPublished(!v); }
    else { version.current++; setStatus({ state: "dirty" }); }
  };

  /** Apply a sheet edit, then save right away when the project already exists (one action, not two). */
  const applyAndSave = async (patch: Partial<Form>) => {
    version.current++;
    setF((p) => ({ ...p, ...patch }));
    if (inDb && savedSlug) return save(patch);
    setStatus({ state: "dirty" });
    return true;
  };

  const remove = async () => {
    if (!savedSlug) return;
    if (!(await confirm({ title: `Delete “${f.title || savedSlug}”?`, body: "It disappears from /work and the level select. This can't be undone.", confirmLabel: "Delete", danger: true }))) return;
    const r = await deleteProject(savedSlug);
    if (!r.ok) { toast.error("Couldn't delete", r.error); return; }
    setStatus({ state: "clean" });
    toast.ok("Project deleted");
    router.push(ah("/projects"));
  };

  const folder = `projects/${f.slug || "untitled"}`;
  const needSlug = f.slug ? undefined : "Add a title first";
  const counts: Record<TabId, number> = {
    basics: 0,
    story: f.sections.length + f.metrics.length,
    media: [f.image, f.video, f.embedUrl].filter(Boolean).length + f.screens.length,
    seo: f.faq.length,
  };

  return (
    <div className="xk-editor">
      <div className="xk-editor-top">
        <div className="xk-editor-top-start">
          <Link href={ah("/projects")} className="xk-iconbtn-sm" aria-label="Back to projects" title="Back to projects"><Icon name="arrow-left" /></Link>
          <span className="xk-editor-crumb"><Link href={ah("/projects")} className="xk-admin-crumb">Projects</Link><span aria-hidden>/</span><b>{f.title || "Untitled"}</b></span>
          <SaveState status={status} />
          {savedSlug && !inDb && <Chip dot tone="agent" title="Saving copies it to Supabase">static data</Chip>}
        </div>
        <div className="xk-editor-top-end">
          <label className="xk-switch xk-editor-live" title={published ? "Visible on the site" : "Hidden from the site"}><input type="checkbox" role="switch" checked={published} onChange={(e) => togglePublished(e.target.checked)} />{published ? "Live" : "Hidden"}</label>
          {savedSlug && published && inDb && <a className="xk-btn xk-btn-ghost xk-btn-sm xk-hide-sm" href={`/work/${savedSlug}`} target="_blank" rel="noopener"><Icon name="arrow-square-out" />View</a>}
          <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={status.state === "saving"} onClick={() => save()} title="Save (Ctrl/⌘+S)"><Icon name="check" />{savedSlug ? "Save" : "Create"}</button>
        </div>
      </div>

      <div className="xk-editor-main is-wide">
        <textarea className="xk-editor-title" rows={1} value={f.title} onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))} placeholder="Project title" aria-label="Title" aria-invalid={!!titleError} autoFocus={isNew} />
        {titleError ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{titleError}</span> : <p className="xk-editor-hint">Only the title is required. Fill the rest whenever you like; empty fields are simply left off the page. <span className="xk-hide-sm"><Kbd k="S" /> saves.</span></p>}

        <div className="xk-editor-modebar">
          <Tabs label="Project sections" value={tab} onChange={setTab} items={TABS.map((t) => ({ id: t.id, label: t.label, badge: counts[t.id] ? <span className="xk-admin-count">{counts[t.id]}</span> : undefined }))} />
          {savedSlug && inDb && <button type="button" className="xk-linkbtn xk-danger-link" onClick={remove}>Delete project</button>}
        </div>

        {tab === "basics" && (
          <section className="xk-editor-section" aria-label="Basics">
            <AreaField label="Summary" value={f.summary} onChange={(v) => set("summary", v)} rows={2} count={200} placeholder="What it is and why it mattered, in a sentence or two" hint="Shown on cards and the case study intro" />
            <ChipInput label="Stack" value={f.stack} onChange={(v) => set("stack", v)} suggestions={allStack} placeholder="Node.js, Postgres… press Enter" />
            <div className="xk-field-row is-3">
              <TextField label="Company" value={f.company} onChange={(v) => set("company", v)} placeholder="Acme" />
              <TextField label="Role" value={f.role} onChange={(v) => set("role", v)} placeholder="Tech lead" />
              <TextField label="Period" value={f.period} onChange={(v) => set("period", v)} placeholder="2024 — Now" />
            </div>
            <div className="xk-switch-group">
              <Switch label="Featured" hint="Pinned on the home page" checked={f.featured} onChange={(v) => set("featured", v)} />
              <Switch label="AI project" hint="Adds the AI badge and approach callout" checked={f.ai} onChange={(v) => set("ai", v)} />
            </div>
            <Disclosure title="Level select & links" summary={[f.code, f.world].filter(Boolean).join(" · ") || "optional"}>
              <div className="xk-field-row">
                <TextField label="Stage code" value={f.code} onChange={(v) => set("code", v)} placeholder={fallbackCode} mono hint="Position in the level select, e.g. 1-7" />
                <TextField label="World" value={f.world} onChange={(v) => set("world", v)} placeholder="Enterprise · AI" />
              </div>
              <TextField label="Live site URL" type="url" value={f.url} onChange={(v) => set("url", v)} placeholder="https://…" />
            </Disclosure>
          </section>
        )}

        {tab === "story" && (
          <>
            <section className="xk-editor-section" aria-label="Headline numbers">
              <header><h2>The hook</h2><p>The challenge in one line and the number people remember.</p></header>
              <TextField label="Boss (the hard problem)" value={f.boss} onChange={(v) => set("boss", v)} placeholder="100,000 sockets that can't drop" />
              <div className="xk-field-row">
                <TextField label="Big number" value={f.big} onChange={(v) => set("big", v)} placeholder="100K+" />
                <TextField label="Label" value={f.bigLabel} onChange={(v) => set("bigLabel", v)} placeholder="concurrent devices" />
              </div>
              <div className="xk-field">
                <span>Metrics</span>
                <div className="xk-metrics">
                  {f.metrics.map((m, i) => (
                    <div key={i} className="xk-metric-row">
                      <input className="xk-admin-input is-mono" value={m.value} onChange={(e) => set("metrics", f.metrics.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} placeholder="45%" aria-label={`Metric ${i + 1} value`} />
                      <input className="xk-admin-input" value={m.label} onChange={(e) => set("metrics", f.metrics.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder="faster p95" aria-label={`Metric ${i + 1} label`} />
                      <input className="xk-admin-input" value={m.hint} onChange={(e) => set("metrics", f.metrics.map((x, k) => (k === i ? { ...x, hint: e.target.value } : x)))} placeholder="Hint (optional)" aria-label={`Metric ${i + 1} hint`} />
                      <button type="button" className="xk-iconbtn-sm is-danger" aria-label={`Remove metric ${i + 1}`} onClick={() => set("metrics", f.metrics.filter((_, k) => k !== i))}><Icon name="trash" /></button>
                    </div>
                  ))}
                  <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => set("metrics", [...f.metrics, { value: "", label: "", hint: "" }])}><Icon name="plus" />Add metric</button>
                </div>
              </div>
              <LinesField label="Takeaways" value={f.takeaways} onChange={(v) => set("takeaways", v)} rows={3} hint="One per line" placeholder={"Reconnects are the real load test\nBackpressure beats bigger boxes"} />
            </section>
            <section className="xk-editor-section" aria-label="Sections">
              <header><h2>Case study</h2><p>The body of /work/{f.slug || "…"}, one section at a time.</p></header>
              <ul className="xk-list">
                {f.sections.length === 0 && <li className="xk-list-empty">No sections yet. A good default: The problem, Approach, Results.</li>}
                {f.sections.map((s, i) => (
                  <li key={i} className="xk-list-item">
                    <button type="button" className="xk-list-row" onClick={() => setSection({ i, v: s })}>
                      <span className="xk-list-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="xk-list-main"><strong>{s.title || "Untitled section"}</strong><span className="xk-list-text">{s.body.trim() ? s.body.slice(0, 220) : "Empty. Click to write it."}</span></span>
                      <span className="xk-list-side"><Icon name="caret-right" /></span>
                    </button>
                    <span className="xk-list-tools">
                      <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => set("sections", move(f.sections, i, -1))}><Icon name="arrow-up" /></button>
                      <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === f.sections.length - 1} onClick={() => set("sections", move(f.sections, i, 1))}><Icon name="arrow-down" /></button>
                    </span>
                  </li>
                ))}
                <li><button type="button" className="xk-list-add" onClick={() => setSection({ i: -1, v: { id: "", title: "", body: "" } })}><Icon name="plus-circle" />Add section</button></li>
              </ul>
            </section>
          </>
        )}

        {tab === "media" && (
          <section className="xk-editor-section" aria-label="Media">
            <div className="xk-field-row">
              <Uploader label="Cover image" value={f.image} onChange={(v) => set("image", v)} folder={folder} fixedName="cover" disabledReason={needSlug} hint="Cards, the case study hero and social previews" />
              <Uploader label="Preview loop" kind="video" value={f.video} onChange={(v) => set("video", v)} folder={folder} fixedName="preview" disabledReason={needSlug} hint="Short muted MP4 that plays on hover" />
            </div>
            <MultiUploader label="Screens" value={f.screens} onChange={(v) => set("screens", v)} folder={`${folder}/screens`} disabledReason={needSlug} defaultAlt={`${f.title || "Project"} screenshot`} hint="Drag to reorder. Alt text helps screen readers and SEO." />
            <Disclosure title="Interactive demo" summary={f.embedUrl ? "attached" : "optional"} defaultOpen={!!f.embedUrl}>
              <Uploader
                label="Demo"
                kind="html"
                value={f.embedUrl}
                onChange={(v) => set("embedUrl", v)}
                folder={folder}
                fixedName="demo"
                disabledReason={needSlug}
                aspect="doc"
                onUploaded={async (path) => {
                  const r = await importDemo(f.slug, path);
                  if (!r.ok || !r.data) throw new Error(r.ok ? "Import failed" : r.error);
                  toast.ok("Demo stored", `Served at ${r.data.embedUrl}. Save the project to use it.`);
                  return r.data.embedUrl;
                }}
                hint="Upload a self-contained .html (served sandboxed from /demos/<slug>) or paste an embed URL"
              />
            </Disclosure>
          </section>
        )}

        {tab === "seo" && (
          <>
            <section className="xk-editor-section" aria-label="Search">
              <header><h2>Search & AI answers</h2><p>How the page shows up in Google, link previews and llms.txt.</p></header>
              <SlugField prefix="/work/" value={f.slug} auto={slugAuto} onEdit={(v) => { setSlugAuto(false); set("slug", slugify(v) + (v.endsWith("-") ? "-" : "")); }} />
              <AreaField label="Answer (TL;DR)" value={f.answer} onChange={(v) => set("answer", v)} rows={2} count={160} placeholder="Answer-first: what was built and the result" hint="Used in the TL;DR box, the meta description and llms.txt" />
            </section>
            <section className="xk-editor-section" aria-label="FAQ">
              <header><h2>FAQ</h2><p>Shown at the end of the case study and as FAQ structured data.</p></header>
              <ul className="xk-list">
                {f.faq.length === 0 && <li className="xk-list-empty">No questions yet.</li>}
                {f.faq.map((q, i) => (
                  <li key={i} className="xk-list-item">
                    <button type="button" className="xk-list-row" onClick={() => setFaq({ i, v: q })}>
                      <span className="xk-list-num">Q{i + 1}</span>
                      <span className="xk-list-main"><strong>{q.q || "Untitled question"}</strong><span className="xk-list-text">{q.a || "No answer yet"}</span></span>
                      <span className="xk-list-side"><Icon name="caret-right" /></span>
                    </button>
                    <span className="xk-list-tools">
                      <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => set("faq", move(f.faq, i, -1))}><Icon name="arrow-up" /></button>
                      <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === f.faq.length - 1} onClick={() => set("faq", move(f.faq, i, 1))}><Icon name="arrow-down" /></button>
                    </span>
                  </li>
                ))}
                <li><button type="button" className="xk-list-add" onClick={() => setFaq({ i: -1, v: { q: "", a: "" } })}><Icon name="plus-circle" />Add question</button></li>
              </ul>
            </section>
          </>
        )}
      </div>

      <ItemSheet
        open={!!section}
        title={section && section.i >= 0 ? "Edit section" : "New section"}
        initial={section?.v}
        canSave={(v) => !!(v.title.trim() || v.body.trim())}
        onClose={() => setSection(null)}
        onDelete={section && section.i >= 0 ? () => { const i = section.i; setSection(null); applyAndSave({ sections: f.sections.filter((_, k) => k !== i) }); } : undefined}
        onSave={async (v) => { const i = section!.i; const next = i >= 0 ? f.sections.map((x, k) => (k === i ? v : x)) : [...f.sections, v]; if (await applyAndSave({ sections: next })) setSection(null); }}
        render={(v, setV) => (
          <>
            <TextField label="Title" value={v.title} onChange={(t) => setV({ ...v, title: t })} placeholder="The problem" autoFocus />
            <AreaField label="Body" value={v.body} onChange={(t) => setV({ ...v, body: t })} rows={12} placeholder="Write it like you'd explain it to a peer. Leave a blank line between paragraphs." hint="Paragraphs are separated by a blank line" />
            <Disclosure title="Anchor link" summary={`#${v.id || slugify(v.title) || "…"}`}>
              <TextField label="Anchor id" value={v.id} onChange={(t) => setV({ ...v, id: slugify(t) })} mono placeholder={slugify(v.title) || "approach"} hint={'Defaults to the title. "approach" adds the AI callout on AI projects.'} />
            </Disclosure>
          </>
        )}
      />
      <ItemSheet
        open={!!faq}
        title={faq && faq.i >= 0 ? "Edit question" : "New question"}
        initial={faq?.v}
        canSave={(v) => !!v.q.trim()}
        onClose={() => setFaq(null)}
        onDelete={faq && faq.i >= 0 ? () => { const i = faq.i; setFaq(null); applyAndSave({ faq: f.faq.filter((_, k) => k !== i) }); } : undefined}
        onSave={async (v) => { const i = faq!.i; const next = i >= 0 ? f.faq.map((x, k) => (k === i ? v : x)) : [...f.faq, v]; if (await applyAndSave({ faq: next })) setFaq(null); }}
        render={(v, setV) => (
          <>
            <TextField label="Question" value={v.q} onChange={(t) => setV({ ...v, q: t })} placeholder="How did you keep reconnects from melting the cluster?" autoFocus />
            <AreaField label="Answer" value={v.a} onChange={(t) => setV({ ...v, a: t })} rows={6} placeholder="Two or three plain sentences." />
          </>
        )}
      />
      {confirmNode}
    </div>
  );
}

/** Generic sheet for editing one item of a list with its own draft state and dirty guard. */
function ItemSheet<T extends object>({ open, title, initial, onClose, onSave, onDelete, render, canSave }: { open: boolean; title: string; initial?: T; onClose: () => void; onSave: (v: T) => Promise<void> | void; onDelete?: () => void; render: (v: T, set: (v: T) => void) => React.ReactNode; canSave: (v: T) => boolean }) {
  const [v, setV] = useState<T | undefined>(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setV(initial); }, [open, initial]);
  const dirty = !!v && !!initial && JSON.stringify(v) !== JSON.stringify(initial);
  const submit = async () => { if (!v || !canSave(v)) return; setBusy(true); await onSave(v); setBusy(false); };
  return (
    <Sheet open={open} onClose={onClose} title={title} size="lg" dirty={dirty && !busy}
      footer={<SheetFooter start={onDelete && <button type="button" className="xk-btn xk-btn-danger xk-btn-sm" onClick={onDelete}><Icon name="trash" />Remove</button>}>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={busy || !v || !canSave(v)} onClick={submit}>{busy ? "Saving…" : "Save"}</button>
      </SheetFooter>}>
      <form className="xk-sheet-section" onSubmit={(e) => { e.preventDefault(); submit(); }}>{v && render(v, setV)}</form>
    </Sheet>
  );
}

/* ---------- Quick create ---------- */

export function NewProjectSheet({ open, onClose, nextCode }: { open: boolean; onClose: () => void; nextCode: string }) {
  const router = useRouter();
  const ah = useAdminHref();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setTitle(""); setSummary(""); setError(""); } }, [open]);
  const slug = slugify(title);
  const create = async () => {
    if (!title.trim()) { setError("Give it a title. You can change it later."); return; }
    if (!slug) { setError("The title needs some letters or numbers."); return; }
    setBusy(true);
    const base: Project = { slug, code: nextCode, title: title.trim(), world: "", company: "", period: "", role: "", summary: summary.trim(), answer: "", takeaways: [], boss: "", stack: [], metrics: [], sections: [{ id: "problem", title: "The problem", body: [] }, { id: "approach", title: "Approach", body: [] }, { id: "results", title: "Results", body: [] }], faq: [], updated: "" };
    let r: Awaited<ReturnType<typeof saveProject>> | null = null;
    for (const s of [slug, `${slug}-2`, `${slug}-${Date.now().toString(36).slice(-4)}`]) {
      r = await saveProject({ project: { ...base, slug: s }, published: false });
      if (r.ok || !/already exists/.test(r.error)) break;
    }
    setBusy(false);
    if (!r?.ok || !r.data) { setError(r && !r.ok ? r.error : "Couldn't create it"); return; }
    toast.ok("Project created", "Hidden until you switch it live.");
    onClose();
    router.push(ah(`/projects/${r.data.slug}`));
  };
  return (
    <Sheet open={open} onClose={onClose} size="sm" title="New project" description="A title is enough to start. It stays hidden until you switch it live." dirty={!!(title.trim() || summary.trim()) && !busy}
      footer={<><button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={onClose}>Cancel</button><button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={busy} onClick={create}>{busy ? "Creating…" : <>Create<Icon name="arrow-right" /></>}</button></>}>
      <form className="xk-sheet-section" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <label className={cx("xk-field", error && "has-error")}>
          <span>Title</span>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="Realtime device platform" data-autofocus autoComplete="off" />
          {error ? <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{error}</span> : <span className="xk-field-hint">URL: /work/{slug || "…"} · stage {nextCode}</span>}
        </label>
        <AreaField label="Summary (optional)" value={summary} onChange={setSummary} rows={3} placeholder="One or two sentences" />
      </form>
    </Sheet>
  );
}
