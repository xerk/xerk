"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetContent, saveContent } from "@/app/[console]/actions";
import { Icon } from "@/components/xerk/icon";
import type { Profile } from "@/lib/content";
import type { Quest, Social } from "@/data/profile";
import { cx } from "@/lib/utils";
import { ConfirmButton, MediaField, StatusText, useAction } from "./shared";

/* ---------- small field helpers ---------- */

type FieldProps = { label: string; hint?: string; placeholder?: string; mono?: boolean };
const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const commas = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

function Text({ label, value, onChange, hint, placeholder, mono, type = "text" }: FieldProps & { value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="xk-field">
      <span>{label}</span>
      <input type={type} className={cx(mono && "is-mono")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="xk-field-hint">{hint}</span>}
    </label>
  );
}

function Area({ label, value, onChange, hint, placeholder, mono, rows = 3 }: FieldProps & { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="xk-field">
      <span>{label}</span>
      <textarea className={cx(mono && "is-mono")} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="xk-field-hint">{hint}</span>}
    </label>
  );
}

/** Text area bound to a string[] (one item per line). Keeps the raw text while typing so blank lines don't vanish mid-edit. */
function ListArea({ value, onChange, ...rest }: FieldProps & { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [raw, setRaw] = useState(value.join("\n"));
  useEffect(() => { if (lines(raw).join("\n") !== value.join("\n")) setRaw(value.join("\n")); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Area {...rest} value={raw} onChange={(v) => { setRaw(v); onChange(lines(v)); }} />;
}

function CommaField({ value, onChange, ...rest }: FieldProps & { value: string[]; onChange: (v: string[]) => void }) {
  const [raw, setRaw] = useState(value.join(", "));
  return <Text {...rest} value={raw} onChange={(v) => { setRaw(v); onChange(commas(v)); }} />;
}

/** Sticky save bar shared by every editor. */
function SaveBar({ dirty, onSave, onReset, status, pending, updatedAt }: { dirty: boolean; onSave: () => void; onReset: () => void; status: ReturnType<typeof useAction>["status"]; pending: boolean; updatedAt?: string }) {
  return (
    <div className="xk-admin-bar">
      <span className={cx("xk-admin-msg", dirty && "is-dirty")}>
        {dirty ? <>Unsaved changes</> : updatedAt ? <>Last saved {new Date(updatedAt).toLocaleString()}</> : <>Using built-in defaults</>}
      </span>
      <StatusText status={status} />
      <div className="xk-admin-actions">
        <ConfirmButton label="Reset to defaults" question="Replace with the built-in defaults?" confirmLabel="Yes, reset" onConfirm={onReset} disabled={pending} />
        <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={pending || !dirty} onClick={onSave}>{pending ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}

function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}

const move = <T,>(list: T[], i: number, d: number) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; };

/* ---------- Profile ---------- */

const BRANDS: Social["brand"][] = ["linkedin", "github", "x", "telegram", "upwork"];

export function ProfileEditor({ initial, socials: initialSocials, updatedAt }: { initial: Profile; socials: Social[]; updatedAt?: string }) {
  const router = useRouter();
  const [p, setP] = useState<Profile>(initial);
  const [socials, setSocials] = useState<Social[]>(initialSocials);
  const [dirty, setDirty] = useState(false);
  const { status, pending, exec } = useAction();
  useUnsavedGuard(dirty);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setDirty(true); setP((x) => ({ ...x, [k]: v })); };
  const setEdu = (k: keyof Profile["education"], v: string) => set("education", { ...p.education, [k]: v });
  const setSocial = (i: number, patch: Partial<Social>) => { setDirty(true); setSocials((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x))); };

  const save = async () => {
    const a = await exec(() => saveContent("profile", { ...p, years: Number(p.years) || 0 }));
    if (!a.ok) return;
    const b = await exec(() => saveContent("socials", socials.filter((s) => s.href.trim())));
    if (b.ok) { setDirty(false); router.refresh(); }
  };
  const reset = async () => {
    const a = await exec(() => resetContent("profile"), "Resetting…");
    if (a.ok) await exec(() => resetContent("socials"), "Resetting…");
    setDirty(false);
    router.refresh();
  };

  return (
    <>
      <section className="xk-admin-panel">
        <h2>Identity</h2>
        <div className="xk-field-row is-3">
          <Text label="Name" value={p.name} onChange={(v) => set("name", v)} />
          <Text label="Handle" value={p.handle} onChange={(v) => set("handle", v)} mono />
          <Text label="Years of experience" type="number" value={String(p.years)} onChange={(v) => set("years", Number(v))} />
        </div>
        <Text label="Title" value={p.title} onChange={(v) => set("title", v)} placeholder="Senior Full-Stack & AI Engineer" />
        <Text label="Headline" value={p.headline} onChange={(v) => set("headline", v)} hint="The big line on the home page" />
        <Area label="Intro" value={p.intro} onChange={(v) => set("intro", v)} rows={3} hint="First paragraph under the headline" />
        <Area label="Description" value={p.description} onChange={(v) => set("description", v)} rows={4} hint="Third person. Used for SEO, JSON-LD, llms.txt and Ask my CV" />
        <MediaField label="Avatar" value={p.avatar} onChange={(v) => set("avatar", v)} folder="profile" />
      </section>

      <section className="xk-admin-panel">
        <h2>Availability &amp; contact</h2>
        <div className="xk-field-row">
          <div className="xk-field"><span>Status</span><label className="xk-switch"><input type="checkbox" checked={p.available} onChange={(e) => set("available", e.target.checked)} />Open to new projects</label></div>
          <Text label="Availability text" value={p.availability} onChange={(v) => set("availability", v)} placeholder="Available for new projects" />
        </div>
        <div className="xk-field-row is-3">
          <Text label="Email" type="email" value={p.email} onChange={(v) => set("email", v)} />
          <Text label="Location" value={p.location} onChange={(v) => set("location", v)} />
          <Text label="Timezone" value={p.timezone} onChange={(v) => set("timezone", v)} mono />
        </div>
        <div className="xk-field-row">
          <Text label="Upwork profile URL" value={p.upworkUrl || ""} onChange={(v) => set("upworkUrl", v)} placeholder="https://www.upwork.com/freelancers/~…" hint="Empty: Upwork buttons go to /hire" />
          <Text label="Booking link" value={p.bookingUrl || ""} onChange={(v) => set("bookingUrl", v)} placeholder="https://cal.com/…" hint="Empty: “Book a call” opens an email" />
        </div>
        <MediaField label="CV (PDF)" value={p.cvPdf} onChange={(v) => set("cvPdf", v)} folder="profile" accept="application/pdf" kind="video" hint="Upload a new PDF or paste a link" />
      </section>

      <section className="xk-admin-panel">
        <h2>Education &amp; languages</h2>
        <div className="xk-field-row is-3">
          <Text label="School" value={p.education.school} onChange={(v) => setEdu("school", v)} />
          <Text label="Degree" value={p.education.degree} onChange={(v) => setEdu("degree", v)} />
          <Text label="Period" value={p.education.period} onChange={(v) => setEdu("period", v)} placeholder="2014 — 2018" />
        </div>
        <ListArea label="Languages" value={p.languages} onChange={(v) => set("languages", v)} rows={2} hint="One per line" />
      </section>

      <section className="xk-admin-panel">
        <div className="xk-admin-panel-head">
          <h2>Social links</h2>
          <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => { setDirty(true); setSocials((s) => [...s, { brand: "linkedin", label: "", href: "" }]); }}><Icon name="plus" />Add link</button>
        </div>
        <p className="xk-field-hint" style={{ margin: 0 }}>Upwork is added automatically from the Upwork URL above.</p>
        <div className="xk-admin-rows">
          {socials.map((s, i) => (
            <div key={i} className="xk-admin-row">
              <label className="xk-field"><span>Brand</span>
                <select value={s.brand} onChange={(e) => setSocial(i, { brand: e.target.value as Social["brand"] })}>{BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
              </label>
              <Text label="Label" value={s.label} onChange={(v) => setSocial(i, { label: v })} />
              <Text label="URL" value={s.href} onChange={(v) => setSocial(i, { href: v })} placeholder="https://…" />
              <Text label="Handle" value={s.handle || ""} onChange={(v) => setSocial(i, { handle: v })} />
              <div className="xk-admin-row-tools">
                <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" aria-label="Move up" onClick={() => { setDirty(true); setSocials((x) => move(x, i, -1)); }}><Icon name="arrow-up" /></button>
                <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" aria-label="Move down" onClick={() => { setDirty(true); setSocials((x) => move(x, i, 1)); }}><Icon name="arrow-down" /></button>
                <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" aria-label="Remove" onClick={() => { setDirty(true); setSocials((x) => x.filter((_, j) => j !== i)); }}><Icon name="trash" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SaveBar dirty={dirty} onSave={save} onReset={reset} status={status} pending={pending} updatedAt={updatedAt} />
    </>
  );
}

/* ---------- Experience ---------- */

const blankQuest = (): Quest => ({ company: "", role: "", where: "Remote", period: "", start: "", summary: "", objectives: [], loot: [], stack: [] });

export function ExperienceEditor({ initial, updatedAt }: { initial: Quest[]; updatedAt?: string }) {
  const router = useRouter();
  const [list, setList] = useState<Quest[]>(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const { status, pending, exec } = useAction();
  useUnsavedGuard(dirty);
  const patch = (i: number, p: Partial<Quest>) => { setDirty(true); setList((l) => l.map((q, j) => (j === i ? { ...q, ...p } : q))); };
  const save = async () => { const r = await exec(() => saveContent("experience", list)); if (r.ok) { setDirty(false); router.refresh(); } };
  const reset = async () => { const r = await exec(() => resetContent("experience"), "Resetting…"); if (r.ok) { setDirty(false); router.refresh(); } };

  return (
    <>
      <div className="xk-admin-toolbar">
        <span className="xk-muted">{list.length} roles · newest first · the first one is shown as your current job</span>
        <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => { setDirty(true); setList((l) => [blankQuest(), ...l]); setOpen(0); }}><Icon name="plus" />Add role</button>
      </div>
      <div className="xk-admin-stack">
        {list.map((q, i) => {
          const isOpen = open === i;
          return (
            <section key={i} className={cx("xk-admin-panel xk-admin-exp", isOpen && "is-open")}>
              <div className="xk-admin-exp-head">
                <button type="button" className="xk-admin-exp-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  {q.logo ? <img src={q.logo} alt="" className="xk-admin-exp-logo" /> : <span className="xk-admin-exp-logo is-empty"><Icon name="briefcase" /></span>}
                  <span className="xk-admin-exp-title"><strong>{q.company || "New role"}</strong><span>{q.role || "Role"} · {q.period || "Period"}</span></span>
                  {q.status === "active" && <span className="xk-admin-chip is-ok">Current</span>}
                  <Icon name={isOpen ? "caret-up" : "caret-down"} />
                </button>
                <div className="xk-admin-row-tools">
                  <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" aria-label="Move up" disabled={i === 0} onClick={() => { setDirty(true); setList((l) => move(l, i, -1)); setOpen(null); }}><Icon name="arrow-up" /></button>
                  <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" aria-label="Move down" disabled={i === list.length - 1} onClick={() => { setDirty(true); setList((l) => move(l, i, 1)); setOpen(null); }}><Icon name="arrow-down" /></button>
                  <ConfirmButton label={<Icon name="trash" />} question="Remove this role?" confirmLabel="Remove" onConfirm={() => { setDirty(true); setList((l) => l.filter((_, j) => j !== i)); setOpen(null); }} />
                </div>
              </div>
              {isOpen && (
                <div className="xk-admin-exp-body">
                  <div className="xk-field-row is-3">
                    <Text label="Company" value={q.company} onChange={(v) => patch(i, { company: v })} />
                    <Text label="Role" value={q.role} onChange={(v) => patch(i, { role: v })} />
                    <Text label="Where" value={q.where} onChange={(v) => patch(i, { where: v })} placeholder="Remote · US" />
                  </div>
                  <div className="xk-field-row is-3">
                    <Text label="Period (shown)" value={q.period} onChange={(v) => patch(i, { period: v })} placeholder="2024 — Now" />
                    <Text label="Start (YYYY-MM)" value={q.start} onChange={(v) => patch(i, { start: v })} mono placeholder="2024-03" />
                    <Text label="End (YYYY-MM)" value={q.end || ""} onChange={(v) => patch(i, { end: v || undefined })} mono placeholder="empty = now" />
                  </div>
                  <div className="xk-field-row">
                    <Text label="Company website" value={q.url || ""} onChange={(v) => patch(i, { url: v || undefined })} placeholder="https://…" />
                    <div className="xk-field"><span>Status</span><label className="xk-switch"><input type="checkbox" checked={q.status === "active"} onChange={(e) => patch(i, { status: e.target.checked ? "active" : undefined })} />Current role</label></div>
                  </div>
                  <MediaField label="Company logo" value={q.logo || ""} onChange={(v) => patch(i, { logo: v || undefined })} folder="experiences" hint="Square PNG or SVG works best" />
                  <Area label="Summary" value={q.summary} onChange={(v) => patch(i, { summary: v })} rows={2} hint="One or two sentences about the company or team" />
                  <ListArea label="What I did" value={q.objectives} onChange={(v) => patch(i, { objectives: v })} rows={5} hint="One achievement per line. The home page shows the first three" />
                  <ListArea label="Highlights (loot)" value={q.loot} onChange={(v) => patch(i, { loot: v })} rows={2} hint="Short wins, one per line, e.g. “100K+ concurrent”" />
                  <CommaField label="Stack" value={q.stack} onChange={(v) => patch(i, { stack: v })} hint="Comma separated" />
                </div>
              )}
            </section>
          );
        })}
      </div>
      <SaveBar dirty={dirty} onSave={save} onReset={reset} status={status} pending={pending} updatedAt={updatedAt} />
    </>
  );
}

/* ---------- Any other section, as JSON ---------- */

export function JsonSectionEditor({ sectionKey, label, help, initial, updatedAt }: { sectionKey: string; label: string; help: string; initial: unknown; updatedAt?: string }) {
  const router = useRouter();
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [dirty, setDirty] = useState(false);
  const [parseError, setParseError] = useState("");
  const { status, pending, exec } = useAction();

  const save = async () => {
    let value: unknown;
    try { value = JSON.parse(text); } catch (e) { setParseError(e instanceof Error ? e.message : "Invalid JSON"); return; }
    const r = await exec(() => saveContent(sectionKey, value));
    if (r.ok) { setDirty(false); setText(JSON.stringify(value, null, 2)); router.refresh(); }
  };
  const reset = async () => { const r = await exec(() => resetContent(sectionKey), "Resetting…"); if (r.ok) { setDirty(false); router.refresh(); } };

  return (
    <details className="xk-admin-panel xk-admin-json">
      <summary>
        <span className="xk-admin-json-title"><strong>{label}</strong><span>{help}</span></span>
        <span className={cx("xk-admin-chip", updatedAt ? "is-ok" : "")}>{updatedAt ? "In database" : "Defaults"}</span>
      </summary>
      <label className={cx("xk-field", parseError && "has-error")}>
        <span>JSON</span>
        <textarea className="is-mono" rows={Math.min(28, text.split("\n").length + 1)} spellCheck={false} value={text} onChange={(e) => { setText(e.target.value); setDirty(true); setParseError(""); }} />
        {parseError && <em role="alert"><Icon name="warning-circle" />{parseError}</em>}
      </label>
      <SaveBar dirty={dirty} onSave={save} onReset={reset} status={status} pending={pending} updatedAt={updatedAt} />
    </details>
  );
}
