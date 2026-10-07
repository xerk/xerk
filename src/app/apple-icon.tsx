import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
        <svg width="140" height="140" viewBox="0 0 64 64">
          <g stroke="#f2f3f5" strokeWidth="6.5" strokeLinecap="round"><path d="M15 21 32 43" /><path d="M32 21 15 43" /></g>
          <rect x="38" y="19" width="11" height="26" rx="2.5" fill="#c6f432" />
        </svg>
      </div>
    ),
    size,
  );
}
