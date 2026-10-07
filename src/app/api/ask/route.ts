import { NextResponse, type NextRequest } from "next/server";
import { generateText } from "ai";
import { getKnowledge, rank } from "@/lib/knowledge";
import { profile } from "@/data/profile";

export const maxDuration = 30;

const MODEL = process.env.AI_MODEL || "anthropic/claude-sonnet-5.5";
const hasAI = () => Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);

// naive per-instance rate limit
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n++; return h.n > 12;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ answer: "Too many questions in a minute — give it a moment.", sources: [] }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const question = String(body.question || "").slice(0, 300).trim();
  if (!question) return NextResponse.json({ answer: "Ask me something about Ahmed's work.", sources: [] });

  const knowledge = await getKnowledge();
  const top = rank(question, knowledge, 5);
  const context = (top.length ? top : knowledge.slice(0, 3));
  const sources = context.slice(0, 3).map((c) => ({ label: c.label, href: c.href }));

  if (hasAI()) {
    try {
      const { text } = await generateText({
        model: MODEL,
        instructions: `You are the "Ask my CV" assistant on xerk.io, the portfolio of ${profile.name}, a ${profile.title}. Answer visitors' questions about him in 1–3 short sentences, in the third person, using ONLY the numbered sources below. If the sources don't contain the answer, say you don't know and suggest the /hire page or emailing ${profile.email}. Never invent numbers, employers, clients or prices. No markdown headings.\n\n${context.map((c, i) => `[${i + 1}] ${c.label}: ${c.text}`).join("\n\n")}`,
        prompt: question,
        maxOutputTokens: 300,
      });
      return NextResponse.json({ answer: text.trim(), sources, mode: "ai" });
    } catch (e) {
      console.error("ask: AI call failed, falling back", e);
    }
  }
  // Extractive fallback: best matching sentences from the top sources.
  const qt = question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const sentences = context.slice(0, 1).flatMap((c) => c.text.split(/(?<=[.!?])\s+/)).map((s) => ({ s, score: qt.filter((w) => s.toLowerCase().includes(w)).length })).sort((a, b) => b.score - a.score);
  const answer = top.length && sentences[0]?.score ? sentences[0].s : `I don't have that in my notes. Try the CV page, or email ${profile.email}.`;
  return NextResponse.json({ answer, sources: top.length ? sources : [{ label: "CV", href: "/cv" }], mode: "search" });
}
