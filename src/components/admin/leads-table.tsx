"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setLeadStatus } from "@/app/[console]/actions";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/xerk/icon";
import { Chip, EmptyState, statusTone } from "./ui";
import { Sheet, useToast } from "./sheet";

export type Lead = { id: string; created_at: string; name: string | null; email: string; budget: string | null; service: string | null; message: string | null; source: string | null; path: string | null; country: string | null; status: string };

const STATUSES = ["new", "replied", "won", "lost", "spam"];
const when = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 864e5);
  return days < 1 ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : days < 7 ? `${days}d ago` : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: days > 300 ? "numeric" : undefined });
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(leads);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const change = async (id: string, next: string) => {
    const prev = rows.find((l) => l.id === id)?.status || "new";
    if (prev === next) return;
    setRows((r) => r.map((l) => (l.id === id ? { ...l, status: next } : l)));
    const res = await setLeadStatus(id, next);
    if (!res.ok) { setRows((r) => r.map((l) => (l.id === id ? { ...l, status: prev } : l))); toast.error("Couldn't update", res.error); return; }
    toast.push({ tone: "ok", title: `Marked as ${next}`, action: { label: "Undo", run: () => change(id, prev) } });
    router.refresh();
  };

  if (rows.length === 0) return <EmptyState icon="tray" title="No leads yet">The contact form on /hire stores them here (Telegram gets a ping too).</EmptyState>;
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((l) => (filter === "all" || l.status === filter) && (!needle || [l.name, l.email, l.message, l.service, l.source].some((x) => x?.toLowerCase().includes(needle))));
  const count = (s: string) => (s === "all" ? rows.length : rows.filter((l) => l.status === s).length);
  const open = rows.find((l) => l.id === openId) || null;

  return (
    <>
      <div className="xk-admin-toolbar">
        <div className="xk-admin-tabs" role="group" aria-label="Filter by status">
          {["all", ...STATUSES].map((s) => <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}>{s[0].toUpperCase() + s.slice(1)}<span className="xk-admin-count">{count(s)}</span></button>)}
        </div>
        <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, message…" aria-label="Search leads" /></label>
      </div>
      {shown.length === 0 ? <EmptyState icon="funnel" title="Nothing matches" ticks={false} actions={<button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</button>}>Try another status or clear the search.</EmptyState> : (
        <ul className="xk-list">
          {shown.map((l) => (
            <li key={l.id}>
              <button type="button" className={cx("xk-list-row xk-lead-row", l.status === "new" && "is-new")} onClick={() => setOpenId(l.id)}>
                <span className="xk-lead-avatar" aria-hidden>{(l.name || l.email).slice(0, 1).toUpperCase()}</span>
                <span className="xk-list-main">
                  <strong>{l.name || l.email}<span className="xk-lead-when">{when(l.created_at)}</span></strong>
                  <span className="xk-list-sub">{[l.name ? l.email : null, l.budget, l.service, l.country].filter(Boolean).join(" · ")}</span>
                  {l.message && <span className="xk-list-text">{l.message}</span>}
                </span>
                <span className="xk-list-side"><Chip dot tone={statusTone(l.status)}>{l.status}</Chip><Icon name="caret-right" /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <LeadSheet lead={open} onClose={() => setOpenId(null)} onStatus={change} />
    </>
  );
}

function LeadSheet({ lead, onClose, onStatus }: { lead: Lead | null; onClose: () => void; onStatus: (id: string, s: string) => void }) {
  const toast = useToast();
  const [last, setLast] = useState(lead);
  if (lead && lead !== last) setLast(lead);
  const l = lead || last;
  const reply = l ? `mailto:${l.email}?subject=${encodeURIComponent("Re: your message on xerk.io")}` : "#";
  return (
    <Sheet open={!!lead} onClose={onClose} title={l?.name || l?.email || "Lead"} description={l ? new Date(l.created_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }) : undefined}
      footer={l && <>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(l.email); toast.ok("Email copied"); } catch { toast.error("Clipboard blocked"); } }}><Icon name="copy" />Copy email</button>
        <a className="xk-btn xk-btn-primary xk-btn-sm" href={reply} onClick={() => { if (l.status === "new") onStatus(l.id, "replied"); }}><Icon name="paper-plane-tilt" />Reply by email</a>
      </>}>
      {l && (
        <>
          <div className="xk-field">
            <span>Status</span>
            <div className="xk-admin-tabs xk-lead-status" role="radiogroup" aria-label="Status">
              {STATUSES.map((s) => <button key={s} type="button" role="radio" aria-checked={l.status === s} aria-pressed={l.status === s} onClick={() => onStatus(l.id, s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}
            </div>
            <span className="xk-field-hint">Replying from here marks a new lead as replied.</span>
          </div>
          <div className="xk-lead-message">{l.message || <span className="xk-muted">No message.</span>}</div>
          <dl className="xk-media-facts">
            <div><dt>Email</dt><dd><a href={reply}>{l.email}</a></dd></div>
            <div><dt>Budget</dt><dd>{l.budget || "—"}</dd></div>
            <div><dt>Service</dt><dd>{l.service || "—"}</dd></div>
            <div><dt>Country</dt><dd>{l.country || "—"}</dd></div>
            <div><dt>Source</dt><dd>{l.source || "—"}</dd></div>
            <div><dt>Page</dt><dd className="is-mono">{l.path || "—"}</dd></div>
          </dl>
        </>
      )}
    </Sheet>
  );
}
