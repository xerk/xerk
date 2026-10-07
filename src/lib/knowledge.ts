import { aiStack, experience, hireFaq, profile, services, skills } from "@/data/profile";
import { projects } from "@/data/projects";
import { getPosts } from "./posts";

export type Chunk = { id: string; label: string; href: string; text: string };

/** Everything "Ask my CV" may answer from. Also the body of /llms-full.txt. */
export async function getKnowledge(): Promise<Chunk[]> {
  const chunks: Chunk[] = [
    { id: "profile", label: "Profile", href: "/cv", text: `${profile.description} Location: ${profile.location} (${profile.timezone}). ${profile.availability}. Email ${profile.email}. Education: ${profile.education.degree}, ${profile.education.school} (${profile.education.period}). Languages: ${profile.languages.join(", ")}.` },
    { id: "skills", label: "Skills", href: "/cv", text: Object.entries(skills).map(([k, v]) => `${k}: ${v.join(", ")}`).join(". ") },
    { id: "ai-stack", label: "AI stack", href: "/ai", text: aiStack.map((a) => `${a.label} (${a.note})`).join(", ") },
    { id: "services", label: "Hire", href: "/hire", text: services.map((s) => `${s.title}: ${s.text} Timeline ${s.timeline}.`).join(" ") + " " + hireFaq.map((f) => `${f.q} ${f.a}`).join(" ") },
    ...experience.map((e) => ({ id: `exp-${e.company}`, label: `CV · ${e.company}`, href: "/cv", text: `${e.role} at ${e.company} (${e.where}, ${e.period}). ${e.summary} ${e.objectives.join(". ")}. Stack: ${e.stack.join(", ")}.` })),
    ...projects.map((p) => ({ id: `p-${p.slug}`, label: p.title, href: `/work/${p.slug}`, text: `${p.title} (${p.company}, ${p.period}, ${p.role}). ${p.answer} ${p.sections.map((s) => s.body.join(" ")).join(" ")} ${p.faq.map((f) => `${f.q} ${f.a}`).join(" ")} Stack: ${p.stack.join(", ")}.` })),
  ];
  const posts = await getPosts();
  posts.forEach((p) => chunks.push({ id: `post-${p.slug}`, label: p.title, href: `/blog/${p.slug}`, text: `${p.title}. ${p.summary} Tags: ${p.tags.join(", ")}.` }));
  return chunks;
}

const STOP = new Set("a an the and or of to in on for with is are was were be has have had do does did how what which who when where why can could would should will he his him ahmed mamdouh me my i you your it its this that at by as from about".split(" "));
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));

/** Small BM25-style ranking — good enough for a few dozen chunks, no vector DB needed. */
export function rank(question: string, chunks: Chunk[], k = 4) {
  const q = tokens(question);
  const docs = chunks.map((c) => tokens(`${c.label} ${c.text}`));
  const avg = docs.reduce((s, d) => s + d.length, 0) / Math.max(1, docs.length);
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  return chunks
    .map((c, i) => {
      const d = docs[i];
      let score = 0;
      for (const t of q) {
        const tf = d.filter((x) => x === t || (t.length > 3 && x.startsWith(t))).length;
        if (!tf) continue;
        const idf = Math.log(1 + (chunks.length - (df.get(t) || 0) + 0.5) / ((df.get(t) || 0) + 0.5));
        score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (d.length / avg))));
      }
      const boost = c.id.startsWith("p-") ? 1.5 : c.id.startsWith("exp-") ? 1.3 : c.id.startsWith("post-") ? 0.6 : 1;
      return { c, score: score * boost };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.c);
}
