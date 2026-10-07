import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import { getSite } from "@/lib/content";

// Dynamic OG image in the xerk brand: /og?title=...&kind=Case%20study&stat=100K%2B
export async function GET(req: Request) {
  const { profile } = await getSite();
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || `${profile.name} — ${profile.title}`).slice(0, 110);
  const kind = (searchParams.get("kind") || "Profile").slice(0, 30);
  const stat = (searchParams.get("stat") || "").slice(0, 8);
  const dir = path.join(process.cwd(), "node_modules/geist/dist/fonts");
  const [sans, mono] = await Promise.all([fs.readFile(path.join(dir, "geist-sans/Geist-SemiBold.ttf")), fs.readFile(path.join(dir, "geist-mono/GeistMono-Medium.ttf"))]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0a0b0d", color: "#f2f3f5", fontFamily: "Geist", backgroundImage: "radial-gradient(rgba(242,243,245,0.08) 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="52" height="52" viewBox="0 0 64 64"><g stroke="#f2f3f5" strokeWidth="6.5" strokeLinecap="round"><path d="M15 21 32 43" /><path d="M32 21 15 43" /></g><rect x="38" y="19" width="11" height="26" rx="2.5" fill="#c6f432" /></svg>
            <span style={{ fontFamily: "GeistMono", fontSize: 40, letterSpacing: -1.5 }}>xerk</span>
          </div>
          <span style={{ fontFamily: "GeistMono", fontSize: 22, color: "#c6f432", textTransform: "uppercase", letterSpacing: 3 }}>{kind}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div style={{ fontSize: title.length > 60 ? 64 : 80, lineHeight: 1.05, letterSpacing: -3, maxWidth: stat ? 820 : 1050 }}>{title}</div>
          {stat && <div style={{ fontFamily: "GeistMono", fontSize: 96, color: "#c6f432", letterSpacing: -4 }}>{stat}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#9ba1aa" }}>
          <span>{profile.name} · {profile.title}</span>
          <span style={{ fontFamily: "GeistMono", color: "#c6f432" }}>xerk.io</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, background: "#c6f432" }} />
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: "Geist", data: sans, weight: 600 }, { name: "GeistMono", data: mono, weight: 500 }] },
  );
}
