"use client";

import { useState } from "react";
import { setLeadStatus } from "@/app/admin/actions";
import { StatusText, useAction } from "./shared";
import { cx } from "@/lib/utils";

export type Lead = { id: string; created_at: string; name: string | null; email: string; budget: string | null; service: string | null; message: string | null; source: string | null; path: string | null; country: string | null; status: string };

const STATUSES = ["new", "replied", "won", "lost", "spam"];

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
  if (rows.length === 0) return <p className="xk-muted">No leads yet. The contact form on /hire stores them here (Telegram gets a ping too).</p>;
  return (
    <>
      <StatusText status={status} />
      <div className="xk-admin-table-wrap">
        <table className="xk-admin-table">
          <thead><tr><th>Date</th><th>Who</th><th>Budget</th><th>Message</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((l) => {
              const long = (l.message || "").length > 140;
              return (
                <tr key={l.id}>
                  <td className="is-num">{l.created_at?.slice(0, 10)}</td>
                  <td><strong>{l.name || "—"}</strong><br /><a href={`mailto:${l.email}?subject=${encodeURIComponent("Re: your message on xerk.io")}`}>{l.email}</a>{l.country && <><br /><span className="xk-muted" style={{ fontSize: 12 }}>{l.country}</span></>}</td>
                  <td className="is-num">{l.budget || "—"}{l.service && <><br />{l.service}</>}</td>
                  <td>
                    <div className={cx("xk-lead-msg", long && !open[l.id] && "is-clamped")}>{l.message || <span className="xk-muted">—</span>}</div>
                    {long && <button type="button" className="xk-linkbtn" onClick={() => setOpen((o) => ({ ...o, [l.id]: !o[l.id] }))}>{open[l.id] ? "Show less" : "Show all"}</button>}
                  </td>
                  <td className="is-num">{l.source || "—"}{l.path && <><br />{l.path}</>}</td>
                  <td>
                    <select className="xk-admin-select" value={l.status} onChange={(e) => change(l.id, e.target.value)} aria-label={`Status for ${l.email}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
