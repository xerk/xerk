import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="xk-section"><h2 style={{ margin: 0 }}>{title}</h2><div style={{ display: "grid", gap: 12 }}>{children}</div></section>;
}

export function CodeLine({ cmd, label }: { cmd: string; label?: string }) {
  return (
    <div className="xk-code">
      {label && <div className="xk-code-head"><span>{label}</span></div>}
      <pre><code>{cmd}</code></pre>
    </div>
  );
}
