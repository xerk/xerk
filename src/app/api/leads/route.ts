import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendTelegram, esc } from "@/lib/telegram";
import { adminDb } from "@/lib/supabase";

const Lead = z.object({
  name: z.string().max(120).optional().nullable(),
  email: z.string().email().max(200),
  budget: z.string().max(40).optional().nullable(),
  message: z.string().max(4000).optional().nullable(),
  service: z.string().max(60).optional().nullable(),
  company: z.string().max(200).optional().nullable(), // honeypot
  source: z.string().max(300).optional().nullable(),
  path: z.string().max(200).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = Lead.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const lead = parsed.data;
  if (lead.company) return NextResponse.json({ ok: true }); // bot filled the honeypot
  const row = { name: lead.name, email: lead.email, budget: lead.budget, message: lead.message, service: lead.service, source: lead.source, path: lead.path, country: req.headers.get("x-vercel-ip-country") };

  const db = adminDb();
  let stored = false;
  if (db) { const { error } = await db.from("leads").insert(row); stored = !error; }
  const tg = await sendTelegram(`💌 <b>New lead</b>\n👤 ${esc(lead.name || "—")} &lt;${esc(lead.email)}&gt;\n💰 ${esc(lead.budget || "—")}${lead.service ? ` · ${esc(lead.service)}` : ""}\n📄 ${esc(lead.path || "")} · ↩️ ${esc(lead.source || "direct")}\n\n${esc(lead.message || "").slice(0, 1500)}`);
  if (!stored && !tg.ok) {
    console.error("lead not delivered (configure Supabase or Telegram)", row);
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
