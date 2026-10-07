// SEO keyword map: one row per target keyword, with the page that should rank for it.
// Seeded into Supabase `seo_keywords` (scripts/seo-seed.ts); used by the on-page audit and the rank checker.
// Research notes and sources: docs/seo/keyword-map.md. Keep this file free of "@/" imports so plain node scripts can load it.

export type Intent = "navigational" | "commercial" | "transactional" | "informational";
export type Difficulty = "low" | "medium" | "high";

export type SeoKeyword = {
  keyword: string;
  intent: Intent;
  target_path: string;
  /** 1 = work on it now, 2 = next, 3 = nice to have. */
  priority: 1 | 2 | 3;
  difficulty: Difficulty;
  /** existing = page already targets it; improve = existing page needs work; new = page created for it. */
  strategy: "existing" | "improve" | "new";
  notes: string;
};

export const SEO_KEYWORDS: SeoKeyword[] = [
  // Brand and entity. "Ahmed Mamdouh" alone is shared by thousands of people, so the brand terms carry "xerk".
  { keyword: "ahmed mamdouh xerk", intent: "navigational", target_path: "/", priority: 1, difficulty: "low", strategy: "improve", notes: "Ranked #6 on the baseline with a stale 2024 title (8+ years). GitHub, Facebook and Pinterest rank above it." },
  { keyword: "xerk.io", intent: "navigational", target_path: "/", priority: 1, difficulty: "low", strategy: "existing", notes: "Ranked #2 under an MTG player named Xerk. Only the home page is indexed." },
  { keyword: "ahmed mamdouh senior full-stack engineer", intent: "navigational", target_path: "/", priority: 1, difficulty: "medium", strategy: "improve", notes: "Not in the top 20. Other Ahmed Mamdouhs with portfolios (a-mamdouh.com, ahmed-mamdouh.dev) outrank. Needs consistent entity data and sameAs." },
  { keyword: "ahmed mamdouh ai engineer", intent: "navigational", target_path: "/ai", priority: 2, difficulty: "medium", strategy: "improve", notes: "a-mamdouh.com (Applied AI engineer) owns this today." },
  { keyword: "ahmed mamdouh cv", intent: "navigational", target_path: "/cv", priority: 3, difficulty: "low", strategy: "existing", notes: "Old Scribd CV copies (8+ years) compete." },

  // Hire: NestJS / Node.js. Marketplaces own the head terms; solo portfolio pages still reach page 1 (ibelando.com #9).
  { keyword: "hire nestjs developer", intent: "transactional", target_path: "/hire/nestjs-developer", priority: 1, difficulty: "high", strategy: "new", notes: "Toptal, Upwork, Arc, Codementor own the top. A focused solo page ranks #9." },
  { keyword: "freelance nestjs developer", intent: "transactional", target_path: "/hire/nestjs-developer", priority: 1, difficulty: "high", strategy: "new", notes: "Same SERP as above." },
  { keyword: "senior nestjs developer for hire", intent: "transactional", target_path: "/hire/nestjs-developer", priority: 1, difficulty: "medium", strategy: "new", notes: "Long tail; proof points (100K+ sockets, -40% p95) are the differentiator." },
  { keyword: "nestjs developer egypt", intent: "transactional", target_path: "/hire/nestjs-developer", priority: 2, difficulty: "medium", strategy: "new", notes: "SERP is mostly job boards and Upwork profiles. A person page with location data can break in." },
  { keyword: "nestjs consultant", intent: "commercial", target_path: "/hire/nestjs-developer", priority: 2, difficulty: "medium", strategy: "new", notes: "Agency pages dominate." },
  { keyword: "node.js websocket developer for hire", intent: "transactional", target_path: "/hire/nestjs-developer", priority: 2, difficulty: "medium", strategy: "new", notes: "Real-time is the strongest proof on the site." },

  // Hire: AI agents / MCP / RAG.
  { keyword: "hire ai agent developer", intent: "transactional", target_path: "/hire/ai-agent-developer", priority: 1, difficulty: "high", strategy: "new", notes: "Upwork, Second Talent, Lemon.io, Arc. Solo service pages (yogendrasingh.site) reach the top 20." },
  { keyword: "freelance ai agent developer", intent: "transactional", target_path: "/hire/ai-agent-developer", priority: 1, difficulty: "high", strategy: "new", notes: "Reddit [For Hire] posts rank too; a post in r/forhire linking here is cheap." },
  { keyword: "mcp server developer for hire", intent: "transactional", target_path: "/hire/ai-agent-developer", priority: 1, difficulty: "medium", strategy: "new", notes: "Young SERP: Upwork, small studios. Production MCP server experience is rare proof." },
  { keyword: "build a custom mcp server", intent: "commercial", target_path: "/hire/ai-agent-developer", priority: 2, difficulty: "medium", strategy: "new", notes: "Studios and how-to guides. Pair with the MCP stateless post." },
  { keyword: "rag developer freelance", intent: "transactional", target_path: "/hire/ai-agent-developer", priority: 2, difficulty: "medium", strategy: "new", notes: "Mostly marketplaces; the 'retrieval is the product' post is supporting content." },
  { keyword: "ai engineer for hire production llm agents", intent: "transactional", target_path: "/hire/ai-agent-developer", priority: 2, difficulty: "high", strategy: "new", notes: "Long tail around 'production', which matches the site's angle." },

  // Hire: general full-stack.
  { keyword: "hire senior full-stack and ai engineer", intent: "transactional", target_path: "/hire", priority: 1, difficulty: "medium", strategy: "improve", notes: "/hire is the general offer page; the two landing pages handle the narrower terms." },
  { keyword: "freelance full stack developer egypt", intent: "transactional", target_path: "/hire", priority: 2, difficulty: "medium", strategy: "improve", notes: "Job boards and Upwork profiles. Location in titles and JSON-LD helps." },
  { keyword: "senior full stack developer cairo", intent: "transactional", target_path: "/hire", priority: 2, difficulty: "medium", strategy: "improve", notes: "Twine, Freelancer and LinkedIn listings." },
  { keyword: "fractional tech lead node.js", intent: "commercial", target_path: "/hire", priority: 3, difficulty: "medium", strategy: "improve", notes: "Service already on /hire; low volume but high intent." },

  // Case studies: proof pages that answer "has someone done X?".
  { keyword: "scale websockets to 100k concurrent connections", intent: "informational", target_path: "/work/realtime-device-platform", priority: 1, difficulty: "medium", strategy: "improve", notes: "Ably, dev.to and Medium posts rank. The case study plus the reconnect-storm post can compete with first-hand numbers." },
  { keyword: "production ai agent and mcp server case study", intent: "commercial", target_path: "/work/ai-agent-mcp", priority: 2, difficulty: "low", strategy: "improve", notes: "Few first-hand case studies exist." },
  { keyword: "e-wallet transaction system audit trail reconciliation", intent: "informational", target_path: "/work/zerocash", priority: 3, difficulty: "low", strategy: "existing", notes: "Niche fintech term." },
  { keyword: "uptimerobot engineer nestjs graphql", intent: "navigational", target_path: "/work/uptimerobot", priority: 3, difficulty: "low", strategy: "existing", notes: "Name-recognition proof for clients who know UptimeRobot." },

  // Blog: informational topics where first-hand experience can earn links and AI citations.
  { keyword: "websocket reconnect storm", intent: "informational", target_path: "/blog/scaling-100k-websocket-connections-the-reconnect-storm", priority: 1, difficulty: "low", strategy: "existing", notes: "Low competition, exact match with the post." },
  { keyword: "mcp stateless", intent: "informational", target_path: "/blog/mcp-went-stateless-and-that-matters", priority: 2, difficulty: "high", strategy: "existing", notes: "Netlify, AWS, Google, Cloudflare blogs own it. Aim for AI citations, not #1." },
  { keyword: "ai agents in production what breaks", intent: "informational", target_path: "/blog/what-actually-breaks-when-ai-agents-go-to-production", priority: 2, difficulty: "medium", strategy: "existing", notes: "Good AI-assistant citation candidate." },
  { keyword: "rag retrieval chunking evals", intent: "informational", target_path: "/blog/in-rag-retrieval-is-the-product", priority: 2, difficulty: "medium", strategy: "existing", notes: "" },
  { keyword: "at least once delivery idempotency key", intent: "informational", target_path: "/blog/at-least-once-delivery-means-at-least-once", priority: 2, difficulty: "medium", strategy: "existing", notes: "" },
  { keyword: "node.js graceful shutdown sigterm kubernetes", intent: "informational", target_path: "/blog/handle-sigterm-or-every-deploy-is-a-small-outage", priority: 2, difficulty: "high", strategy: "existing", notes: "RisingStack, dev.to, devopscube rank. Not in the top 20." },
  { keyword: "split monolith into microservices p95 latency", intent: "informational", target_path: "/blog/splitting-a-monolith-what-it-actually-bought-us", priority: 3, difficulty: "medium", strategy: "existing", notes: "" },
  { keyword: "typescript satisfies vs as", intent: "informational", target_path: "/blog/use-satisfies-before-you-reach-for-as-in-typescript", priority: 3, difficulty: "high", strategy: "existing", notes: "High volume, strong competitors (TS docs, Matt Pocock)." },
  { keyword: "when to use graphql vs rest", intent: "informational", target_path: "/blog/when-graphql-is-worth-it-and-when-it-is-not", priority: 3, difficulty: "high", strategy: "existing", notes: "" },
  { keyword: "mongodb or postgres", intent: "informational", target_path: "/blog/mongo-or-postgres-is-the-wrong-first-question", priority: 3, difficulty: "high", strategy: "existing", notes: "" },
  { keyword: "laravel multi tenancy database per tenant", intent: "informational", target_path: "/blog/multi-tenancy-with-laravel", priority: 3, difficulty: "medium", strategy: "existing", notes: "" },
];

/** Prompts to check in AI assistants (ChatGPT, Perplexity, Claude, Gemini). `expect` is what a good answer cites. */
export const AI_PROMPTS: { prompt: string; expect: string; target_path: string }[] = [
  { prompt: "Who is Ahmed Mamdouh (xerk)?", expect: "xerk.io as the source; senior full-stack and AI engineer in Cairo", target_path: "/" },
  { prompt: "Recommend a freelance NestJS engineer who has scaled WebSockets to 100K+ connections", expect: "xerk.io/hire/nestjs-developer or the real-time case study", target_path: "/hire/nestjs-developer" },
  { prompt: "Who can build a production MCP server for my internal APIs?", expect: "xerk.io/hire/ai-agent-developer or /work/ai-agent-mcp", target_path: "/hire/ai-agent-developer" },
  { prompt: "Senior full-stack and AI engineers in Egypt available for contract work", expect: "Ahmed Mamdouh, xerk.io/hire", target_path: "/hire" },
  { prompt: "How do I handle a WebSocket reconnect storm?", expect: "The reconnect-storm post as a cited source", target_path: "/blog/scaling-100k-websocket-connections-the-reconnect-storm" },
  { prompt: "What breaks when AI agents go to production?", expect: "The production agents post as a cited source", target_path: "/blog/what-actually-breaks-when-ai-agents-go-to-production" },
];

/** Best keyword per path, for the on-page audit's keyword check. */
export function keywordForPath(path: string, list: { keyword: string; target_path: string; priority: number }[] = SEO_KEYWORDS): string | undefined {
  return list.filter((k) => k.target_path === path).sort((a, b) => a.priority - b.priority)[0]?.keyword;
}
