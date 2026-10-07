import type { ReactNode } from "react";
import { Panel } from "@/components/admin/ui";

export function Section({ title, description, icon, children }: { title: string; description?: ReactNode; icon?: string; children: ReactNode }) {
  return <Panel title={title} description={description} icon={icon}><div className="xk-admin-stack" style={{ gap: 12 }}>{children}</div></Panel>;
}

export function CodeLine({ cmd, label }: { cmd: string; label?: string }) {
  return (
    <div className="xk-code">
      {label && <div className="xk-code-head"><span>{label}</span></div>}
      <pre><code>{cmd}</code></pre>
    </div>
  );
}
