"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetContent, saveContent } from "@/app/[console]/actions";
import { Icon } from "@/components/xerk/icon";
import type { Profile } from "@/lib/content";
import type { Quest, Social } from "@/data/profile";
import { cx } from "@/lib/utils";
import { Chip, EmptyState, PageHeader } from "./ui";
import { Sheet, SheetFooter, useConfirm, useToast } from "./sheet";
import { Uploader } from "./uploader";
import { AreaField, ChipInput, Disclosure, Kbd, LinesField, SaveState, Switch, Tabs, TextField, type SaveStatus, useSaveShortcut, useUnsavedGuard } from "./form";

const move = <T,>(list: T[], i: number, d: number) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; };
const savedAt = (iso?: string) => (iso ? `Last saved ${new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}` : "Using the built-in defaults");

/** Save one site_content key with toast feedback. Returns ok. */
function useContentSaver() {
  const router = useRouter();
  const toast = useToast();
  return async (key: string, value: unknown, okTitle = "Saved", undo?: () => void) => {
    const r = await saveContent(key, value).catch((e) => ({ ok: false as const, error: String(e) }));
    if (!r.ok) { toast.error("Couldn't save", r.error); return false; }
    if (undo) toast.push({ tone: "ok", title: okTitle, body: "The site is updating.", action: { label: "Undo", run: undo } });
    else toast.ok(okTitle, "The site is updating.");
    router.refresh();
    return true;
  };
}

function ResetButton({ sectionKey, label, onDone }: { sectionKey: string | string[]; label: string; onDone?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, node] = useConfirm();
  const run = async () => {
    if (!(await confirm({ title: `Reset ${label}?`, body: "Your saved version is replaced by the defaults built into the code.", confirmLabel: "Reset", danger: true }))) return;
    for (const k of Array.isArray(sectionKey) ? sectionKey : [sectionKey]) {
      const r = await resetContent(k);
      if (!r.ok) { toast.error("Couldn't reset", r.error); return; }
    }
    toast.ok(`${label} reset to defaults`);
    onDone?.();
    router.refresh();
  };
  return <><button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={run}><Icon name="arrows-clockwise" />Reset to defaults</button>{node}</>;
}

/* ---------- Profile ---------- */

const BRANDS: Social["brand"][] = ["linkedin", "github", "x", "telegram", "upwork"];
const BRAND_LABEL: Record<Social["brand"], string> = { linkedin: "LinkedIn", github: "GitHub", x: "X", telegram: "Telegram", upwork: "Upwork" };
const PROFILE_TABS = [{ id: "identity", label: "Identity" }, { id: "contact", label: "Availability" }, { id: "background", label: "Background" }, { id: "links", label: "Links" }] as const;
type ProfileTab = (typeof PROFILE_TABS)[number]["id"];

export function ProfileEditor({ initial, socials: initialSocials, updatedAt }: { initial: Profile; socials: Social[]; updatedAt?: string }) {
  const router = useRouter();
  const toast = useToast();
  const saveKey = useContentSaver();
  const [p, setP] = useState<Profile>(initial);
  const [socials, setSocials] = useState<Social[]>(initialSocials);
  const [tab, setTab] = useState<ProfileTab>("identity");
  const [status, setStatus] = useState<SaveStatus>({ state: "clean" });
  const [link, setLink] = useState<{ i: number; v: Social } | null>(null);
  useEffect(() => setSocials(initialSocials), [initialSocials]);
  useUnsavedGuard(status.state === "dirty");
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setStatus({ state: "dirty" }); setP((x) => ({ ...x, [k]: v })); };
  const setEdu = (k: keyof Profile["education"], v: string) => set("education", { ...p.education, [k]: v });

  const save = async () => {
    for (const f of ["name", "title", "headline", "email"] as const) if (!String(p[f] || "").trim()) { setTab(f === "email" ? "contact" : "identity"); toast.error(`${f[0].toUpperCase() + f.slice(1)} is required`); return; }
    setStatus({ state: "saving" });
    const r = await saveContent("profile", { ...p, years: Number(p.years) || 0 }).catch((e) => ({ ok: false as const, error: String(e) }));
    if (!r.ok) { setStatus({ state: "error", error: r.error }); toast.error("Couldn't save", r.error); return; }
    setStatus({ state: "saved", at: Date.now() });
    toast.ok("Profile saved", "The site is updating.");
    router.refresh();
  };
  useSaveShortcut(save);

  const persistSocials = async (next: Social[], title: string, prev?: Social[]) => {
    setSocials(next);
    const ok = await saveKey("socials", next, title, prev ? () => { setSocials(prev); saveKey("socials", prev, "Restored"); } : undefined);
    if (!ok) setSocials(socials);
    return ok;
  };

  return (
    <>
      <PageHeader eyebrow="Content" title="Profile" description="Name, headline, availability and links. Used on every page, in SEO data, llms.txt and Ask my CV." meta={<Chip outline>{savedAt(updatedAt)}</Chip>} actions={<ResetButton sectionKey={["profile", "socials"]} label="Profile" onDone={() => setStatus({ state: "clean" })} />} />
      <Tabs label="Profile sections" value={tab} onChange={setTab} items={PROFILE_TABS.map((t) => ({ ...t, badge: t.id === "links" ? <span className="xk-admin-count">{socials.length}</span> : undefined }))} />

      {tab === "identity" && (
        <section className="xk-editor-section">
          <div className="xk-profile-id">
            <Uploader label="Avatar" value={p.avatar} onChange={(v) => set("avatar", v)} folder="profile" aspect="square" compact allowUrl={false} />
            <div className="xk-sheet-section">
              <div className="xk-field-row">
                <TextField label="Name" required value={p.name} onChange={(v) => set("name", v)} />
                <TextField label="Handle" value={p.handle} onChange={(v) => set("handle", v)} mono />
              </div>
              <TextField label="Title" required value={p.title} onChange={(v) => set("title", v)} placeholder="Senior Full-Stack & AI Engineer" />
            </div>
          </div>
          <TextField label="Headline" required value={p.headline} onChange={(v) => set("headline", v)} hint="The big line on the home page" />
          <AreaField label="Intro" value={p.intro} onChange={(v) => set("intro", v)} rows={3} hint="First paragraph under the headline" />
          <Disclosure title="About (for search and AI)" summary={`${p.description.length} chars`}>
            <AreaField label="Description" value={p.description} onChange={(v) => set("description", v)} rows={5} hint="Third person. Used for SEO, JSON-LD, llms.txt and Ask my CV" />
            <TextField label="Years of experience" type="number" value={String(p.years)} onChange={(v) => set("years", Number(v))} />
          </Disclosure>
        </section>
      )}

      {tab === "contact" && (
        <section className="xk-editor-section">
          <Switch label="Open to new projects" hint="Shows the green availability badge" checked={p.available} onChange={(v) => set("available", v)} />
          <TextField label="Availability text" value={p.availability} onChange={(v) => set("availability", v)} placeholder="Available for new projects" />
          <div className="xk-field-row">
            <TextField label="Email" required type="email" value={p.email} onChange={(v) => set("email", v)} />
            <TextField label="Location" value={p.location} onChange={(v) => set("location", v)} />
          </div>
          <Disclosure title="Booking, Upwork, timezone" summary="optional">
            <TextField label="Booking link" type="url" value={p.bookingUrl || ""} onChange={(v) => set("bookingUrl", v)} placeholder="https://cal.com/…" hint="Empty: “Book a call” opens an email" />
            <TextField label="Upwork profile URL" type="url" value={p.upworkUrl || ""} onChange={(v) => set("upworkUrl", v)} placeholder="https://www.upwork.com/freelancers/~…" hint="Empty: Upwork buttons go to /hire" />
            <TextField label="Timezone" value={p.timezone} onChange={(v) => set("timezone", v)} mono />
          </Disclosure>
          <Uploader label="CV (PDF)" kind="pdf" value={p.cvPdf} onChange={(v) => set("cvPdf", v)} folder="profile" aspect="doc" compact />
        </section>
      )}

      {tab === "background" && (
        <section className="xk-editor-section">
          <TextField label="School" value={p.education.school} onChange={(v) => setEdu("school", v)} />
          <div className="xk-field-row">
            <TextField label="Degree" value={p.education.degree} onChange={(v) => setEdu("degree", v)} />
            <TextField label="Period" value={p.education.period} onChange={(v) => setEdu("period", v)} placeholder="2014 — 2018" />
          </div>
          <ChipInput label="Languages" value={p.languages} onChange={(v) => set("languages", v)} placeholder="Arabic (native), English (fluent)…" />
        </section>
      )}

      {tab === "links" && (
        <section className="xk-editor-section">
          <header><h2>Social links</h2><p>Each change saves right away. Upwork is added automatically from the Upwork URL under Availability.</p></header>
          <ul className="xk-list">
            {socials.length === 0 && <li className="xk-list-empty">No links yet.</li>}
            {socials.map((s, i) => (
              <li key={`${s.href}-${i}`} className="xk-list-item">
                <button type="button" className="xk-list-row" onClick={() => setLink({ i, v: s })}>
                  <span className="xk-list-thumb is-brand"><Icon brand={s.brand} /></span>
                  <span className="xk-list-main"><strong>{s.label || BRAND_LABEL[s.brand]}</strong><span className="xk-list-sub">{s.handle ? `${s.handle} · ` : ""}{s.href || "no URL"}</span></span>
                  <span className="xk-list-side"><Icon name="caret-right" /></span>
                </button>
                <span className="xk-list-tools">
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => persistSocials(move(socials, i, -1), "Order saved")}><Icon name="arrow-up" /></button>
                  <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === socials.length - 1} onClick={() => persistSocials(move(socials, i, 1), "Order saved")}><Icon name="arrow-down" /></button>
                </span>
              </li>
            ))}
            <li><button type="button" className="xk-list-add" onClick={() => setLink({ i: -1, v: { brand: "linkedin", label: "", href: "" } })}><Icon name="plus-circle" />Add link</button></li>
          </ul>
        </section>
      )}

      {tab !== "links" && (
        <div className="xk-admin-bar">
          <SaveState status={status} />
          <span className="xk-hide-sm xk-muted" style={{ fontSize: 12 }}><Kbd k="S" /> saves</span>
          <div className="xk-admin-actions">
            <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={status.state === "saving" || status.state === "clean" || status.state === "saved"} onClick={save}>{status.state === "saving" ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      )}

      <LinkSheet
        item={link}
        onClose={() => setLink(null)}
        onSave={async (v) => { const prev = socials; const next = link!.i >= 0 ? socials.map((x, k) => (k === link!.i ? v : x)) : [...socials, v]; if (await persistSocials(next, link!.i >= 0 ? "Link saved" : "Link added")) { setLink(null); void prev; } }}
        onDelete={async () => { const prev = socials; const i = link!.i; setLink(null); await persistSocials(socials.filter((_, k) => k !== i), "Link removed", prev); }}
      />
    </>
  );
}

function LinkSheet({ item, onClose, onSave, onDelete }: { item: { i: number; v: Social } | null; onClose: () => void; onSave: (v: Social) => Promise<void>; onDelete: () => void }) {
  const [v, setV] = useState<Social>({ brand: "linkedin", label: "", href: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (item) { setV(item.v); setErr(""); } }, [item]);
  const dirty = !!item && JSON.stringify(v) !== JSON.stringify(item.v);
  const submit = async () => {
    if (!/^https?:\/\/\S+\.\S+/.test(v.href.trim())) { setErr("Use a full link starting with https://"); return; }
    setBusy(true);
    await onSave({ ...v, href: v.href.trim(), label: v.label.trim() || BRAND_LABEL[v.brand], handle: v.handle?.trim() || undefined });
    setBusy(false);
  };
  return (
    <Sheet open={!!item} onClose={onClose} size="sm" title={item && item.i >= 0 ? "Edit link" : "Add link"} dirty={dirty && !busy}
      footer={<SheetFooter start={item && item.i >= 0 && <button type="button" className="xk-btn xk-btn-danger xk-btn-sm" onClick={onDelete}><Icon name="trash" />Remove</button>}>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</button>
      </SheetFooter>}>
      <form className="xk-sheet-section" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="xk-field">
          <span>Network</span>
          <div className="xk-brand-pick" role="radiogroup" aria-label="Network">
            {BRANDS.map((b) => <button key={b} type="button" role="radio" aria-checked={v.brand === b} onClick={() => setV({ ...v, brand: b })}><Icon brand={b} />{BRAND_LABEL[b]}</button>)}
          </div>
        </div>
        <TextField label="URL" required type="url" value={v.href} onChange={(t) => { setV({ ...v, href: t }); setErr(""); }} placeholder="https://linkedin.com/in/…" error={err} autoFocus />
        <div className="xk-field-row">
          <TextField label="Label" value={v.label} onChange={(t) => setV({ ...v, label: t })} placeholder={BRAND_LABEL[v.brand]} />
          <TextField label="Handle" value={v.handle || ""} onChange={(t) => setV({ ...v, handle: t })} placeholder="@xerk" />
        </div>
      </form>
    </Sheet>
  );
}

/* ---------- Experience ---------- */

const blankQuest = (): Quest => ({ company: "", role: "", where: "Remote", period: "", start: "", summary: "", objectives: [], loot: [], stack: [] });

export function ExperienceEditor({ initial, updatedAt }: { initial: Quest[]; updatedAt?: string }) {
  const saveKey = useContentSaver();
  const [list, setList] = useState<Quest[]>(initial);
  const [edit, setEdit] = useState<{ i: number; v: Quest } | null>(null);
  useEffect(() => setList(initial), [initial]);
  const allStack = [...new Set(list.flatMap((q) => q.stack))];

  const persist = async (next: Quest[], title: string, undoable = false) => {
    const prev = list;
    setList(next);
    const ok = await saveKey("experience", next, title, undoable ? () => { setList(prev); saveKey("experience", prev, "Restored"); } : undefined);
    if (!ok) setList(prev);
    return ok;
  };
  const addBtn = <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" onClick={() => setEdit({ i: -1, v: blankQuest() })}><Icon name="plus" />Add role</button>;

  return (
    <>
      <PageHeader eyebrow="Content" title="Experience" description="Your roles, newest first. Shown on the home page, /cv, /play and in Ask my CV. Every change saves right away." meta={<><Chip outline>{list.length} roles</Chip><Chip outline>{savedAt(updatedAt)}</Chip></>} actions={<><ResetButton sectionKey="experience" label="Experience" />{addBtn}</>} />
      {list.length === 0 ? <EmptyState icon="briefcase" title="No roles yet" actions={addBtn}>Add your current job first; the top role is shown as current.</EmptyState> : (
        <ul className="xk-list">
          {list.map((q, i) => (
            <li key={`${q.company}-${i}`} className="xk-list-item">
              <button type="button" className="xk-list-row" onClick={() => setEdit({ i, v: q })}>
                <span className="xk-list-thumb is-logo">{q.logo ? <img src={q.logo} alt="" /> : <Icon name="briefcase" />}</span>
                <span className="xk-list-main">
                  <strong>{q.role || "Role"} <span className="xk-muted" style={{ fontWeight: 400 }}>at</span> {q.company || "Company"}</strong>
                  <span className="xk-list-sub">{q.period || "No period"}{q.where ? ` · ${q.where}` : ""}</span>
                  {q.stack.length > 0 && <span className="xk-list-tags">{q.stack.slice(0, 5).map((t) => <Chip key={t} tag>{t}</Chip>)}{q.stack.length > 5 && <Chip tag outline>+{q.stack.length - 5}</Chip>}</span>}
                </span>
                <span className="xk-list-side">{q.status === "active" && <Chip dot tone="accent">current</Chip>}<Icon name="caret-right" /></span>
              </button>
              <span className="xk-list-tools">
                <button type="button" className="xk-iconbtn-sm" aria-label="Move up" disabled={i === 0} onClick={() => persist(move(list, i, -1), "Order saved")}><Icon name="arrow-up" /></button>
                <button type="button" className="xk-iconbtn-sm" aria-label="Move down" disabled={i === list.length - 1} onClick={() => persist(move(list, i, 1), "Order saved")}><Icon name="arrow-down" /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <RoleSheet
        item={edit}
        allStack={allStack}
        onClose={() => setEdit(null)}
        onSave={async (v) => { const i = edit!.i; const next = i >= 0 ? list.map((x, k) => (k === i ? v : x)) : [v, ...list]; if (await persist(next, i >= 0 ? "Role saved" : "Role added")) setEdit(null); }}
        onDelete={async () => { const i = edit!.i; setEdit(null); await persist(list.filter((_, k) => k !== i), "Role removed", true); }}
      />
    </>
  );
}

function RoleSheet({ item, onClose, onSave, onDelete, allStack }: { item: { i: number; v: Quest } | null; onClose: () => void; onSave: (v: Quest) => Promise<void>; onDelete: () => void; allStack: string[] }) {
  const [q, setQ] = useState<Quest>(blankQuest());
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (item) { setQ(item.v); setErrors({}); } }, [item]);
  const set = (patch: Partial<Quest>) => { setQ((x) => ({ ...x, ...patch })); setErrors({}); };
  const dirty = !!item && JSON.stringify(q) !== JSON.stringify(item.v);
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!q.company.trim()) e.company = "Required";
    if (!q.role.trim()) e.role = "Required";
    if (!q.period.trim()) e.period = "Required, e.g. 2024 — Now";
    if (Object.keys(e).length) { setErrors(e); return; }
    setBusy(true);
    await onSave({ ...q, company: q.company.trim(), role: q.role.trim(), period: q.period.trim() });
    setBusy(false);
  };
  return (
    <Sheet open={!!item} onClose={onClose} size="lg" title={item && item.i >= 0 ? `${item.v.role || "Role"} · ${item.v.company || "Company"}` : "Add role"} description={item && item.i < 0 ? "New roles go to the top of the list." : undefined} dirty={dirty && !busy}
      footer={<SheetFooter start={item && item.i >= 0 && <button type="button" className="xk-btn xk-btn-danger xk-btn-sm" onClick={onDelete}><Icon name="trash" />Remove</button>}>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={busy} onClick={submit}>{busy ? "Saving…" : item && item.i >= 0 ? "Save role" : "Add role"}</button>
      </SheetFooter>}>
      <form className="xk-sheet-section" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="xk-field-row">
          <TextField label="Role" required value={q.role} onChange={(v) => set({ role: v })} placeholder="Senior engineer" error={errors.role} autoFocus />
          <TextField label="Company" required value={q.company} onChange={(v) => set({ company: v })} error={errors.company} />
        </div>
        <div className="xk-field-row">
          <TextField label="Period" required value={q.period} onChange={(v) => set({ period: v })} placeholder="2024 — Now" error={errors.period} />
          <TextField label="Where" value={q.where} onChange={(v) => set({ where: v })} placeholder="Remote · US" />
        </div>
        <Switch label="Current role" hint="Shows the “current” badge" checked={q.status === "active"} onChange={(v) => set({ status: v ? "active" : undefined })} />
        <AreaField label="Summary" value={q.summary} onChange={(v) => set({ summary: v })} rows={2} hint="One or two sentences about the company or team" />
        <LinesField label="What I did" value={q.objectives} onChange={(v) => set({ objectives: v })} rows={5} hint="One achievement per line. The home page shows the first three" />
        <ChipInput label="Stack" value={q.stack} onChange={(v) => set({ stack: v })} suggestions={allStack} placeholder="Type and press Enter" />
      </form>
      <Disclosure title="Logo, dates and highlights" summary="optional" defaultOpen={!!q.logo}>
        <Uploader label="Company logo" value={q.logo || ""} onChange={(v) => set({ logo: v || undefined })} folder="experiences" aspect="square" compact hint="Square PNG or SVG works best" />
        <div className="xk-field-row">
          <TextField label="Start" value={q.start} onChange={(v) => set({ start: v })} mono placeholder="2024-03" hint="YYYY-MM, used for sorting and duration" />
          <TextField label="End" value={q.end || ""} onChange={(v) => set({ end: v || undefined })} mono placeholder="empty = now" />
        </div>
        <TextField label="Company website" type="url" value={q.url || ""} onChange={(v) => set({ url: v || undefined })} placeholder="https://…" />
        <LinesField label="Highlights (loot)" value={q.loot} onChange={(v) => set({ loot: v })} rows={2} hint="Short wins, one per line, e.g. “100K+ concurrent”" />
      </Disclosure>
    </Sheet>
  );
}

/* ---------- Site data: JSON sections, each in a sheet ---------- */

export type JsonSection = { key: string; label: string; help: string; value: unknown; updatedAt?: string };

const summarize = (v: unknown) => Array.isArray(v) ? `${v.length} item${v.length === 1 ? "" : "s"}` : v && typeof v === "object" ? `${Object.keys(v).length} keys` : "empty";

export function SiteDataEditor({ sections }: { sections: JsonSection[] }) {
  const [open, setOpen] = useState<JsonSection | null>(null);
  return (
    <>
      <PageHeader eyebrow="System" title="Site data" description="Everything else the site shows. Pick a section to edit it as JSON; it's checked before saving, and Reset brings back the built-in version." />
      <ul className="xk-list">
        {sections.map((s) => (
          <li key={s.key}>
            <button type="button" className="xk-list-row" onClick={() => setOpen(s)}>
              <span className="xk-list-thumb is-icon"><Icon name="database" /></span>
              <span className="xk-list-main"><strong>{s.label}</strong><span className="xk-list-text">{s.help}</span></span>
              <span className="xk-list-side"><Chip outline>{summarize(s.value)}</Chip><Chip dot tone={s.updatedAt ? "accent" : "neutral"}>{s.updatedAt ? "custom" : "default"}</Chip><Icon name="caret-right" /></span>
            </button>
          </li>
        ))}
      </ul>
      <JsonSheet section={open} onClose={() => setOpen(null)} />
    </>
  );
}

function JsonSheet({ section, onClose }: { section: JsonSection | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(section);
  if (section && section !== last) { setLast(section); setText(JSON.stringify(section.value, null, 2)); }
  const s = section || last;
  const original = s ? JSON.stringify(s.value, null, 2) : "";
  let parsed: unknown, parseError = "";
  try { parsed = JSON.parse(text || "null"); } catch (e) { parseError = e instanceof Error ? e.message : "Invalid JSON"; }
  const dirty = text !== original;
  const save = async () => {
    if (!s || parseError) return;
    setBusy(true);
    const r = await saveContent(s.key, parsed).catch((e) => ({ ok: false as const, error: String(e) }));
    setBusy(false);
    if (!r.ok) { toast.error("Couldn't save", r.error); return; }
    toast.ok(`${s.label} saved`, "The site is updating.");
    onClose();
    router.refresh();
  };
  return (
    <Sheet open={!!section} onClose={onClose} size="xl" title={s?.label || ""} description={s?.help} dirty={dirty && !busy}
      footer={s && <SheetFooter start={<><ResetButton sectionKey={s.key} label={s.label} onDone={onClose} />{!parseError && <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => setText(JSON.stringify(parsed, null, 2))}>Format</button>}</>}>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={busy || !!parseError || !dirty} onClick={save}>{busy ? "Saving…" : "Save"}</button>
      </SheetFooter>}>
      <label className={cx("xk-field xk-json-field", parseError && "has-error")}>
        <span>JSON <span className={cx("xk-json-state", parseError ? "is-bad" : "is-ok")}>{parseError ? "invalid" : "valid"}</span></span>
        <textarea className="is-mono" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget; const a = t.selectionStart; setText(text.slice(0, a) + "  " + text.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2; }); } }} />
        {parseError && <span className="xk-field-error" role="alert"><Icon name="warning-circle" />{parseError}</span>}
      </label>
    </Sheet>
  );
}
