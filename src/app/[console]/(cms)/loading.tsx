import { Skeleton } from "@/components/admin/ui";

/** Shown while a dashboard page streams in. */
export default function Loading() {
  return (
    <div className="xk-admin-stack" aria-busy="true" aria-label="Loading">
      <div className="xk-admin-head" style={{ display: "block" }}>
        <Skeleton width={72} />
        <div style={{ height: 12 }} />
        <Skeleton variant="title" width="28%" />
        <div style={{ height: 10 }} />
        <Skeleton width="52%" />
      </div>
      <Skeleton width={320} />
      <div className="xk-list" style={{ padding: 16, gap: 18 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Skeleton variant="circle" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}><Skeleton width={`${60 - i * 4}%`} /><Skeleton width="30%" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
