// Projects = "stages" in the level select and full case studies at /work/[slug].
// Body copy is written only from facts in the CV. `embedUrl` takes a public Claude artifact (or any demo URL).

export type Faq = { q: string; a: string };
export type Section = { id: string; title: string; body: string[] };

export type Project = {
  slug: string;
  code: string;
  title: string;
  world: string;
  company: string;
  period: string;
  role: string;
  summary: string;
  answer: string; // answer-first sentence for KeyTakeaways / AI search
  takeaways: string[];
  boss: string;
  big?: string;
  bigLabel?: string;
  image?: string;
  screens?: { src: string; alt: string }[];
  video?: string;
  embedUrl?: string;
  url?: string;
  ai?: boolean;
  featured?: boolean;
  stack: string[];
  metrics: { value: string; label: string; hint?: string }[];
  sections: Section[];
  faq: Faq[];
  updated: string;
};

export const projects: Project[] = [
  {
    slug: "realtime-device-platform",
    image: "/projects/realtime-device-platform/cover.webp",
    video: "/projects/realtime-device-platform/preview.mp4",
    screens: [{ src: "/projects/realtime-device-platform/screen-1.webp", alt: "Reconnect storm simulator, dark theme" }, { src: "/projects/realtime-device-platform/screen-2.webp", alt: "Reconnect storm simulator, light theme" }],
    code: "1-1",
    title: "Real-time device platform",
    world: "Enterprise · IoT",
    company: "Current employer (under NDA)",
    period: "2023 — Now",
    role: "Senior engineer, team lead",
    summary: "A device management backend that keeps 100,000+ devices connected at once. The product is under NDA, so this page covers the engineering, not the product.",
    answer: "Ahmed Mamdouh designed a real-time device management backend on NestJS, Socket.io and MongoDB that holds more than 100,000 concurrent device connections.",
    takeaways: ["Holds more than 100,000 concurrent WebSocket connections", "Splitting a monolith into NestJS services cut p95 latency by about 40%", "A queue-based event pipeline delivers millions of events a day, at least once"],
    boss: "100,000 sockets that can't drop",
    big: "100K+",
    bigLabel: "concurrent devices",
    embedUrl: "/demos/reconnect-storm.html",
    featured: true,
    stack: ["NestJS", "Socket.io", "MongoDB", "GraphQL", "Docker", "Kubernetes", "AWS EKS", "Jenkins"],
    metrics: [{ value: "100K+", label: "Concurrent connections" }, { value: "−40%", label: "p95 latency", hint: "after the services split" }, { value: "M/day", label: "Events delivered", hint: "at least once" }],
    sections: [
      { id: "problem", title: "The problem", body: ["Every device keeps a socket open to the backend for commands and status updates. At six figures of devices, a short network blip means all of them try to reconnect in the same second, and any message lost during that window has to be delivered later."] },
      { id: "approach", title: "Approach", body: ["I built the device layer on NestJS with Socket.io and kept device state in MongoDB. Events go through a queue with at-least-once delivery, so a slow consumer delays a message instead of losing it.", "The original backend was one service. We split it into NestJS services on Docker and Kubernetes, which kept one slow path from dragging the rest down and cut p95 latency by about 40%."] },
      { id: "results", title: "Results", body: ["The platform holds more than 100,000 concurrent connections and moves millions of events a day. The demo below is a small simulation of the reconnect problem, built for this site. It isn't production code."] },
    ],
    faq: [
      { q: "How do you keep that many WebSocket connections reliable?", a: "Spread reconnects out with backoff and jitter, put a queue between the sockets and the business logic, and isolate services so one failure stays contained." },
      { q: "Can you build a real-time system like this for me?", a: "Yes. Book a call or message me on Upwork with how many devices or users you expect and what has to happen in real time." },
    ],
    updated: "2026-10",
  },
  {
    slug: "ai-agent-mcp",
    image: "/projects/ai-agent-mcp/cover.webp",
    video: "/projects/ai-agent-mcp/preview.mp4",
    screens: [{ src: "/projects/ai-agent-mcp/screen-1.webp", alt: "Agent trace playground, dark theme" }, { src: "/projects/ai-agent-mcp/screen-2.webp", alt: "Agent trace playground, light theme" }],
    code: "1-2",
    title: "AI agent + MCP server",
    world: "Enterprise · AI",
    company: "Current employer (under NDA)",
    period: "2024 — Now",
    role: "Senior engineer",
    ai: true,
    summary: "A production AI agent with tool use and guardrails, plus an MCP server that lets LLM clients query and act on internal systems under strict rules.",
    answer: "Ahmed Mamdouh built a production AI agent on the Anthropic and OpenAI APIs, with tool use and guardrails, and an MCP server that gives LLM clients controlled access to internal systems.",
    takeaways: ["A production agent on the Anthropic and OpenAI APIs, with tool use, memory and guardrails", "An MCP server with read tools and approval-gated action tools", "Retrieval with eval harnesses that catch quality regressions"],
    boss: "Letting an LLM touch production data safely",
    big: "MCP",
    bigLabel: "tools for LLMs",
    embedUrl: "/demos/agent.html",
    stack: ["LangChain", "Anthropic API", "OpenAI API", "MCP", "Qdrant", "Python", "TypeScript", "AWS"],
    metrics: [{ value: "MCP", label: "Server in production" }, { value: "RAG", label: "With eval harnesses" }, { value: "2", label: "Model providers", hint: "Anthropic + OpenAI" }],
    sections: [
      { id: "problem", title: "The problem", body: ["Support and ops work meant searching docs and internal tools by hand. An LLM could do a lot of that, as long as it could reach real data without being able to break anything."] },
      { id: "approach", title: "Approach", body: ["I built an agent on the Anthropic and OpenAI APIs with LangChain. It plans, calls tools, keeps short-term memory and runs every action through guardrails.", "The tools live in an MCP server. Read tools answer questions. Action tools need a human to approve them, and anything destructive isn't exposed at all."] },
      { id: "architecture", title: "Retrieval and evals", body: ["Answers that need documentation go through retrieval over embeddings in Qdrant. An eval harness runs on every change so a prompt or model update can't quietly make answers worse."] },
      { id: "results", title: "Results", body: ["The agent and the tool server run in production. The demo below is a scripted trace that shows the same pattern with sample data."] },
    ],
    faq: [
      { q: "What is an MCP server?", a: "A Model Context Protocol server exposes tools to LLM clients in a standard way, so an agent can use internal systems through controlled calls you can audit." },
      { q: "Can you add an AI agent to my product?", a: "Yes. Tool use into your APIs, retrieval over your data, guardrails and evals. See the AI agent service on the hire page." },
    ],
    updated: "2026-10",
  },
  {
    slug: "zerocash",
    image: "/projects/zerocash/cover.webp",
    code: "2-1",
    title: "Zerocash",
    world: "Technocloud · Fintech",
    company: "Technocloud",
    period: "2020 — 2022",
    role: "Tech lead",
    summary: "E-wallet transaction system clearing thousands of payments a day, with audit trails and reconciliation.",
    answer: "Ahmed Mamdouh architected the transaction system for Zerocash, an e-wallet platform, as tech lead at Technocloud. It processes thousands of payments a day with audit trails and reconciliation.",
    takeaways: ["Secure transaction system for thousands of daily payments", "Audit trails and reconciliation built in", "Critical endpoints ~45% faster through caching and query work"],
    boss: "Every cent reconciled",
    big: "1000s",
    bigLabel: "payments a day",
    stack: ["Node.js", "Laravel", "Vue.js", "MySQL", "Redis", "Docker"],
    metrics: [{ value: "1000s", label: "Payments a day" }, { value: "~45%", label: "Faster endpoints" }, { value: "7+", label: "Engineers led" }],
    sections: [
      { id: "problem", title: "The problem", body: ["An e-wallet moves real money. Every transaction has to be recorded, traceable and reconcilable, and the API has to stay fast while it does that."] },
      { id: "approach", title: "Approach", body: ["I architected a secure transaction system with audit trails and reconciliation, and shipped versioned REST APIs in Node.js and Laravel for web and partner clients, backed by contract tests.", "Critical endpoints got ~45% faster through Redis caching, N+1 query cleanup and indexed queries."] },
      { id: "results", title: "Results", body: ["Thousands of payments a day processed with a full audit trail, while I led a team of 7+ engineers in Scrum across Zerocash, Rojetah, Dealmart and Trjim."] },
    ],
    faq: [
      { q: "What is Zerocash?", a: "An e-wallet platform built at Technocloud; its transaction system processes thousands of daily payments with audit trails and reconciliation." },
      { q: "Do you build payment and wallet systems?", a: "Yes. Transaction systems, reconciliation, and integrations like Stripe, PayPal, Paymob and Paytabs." },
    ],
    updated: "2026-10",
  },
  {
    slug: "sweepsouth",
    image: "/projects/sweepsouth/cover.webp",
    video: "/projects/sweepsouth/preview.mp4",
    screens: [{ src: "/projects/sweepsouth/screen-1.webp", alt: "SweepSouth website on desktop" }, { src: "/projects/sweepsouth/screen-2.webp", alt: "SweepSouth website on mobile" }],
    code: "2-2",
    title: "SweepSouth",
    world: "Home services · Africa",
    company: "SweepSouth",
    period: "2022 — 2023",
    role: "Senior software engineer",
    url: "https://sweepsouth.com",
    summary: "Africa's largest on-demand home-services platform: NestJS services and booking flows for 100k+ active customers.",
    answer: "Ahmed Mamdouh built and scaled the Node.js and NestJS services behind SweepSouth, Africa's largest on-demand home services platform, for 100k+ active customers, and shipped its mobile-first booking flows.",
    takeaways: ["Node.js / NestJS services for 100k+ active customers", "Mobile-first booking flows in Angular and Vue.js", "Better booking throughput and lower API tail latency"],
    boss: "Booking-flow tail latency",
    stack: ["NestJS", "TypeScript", "MongoDB", "Angular", "Vue.js", "Docker", "Kubernetes", "AWS"],
    metrics: [{ value: "100k+", label: "Active customers" }, { value: "4", label: "Countries", hint: "ZA, KE, NG, EG" }],
    sections: [
      { id: "problem", title: "The problem", body: ["SweepSouth runs in South Africa, Kenya, Nigeria and Egypt (as FilKhedma). The booking flow is the business, so it has to be fast on mobile networks and hold up under load."] },
      { id: "approach", title: "Approach", body: ["I built and scaled Node.js and NestJS services and shipped customer-facing booking flows in Angular and Vue.js, mobile-first.", "Query tuning, caching and moving work to async workflows raised booking-flow throughput and cut API tail latency."] },
      { id: "results", title: "Results", body: ["Services serving 100k+ active customers across four countries."] },
    ],
    faq: [{ q: "What did you build at SweepSouth?", a: "Node.js and NestJS services for 100k+ active customers and the mobile-first booking flows in Angular and Vue.js." }],
    updated: "2026-10",
  },
  {
    slug: "uptimerobot",
    image: "/projects/uptimerobot/cover.webp",
    video: "/projects/uptimerobot/preview.mp4",
    screens: [{ src: "/projects/uptimerobot/screen-1.webp", alt: "UptimeRobot website on desktop" }, { src: "/projects/uptimerobot/screen-2.webp", alt: "UptimeRobot website on mobile" }],
    code: "3-1",
    title: "UptimeRobot",
    world: "Monitoring SaaS",
    company: "Itrinity",
    period: "2019 — 2020",
    role: "Senior software engineer",
    url: "https://uptimerobot.com",
    summary: "Website monitoring for 2.1M+ users: Node.js services running millions of checks a day and a schema-first GraphQL API.",
    answer: "At Itrinity, Ahmed Mamdouh built Node.js and NestJS services for UptimeRobot, a monitoring SaaS with 2.1M+ users. They run millions of website checks a day, and his GraphQL API cut client network overhead by about 35%.",
    takeaways: ["Millions of website checks a day for 2.1M+ users", "Schema-first GraphQL cut client network overhead ~35%", "Queue-based alerting with retry, dedup and SLA tracking on AWS ECS and Lambda"],
    boss: "Millions of checks a day, on time",
    stack: ["NestJS", "TypeScript", "GraphQL", "AWS ECS", "AWS Lambda"],
    metrics: [{ value: "2.1M+", label: "Users" }, { value: "−35%", label: "Client network overhead" }],
    sections: [
      { id: "problem", title: "The problem", body: ["A monitoring service is only useful if every check runs on time and every alert arrives exactly once, across millions of websites."] },
      { id: "approach", title: "Approach", body: ["High-throughput Node.js and NestJS services run millions of website checks a day.", "A queue-based alerting pipeline with retry, deduplication and SLA tracking runs on AWS ECS and Lambda.", "Schema-first GraphQL APIs cut client network overhead by ~35%."] },
      { id: "results", title: "Results", body: ["Reliable checks and alerts for 2.1M+ users."] },
    ],
    faq: [{ q: "What did you build for UptimeRobot?", a: "High-throughput NestJS services for website checks, a queue-based alerting pipeline on AWS ECS and Lambda, and schema-first GraphQL APIs." }],
    updated: "2026-10",
  },
  {
    slug: "mall-of-arabia",
    image: "/projects/mall-of-arabia/cover.webp",
    code: "3-2",
    title: "Mall of Arabia",
    world: "Retail · Web",
    company: "Freelance",
    period: "Web",
    role: "Full-stack engineer",
    summary: "Website for Egypt's largest mall.",
    answer: "Ahmed Mamdouh built the website for Mall of Arabia, Egypt's largest mall, with Next.js / Nuxt 3 and Tailwind CSS.",
    takeaways: ["Website for Egypt's largest mall", "Next.js / Nuxt 3 and Tailwind CSS"],
    boss: "A brand everyone in Cairo knows",
    big: "MoA",
    bigLabel: "Egypt's largest mall",
    stack: ["Next.js", "Nuxt 3", "Tailwind CSS"],
    metrics: [],
    sections: [{ id: "overview", title: "Overview", body: ["A public website for Mall of Arabia, Egypt's largest mall, built with Next.js / Nuxt 3 and Tailwind CSS."] }],
    faq: [],
    updated: "2026-10",
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
