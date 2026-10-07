"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import type { RunAuditResult } from "@/app/[console]/(cms)/seo/actions";

/** "Run audit" with a choice of target: the deployment you're on, or production. */
export function SeoRunButton({ run, isProduction }: { run: (target: "self" | "production") => Promise<RunAuditResult>; isProduction: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();
  const go = (target: "self" | "production") => start(async () => {
    setMsg(null);
    const r = await run(target);
    setMsg(r.ok ? { ok: true, text: `${r.pages} pages · avg ${r.avg} · ${r.base.replace(/^https?:\/\//, "")}` } : { ok: false, text: r.error });
    router.refresh();
  });
  return (
    <div className="xk-seo-run">
      {msg && <span className={cx("xk-seo-run-msg", !msg.ok && "is-error")} role="status">{msg.text}</span>}
      {pending && <span className="xk-seo-run-msg" role="status">Fetching every page in the sitemap…</span>}
      {!isProduction && <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm" disabled={pending} onClick={() => go("production")}><Icon name="globe" />Audit production</button>}
      <button type="button" className="xk-btn xk-btn-primary xk-btn-sm" disabled={pending} onClick={() => go("self")}>
        <Icon name={pending ? "arrows-clockwise" : "play"} className={pending ? "xk-seo-spin" : undefined} />{pending ? "Auditing…" : "Run audit"}
      </button>
    </div>
  );
}
