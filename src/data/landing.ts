// Focused hire pages (/hire/<slug>) and the internal-link map between case studies, posts and hire pages.
// Copy uses only facts from profile.ts / projects.ts / the blog. No prices, no client names beyond what the CV lists,
// and the current employer stays generic (NDA).

export type Landing = {
  slug: string;
  /** <title> before the " | Ahmed Mamdouh" template. */
  metaTitle: string;
  metaDescription: string;
  /** Short name for breadcrumbs and links. */
  name: string;
  eyebrow: string;
  h1: string;
  intro: string;
  proof: { value: string; title: string; text: string; tone?: "accent" | "agent"; icon: string }[];
  buildTitle: string;
  build: { title: string; text: string }[];
  stack: string[];
  projects: string[];
  posts: string[];
  timeline: string;
  faq: { q: string; a: string }[];
  serviceType: string;
  knowsAbout: string[];
  ai?: boolean;
};

const WORK_TOGETHER = {
  q: "How do we work together?",
  a: "Directly or through Upwork. A fixed-scope build starts with a written plan and milestones; ongoing work means a few days a week on your team. I'm in Cairo (UTC+3) and overlap with US and EU working hours.",
};

export const LANDINGS: Landing[] = [
  {
    slug: "nestjs-developer",
    metaTitle: "Hire a senior NestJS developer (remote)",
    metaDescription: "Senior NestJS developer with 10+ years in Node.js. I built a NestJS and Socket.io backend that holds 100K+ live connections. Hire me directly or on Upwork.",
    name: "NestJS developer",
    eyebrow: "Hire · NestJS",
    h1: "Hire a senior NestJS developer",
    intro: "I've written NestJS services since 2019, starting with UptimeRobot's checks and alerting. In my current role I built a NestJS and Socket.io backend that keeps more than 100,000 devices connected at once, then helped split the monolith behind it into NestJS services, which cut p95 latency by about 40%. I take fixed-scope builds or join your team a few days a week.",
    proof: [
      { value: "100K+", title: "Concurrent connections", text: "A device platform on NestJS, Socket.io and MongoDB.", tone: "accent", icon: "broadcast" },
      { value: "−40%", title: "p95 latency", text: "After splitting a monolith into NestJS services on Kubernetes.", icon: "lightning" },
      { value: "2.1M+", title: "Users at UptimeRobot", text: "Node.js and NestJS services running millions of website checks a day.", icon: "users-three" },
      { value: "100k+", title: "Active customers", text: "NestJS services and booking flows at SweepSouth.", icon: "users" },
    ],
    buildTitle: "What I build with NestJS",
    build: [
      { title: "Real-time backends", text: "Socket.io gateways that survive reconnect storms, with a queue behind them so a slow consumer delays a message instead of losing it." },
      { title: "APIs that clients like", text: "REST or schema-first GraphQL. At UptimeRobot the GraphQL API cut client network overhead by about 35%." },
      { title: "Monolith to services", text: "Splitting along the slow paths, on Docker and Kubernetes (AWS EKS), with CI/CD in Jenkins or GitHub Actions." },
      { title: "Queues and background work", text: "Retry, deduplication and idempotency keys, like the alerting pipeline I built on AWS ECS and Lambda." },
      { title: "Existing codebases", text: "Most of my work has been inside codebases someone else started. I read first, profile second, and change the boring parts that are slow." },
      { title: "Full-stack when needed", text: "Next.js or React on the front, plus Angular and Vue from SweepSouth and Schoolver, so one person owns the contract between the two." },
    ],
    stack: ["NestJS", "TypeScript", "Node.js", "Socket.io", "GraphQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS"],
    projects: ["realtime-device-platform", "uptimerobot", "sweepsouth"],
    posts: ["scaling-100k-websocket-connections-the-reconnect-storm", "at-least-once-delivery-means-at-least-once", "splitting-a-monolith-what-it-actually-bought-us", "handle-sigterm-or-every-deploy-is-a-small-outage", "when-graphql-is-worth-it-and-when-it-is-not"],
    timeline: "A real-time platform or SaaS usually takes 4 to 8 weeks from spec to production.",
    faq: [
      { q: "Can you take over an existing NestJS codebase?", a: "Yes. Most of my work has been inside existing Node.js and NestJS codebases, including splitting a monolith into NestJS services at my current job." },
      { q: "Have you scaled NestJS WebSockets in production?", a: "Yes. The device platform I built on NestJS, Socket.io and MongoDB holds more than 100,000 concurrent connections. The hard part was the reconnect storm after a network blip, which I wrote up on the blog." },
      { q: "Do you also build the frontend?", a: "Yes. React and Next.js on recent work (this site and Mall of Arabia), Angular and Vue.js at SweepSouth, and Vue.js at Schoolver." },
      { q: "Which databases do you use with NestJS?", a: "PostgreSQL, MongoDB and MySQL in production, with Redis for caching. I pick by access pattern; when nobody knows the access patterns yet, Postgres." },
      WORK_TOGETHER,
    ],
    serviceType: "NestJS and Node.js backend development",
    knowsAbout: ["NestJS", "Node.js", "TypeScript", "Socket.io", "WebSockets", "GraphQL", "Microservices", "PostgreSQL", "MongoDB", "Redis", "Kubernetes"],
  },
  {
    slug: "ai-agent-developer",
    metaTitle: "Hire an AI agent and MCP server developer",
    metaDescription: "AI agent and MCP server developer. I've shipped a production agent on the Anthropic and OpenAI APIs with tool use, guardrails and evals. Hire me directly or on Upwork.",
    name: "AI agent developer",
    eyebrow: "Hire · AI agents",
    h1: "Hire an AI agent and MCP server developer",
    intro: "In my current role I built an AI agent on the Anthropic and OpenAI APIs and the MCP server it uses to reach internal systems. Both run in production. Most of my 10+ years went into backends, and that turns out to be most of the work in an agent: state, partial failures, permissions and knowing when to stop.",
    proof: [
      { value: "Agent", title: "In production", text: "Anthropic and OpenAI APIs with LangChain: planning, tool calls, short-term memory, guardrails on every action.", tone: "agent", icon: "robot" },
      { value: "MCP", title: "Tool server for LLMs", text: "Read tools answer questions. Action tools need a human to approve them. Destructive actions aren't exposed.", tone: "accent", icon: "link" },
      { value: "RAG", title: "Retrieval with evals", text: "Embeddings in Qdrant, and an eval harness that runs on every prompt or model change.", icon: "stack" },
      { value: "FT", title: "Fine-tuning", text: "On S3, SageMaker and Bedrock, with evals to catch regressions.", icon: "chart-line-up" },
    ],
    buildTitle: "What I build",
    build: [
      { title: "An agent inside your product or ops", text: "Tool calls into your APIs, short-term memory, and guardrails that check each action before it runs." },
      { title: "An MCP server for your systems", text: "Scoped tools so Claude and other MCP clients can query your data and request actions without being able to break anything." },
      { title: "RAG over your docs and data", text: "Structural chunking, metadata filters and a small eval set. In my experience retrieval fixes beat model upgrades." },
      { title: "Evals, usage and cost tracking", text: "So you can see when an answer gets worse or a feature gets expensive, before your users do." },
      { title: "The backend around it", text: "Queues, retries, auth and deploys on AWS. Agents fail like distributed systems, so they need the same engineering." },
      { title: "Streaming UIs", text: "Chat and assistant interfaces in Next.js with the Vercel AI SDK, like Ask my CV on this site." },
    ],
    stack: ["Anthropic API (Claude)", "OpenAI API", "MCP", "LangChain", "AI SDK", "Qdrant", "pgvector", "AWS Bedrock", "SageMaker", "TypeScript", "Python"],
    projects: ["ai-agent-mcp", "realtime-device-platform"],
    posts: ["what-actually-breaks-when-ai-agents-go-to-production", "in-rag-retrieval-is-the-product", "mcp-went-stateless-and-that-matters", "auto-mode-made-code-review-the-last-human-gate", "what-i-stopped-doing-by-hand-with-ai-coding-tools"],
    timeline: "An agent or AI feature usually takes 2 to 4 weeks to reach production.",
    faq: [
      { q: "Have you shipped AI agents to production?", a: "Yes. In my current role I built an agent on the Anthropic and OpenAI APIs with LangChain. It plans, calls tools, keeps short-term memory and runs every action through guardrails. The product is under NDA, so the case study covers the engineering only." },
      { q: "What does an MCP server do for my product?", a: "It gives LLM clients such as Claude a controlled way into your systems. In the one I built, read tools answer questions, action tools need a human to approve them, and anything destructive isn't exposed at all." },
      { q: "Can you add RAG to an existing product?", a: "Yes. Retrieval over your docs and data with embeddings in Qdrant or pgvector, plus an eval set so a prompt or model change can't quietly make answers worse." },
      { q: "Claude or OpenAI?", a: "I've shipped on both. I connect them through the AI SDK or LangChain so you can change models later without rewriting the feature." },
      WORK_TOGETHER,
    ],
    serviceType: "AI agent, MCP server and RAG development",
    knowsAbout: ["AI agents", "Model Context Protocol (MCP)", "Retrieval-augmented generation (RAG)", "Anthropic API", "Claude", "OpenAI API", "LangChain", "Vercel AI SDK", "Qdrant", "pgvector", "LLM evaluation", "Fine-tuning"],
    ai: true,
  },
];

/** Last time the copy of the static pages (hire, cv, uses, now, play, landings) changed. Bump it when you edit them; the sitemap uses it as lastmod. */
export const STATIC_UPDATED = "2026-10-08";

export const getLanding = (slug: string) => LANDINGS.find((l) => l.slug === slug);

/** Case study → blog posts that go deeper on the same engineering. */
export const PROJECT_POSTS: Record<string, string[]> = {
  "realtime-device-platform": ["scaling-100k-websocket-connections-the-reconnect-storm", "at-least-once-delivery-means-at-least-once", "splitting-a-monolith-what-it-actually-bought-us", "watch-queue-depth-trend-not-the-current-number"],
  "ai-agent-mcp": ["what-actually-breaks-when-ai-agents-go-to-production", "in-rag-retrieval-is-the-product", "mcp-went-stateless-and-that-matters"],
  zerocash: ["how-an-endpoint-got-45-percent-faster-with-no-clever-code", "caching-mistakes-i-keep-debugging", "laravel-ships-the-primitives-node-developers-rebuild-by-hand"],
  uptimerobot: ["when-graphql-is-worth-it-and-when-it-is-not", "at-least-once-delivery-means-at-least-once", "watch-queue-depth-trend-not-the-current-number"],
  sweepsouth: ["caching-mistakes-i-keep-debugging", "mongo-or-postgres-is-the-wrong-first-question", "handle-sigterm-or-every-deploy-is-a-small-outage"],
  "mall-of-arabia": ["use-satisfies-before-you-reach-for-as-in-typescript"],
};

/** Blog post → case studies that cite it. */
export function projectsForPost(slug: string): string[] {
  return Object.entries(PROJECT_POSTS).filter(([, posts]) => posts.includes(slug)).map(([p]) => p);
}

const AI_TAGS = ["ai", "agents", "mcp", "rag", "llm", "claude", "claude-code", "ai-engineering", "ai-coding", "vector-databases"];
const BACKEND_TAGS = ["nodejs", "websockets", "system-design", "queues", "distributed-systems", "microservices", "graphql", "kubernetes", "redis", "performance", "typescript", "backend", "devops", "reliability"];

/** The most relevant hire page for a post or project. */
export function hireFor({ tags = [], ai }: { tags?: string[]; ai?: boolean }): { href: string; label: string } {
  if (ai || tags.some((t) => AI_TAGS.includes(t))) return { href: "/hire/ai-agent-developer", label: "Hire an AI agent developer" };
  if (tags.some((t) => BACKEND_TAGS.includes(t))) return { href: "/hire/nestjs-developer", label: "Hire a NestJS developer" };
  return { href: "/hire", label: "Work with me" };
}

/** Case study <title> and description, written for the mapped keywords. Projects without an entry fall back to title + answer. */
export const CASE_META: Record<string, { title: string; description: string }> = {
  "realtime-device-platform": { title: "Scaling WebSockets to 100K+ connections", description: "How I built a NestJS, Socket.io and MongoDB backend that holds 100,000+ device connections, and cut p95 latency about 40% by splitting the monolith." },
  "ai-agent-mcp": { title: "Production AI agent and MCP server case study", description: "An AI agent on the Anthropic and OpenAI APIs with tool use and guardrails, plus an MCP server that gives LLM clients controlled access to internal systems." },
  zerocash: { title: "Zerocash e-wallet transaction system case study", description: "The Zerocash e-wallet transaction system: audit trails, reconciliation and versioned APIs in Node.js and Laravel, with endpoints made about 45% faster." },
  uptimerobot: { title: "UptimeRobot: NestJS and GraphQL for 2.1M+ users", description: "Node.js and NestJS services running millions of website checks a day for UptimeRobot, plus a GraphQL API that cut client network overhead by about 35%." },
  sweepsouth: { title: "SweepSouth: NestJS services for 100k+ customers", description: "Node.js and NestJS services and mobile-first booking flows for SweepSouth, Africa's largest on-demand home services platform, with 100k+ active customers." },
};
