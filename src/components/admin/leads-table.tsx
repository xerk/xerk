"use client";

import { useState } from "react";
import { setLeadStatus } from "@/app/[console]/actions";
import { StatusText, useAction } from "./shared";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/xerk/icon";
import { EmptyState } from "./ui";

export type Lead = { id: string; created_at: string; name: string | null; email: string; budget: string | null; service: string | null; message: string | null; source: string | null; path: string | null; country: string | null; status: string };

const STATUSES = ["new", "replied", "won", "lost", "spam"];
const TONE: Record<string, string> = { new: "accent", replied: "agent", won: "accent", lost: "muted", spam: "danger" };

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [rows, setRows] = useState(leads);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { status, exec } = useAction();
  const change = async (id: string, next: string) => {
    const prev = rows.find((l) => l.id === id)?.status;
    setRows((r) => r.map((l) => (l.id === id ? { ...l, status: next } : l)));
    const res = await exec(() => setLeadStatus(id, next));
    if (!res.ok) setRows((r) => r.map((l) => (l.id === id ? { ...l, status: prev || "new" } : l)));
  };
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  if (rows.length === 0) return <EmptyState icon="tray" title="No leads yet">The contact form on /hire stores them here (Telegram gets a ping too).</EmptyState>;
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((l) => (filter === "all" || l.status === filter) && (!needle || [l.name, l.email, l.message, l.service, l.source].some((x) => x?.toLowerCase().includes(needle))));
  const count = (s: string) => rows.filter((l) => l.status === s).length;
  return (
    <>
      <div className="xk-admin-toolbar">
        <div className="xk-admin-tabs" role="group" aria-label="Filter by status">
          {["all", ...STATUSES].map((s) => <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}>{s}<span className="xk-admin-count">{s === "all" ? rows.length : count(s)}</span></button>)}
        </div>
        <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, message…" aria-label="Search leads" /></label>
        <div className="xk-admin-toolbar-end"><StatusText status={status} /></div>
      </div>
      {shown.length === 0 ? <EmptyState icon="funnel" title="Nothing matches" ticks={false}>Try another status or clear the search.</EmptyState> : (
      <div className="xk-admin-table-wrap">
        <table className="xk-admin-table">
          <thead><tr><th>Date</th><th>Who</th><th>Budget</th><th>Message</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {shown.map((l) => {
              const long = (l.message || "").length > 140;
              return (
                <tr key={l.id}>
                  <td className="is-num">{l.created_at?.slice(0, 10)}</td>
                  <td><div className="xk-admin-cell-title" style={{ minWidth: 180 }}><strong>{l.name || "—"}</strong><a className="xk-admin-cell-sub" href={`mailto:${l.email}?subject=${encodeURIComponent("Re: your message on xerk.io")}`}>{l.email}</a>{l.country && <span className="xk-admin-cell-sub">{l.country}</span>}</div></td>
                  <td className="is-num">{l.budget || "—"}{l.service && <><br />{l.service}</>}</td>
                  <td style={{ minWidth: 260 }}>
                    <div className={cx("xk-lead-msg", long && !open[l.id] && "is-clamped")}>{l.message || <span className="xk-muted">—</span>}</div>
                    {long && <button type="button" className="xk-linkbtn" onClick={() => setOpen((o) => ({ ...o, [l.id]: !o[l.id] }))}>{open[l.id] ? "Show less" : "Show all"}</button>}
                  </td>
                  <td className="is-num">{l.source || "—"}{l.path && <><br />{l.path}</>}</td>
                  <td className="is-shrink">
                    <select className="xk-admin-select is-sm" data-tone={TONE[l.status] || "muted"} value={l.status} onChange={(e) => change(l.id, e.target.value)} aria-label={`Status for ${l.email}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
