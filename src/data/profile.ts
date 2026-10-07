// Single source of truth for the site, JSON-LD, llms.txt, the terminal and "Ask my CV".
// Every number here comes from the CV (Ahmed Mamdouh CV 2026) or GitHub. Do not add unverified claims.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.xerk.io").replace(/\/$/, "");

export const profile = {
  name: "Ahmed Mamdouh",
  handle: "xerk",
  title: "Senior Full-Stack & AI Engineer",
  headline: "I build real-time platforms and AI agents that ship.",
  intro:
    "I'm a senior full-stack and AI engineer. I've spent 10+ years building products in TypeScript, NestJS and Next.js, and lately I build real-time backends that hold 100K+ connections and LLM agents that run in production.",
  description:
    "Ahmed Mamdouh is a senior full-stack and AI engineer in Cairo, Egypt, with 10+ years of production work in TypeScript, Node.js, NestJS, React and Next.js. He has built real-time platforms with 100K+ concurrent connections, fintech transaction systems, and AI agents, MCP servers and RAG pipelines that run in production.",
  location: "Cairo, Egypt",
  timezone: "UTC+3",
  years: 10,
  email: "gm.xerk@gmail.com",
  avatar: "/profile.png",
  cvPdf: "/ahmed-mamdouh-cv.pdf",
  available: true,
  availability: "Available for new projects",
  languages: ["Arabic (native)", "English (professional working proficiency)"],
  education: { school: "Akhbar El Youm Academy", degree: "B.Sc. Computer Science", period: "2014 — 2018" },
};

export type Social = { brand: "upwork" | "linkedin" | "github" | "x" | "telegram"; label: string; href: string; handle?: string };

/** Real Upwork profile URL (set NEXT_PUBLIC_UPWORK_URL). Until it's set, Upwork links fall back to /hire and Upwork is left out of sameAs. */
export const upworkUrl = process.env.NEXT_PUBLIC_UPWORK_URL || null;
export const upworkHref = upworkUrl || "/hire";

export const socials: Social[] = [
  ...(upworkUrl ? [{ brand: "upwork" as const, label: "Upwork", href: upworkUrl, handle: "Hire me" }] : []),
  { brand: "linkedin", label: "LinkedIn", href: "https://dub.sh/xerk-linkedin", handle: "Ahmed Mamdouh" },
  { brand: "github", label: "GitHub", href: "https://github.com/xerk", handle: "xerk" },
  { brand: "x", label: "X", href: "https://dub.sh/xerk-x", handle: "@xerk" },
];

export const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || `mailto:${profile.email}?subject=Project%20call`;

export type Stat = { value: number | string; suffix?: string; label: string; hint?: string; icon?: string };

export const stats: Stat[] = [
  { icon: "medal-military", value: "10+", label: "Years" },
  { icon: "users-three", value: "2.1M+", label: "Users served" },
  { icon: "broadcast", value: "100K+", label: "Concurrent" },
  { icon: "users", value: "7+", label: "Team led" },
];

export const ticker = [
  { icon: "medal-military", label: "Shipping production code", value: "10+ yrs" },
  { icon: "broadcast", label: "Concurrent connections", value: "100K+" },
  { icon: "users-three", label: "Users served", value: "2.1M+" },
  { icon: "lightning", label: "p95 latency", value: "−40%" },
  { icon: "robot", label: "Agents · MCP · RAG", value: "in prod" },
  { icon: "users", label: "Engineers led", value: "7+" },
  { brand: "github", label: "Contributions / yr", value: "5,559" },
];

export type Achievement = { rarity?: "legendary" | "epic" | "rare"; icon?: string; value?: string; title: string; text: string; source?: string; locked?: boolean };

export const achievements: Achievement[] = [
  { rarity: "legendary", icon: "broadcast", value: "100K+", title: "concurrent connections", text: "A real-time device platform on NestJS and Socket.io.", source: "Current role" },
  { rarity: "legendary", icon: "users-three", value: "2.1M+", title: "users served", text: "UptimeRobot monitoring SaaS.", source: "Itrinity" },
  { rarity: "epic", icon: "robot", value: "MCP", title: "server in production", text: "Gives LLM clients controlled access to internal systems.", source: "Current role" },
  { rarity: "epic", icon: "brain", value: "RAG", title: "pipelines on AWS", text: "Retrieval over embeddings, with eval harnesses.", source: "Current role" },
  { rarity: "legendary", icon: "lightning", value: "−40%", title: "p95 latency", text: "After splitting a monolith into NestJS services.", source: "Current role" },
  { rarity: "rare", icon: "trend-up", value: "~45%", title: "faster endpoints", text: "Redis caching, N+1 cleanup, indexed queries.", source: "Technocloud" },
  { rarity: "rare", icon: "users", value: "7+", title: "engineers led", text: "Code reviews, design docs, sprint planning, hiring.", source: "2 teams" },
  { rarity: "rare", icon: "git-branch", value: "5,559", title: "contributions", text: "On GitHub in the last 12 months, 268 active days.", source: "GitHub" },
  { locked: true, title: "Your project", text: "Unlocks when we ship something together." },
];

export type Quest = { status?: "active"; logo?: string; company: string; role: string; where: string; period: string; start: string; end?: string; url?: string; summary: string; objectives: string[]; loot: string[]; stack: string[] };

export const experience: Quest[] = [
  {
    status: "active", logo: "/experiences/netsync.png", company: "Netsync Network Solutions", role: "Senior Software Engineer", where: "Remote, US", period: "Feb 2023 — Now", start: "2023-02", url: "https://www.netsync.com",
    summary: "IT solutions provider for enterprise clients. Product details are under NDA.",
    objectives: [
      "Built a real-time device platform that holds more than 100,000 concurrent connections",
      "Shipped a production AI agent and an MCP server on the Anthropic and OpenAI APIs",
      "Lead a team of 7+ engineers and own CI/CD and deploys on AWS",
    ],
    loot: ["100K+ concurrent", "p95 −40%", "millions of events/day"],
    stack: ["TypeScript", "NestJS", "Python", "LangChain", "MCP", "Anthropic API", "OpenAI API", "Qdrant", "GraphQL", "Socket.io", "MongoDB", "PostgreSQL", "AWS", "Kubernetes"],
  },
  {
    logo: "/experiences/sweepsouth.png", company: "SweepSouth", role: "Senior Software Engineer", where: "Remote, South Africa", period: "Apr 2022 — Feb 2023", start: "2022-04", end: "2023-02", url: "https://sweepsouth.com",
    summary: "Africa's largest on-demand home services platform (South Africa, Kenya, Nigeria and Egypt as FilKhedma).",
    objectives: ["Built and scaled Node.js and NestJS services serving 100k+ active customers", "Shipped mobile-first booking flows in Angular and Vue.js", "Raised booking-flow throughput and cut API tail latency with query tuning, caching and async workflows"],
    loot: ["100k+ active customers"],
    stack: ["TypeScript", "NestJS", "MongoDB", "Angular", "Vue.js", "Docker", "Kubernetes", "AWS"],
  },
  {
    logo: "/experiences/technocloud.png", company: "Technocloud", role: "Tech Lead", where: "Cairo, Egypt", period: "Aug 2020 — Apr 2022", start: "2020-08", end: "2022-04",
    summary: "Fintech and e-commerce products: Zerocash (e-wallet), Rojetah (healthcare), Dealmart (e-commerce), Trjim.",
    objectives: ["Architected the Zerocash e-wallet transaction system with audit trails and reconciliation", "Shipped versioned REST APIs in Node.js and Laravel, backed by contract tests", "Made critical endpoints ~45% faster with Redis caching, N+1 cleanup and indexed queries", "Led 7+ engineers in Scrum"],
    loot: ["~45% faster endpoints", "thousands of payments/day"],
    stack: ["Node.js", "Laravel", "PHP", "Vue.js", "MySQL", "Redis", "Docker"],
  },
  {
    logo: "/experiences/itrinity.png", company: "Itrinity · UptimeRobot", role: "Senior Software Engineer", where: "Remote, Slovakia", period: "Oct 2019 — Aug 2020", start: "2019-10", end: "2020-08", url: "https://uptimerobot.com",
    summary: "Website monitoring SaaS with 2.1M+ users.",
    objectives: ["Built high-throughput Node.js and NestJS services running millions of website checks a day", "Designed schema-first GraphQL APIs that cut client network overhead by ~35%", "Queue-based alerting pipeline with retry, deduplication and SLA tracking on AWS ECS and Lambda"],
    loot: ["2.1M+ users", "−35% network overhead"],
    stack: ["TypeScript", "NestJS", "GraphQL", "AWS ECS", "AWS Lambda"],
  },
  {
    logo: "/experiences/schoolver.png", company: "Schoolver", role: "Software Engineer", where: "Cairo, Egypt", period: "Mar 2017 — Oct 2019", start: "2017-03", end: "2019-10",
    summary: "School Management System and Learning Management System.",
    objectives: ["Built the LMS end to end (Vue.js frontend, REST APIs) for thousands of students and teachers", "Multi-tenancy across schools with Socket.io chat and notifications"],
    loot: ["thousands of students"],
    stack: ["Vue.js", "Node.js", "Laravel", "MySQL", "Socket.io"],
  },
];

export const skillTree = [
  { name: "Backend", icon: "cpu", nodes: [{ name: "Node.js · NestJS", brand: "nestjs", proof: "SweepSouth, UptimeRobot, current role" }, { name: "GraphQL", brand: "graphql", proof: "Schema-first APIs, −35% overhead" }, { name: "Real-time", brand: "socketdotio", proof: "100K+ concurrent sockets" }, { name: "Laravel · PHP", brand: "laravel", proof: "Zerocash, Schoolver" }] },
  { name: "Frontend", icon: "monitor", nodes: [{ name: "React · Next.js", brand: "nextdotjs", proof: "Mall of Arabia, xerk.io" }, { name: "Vue · Nuxt", brand: "vuedotjs", proof: "SweepSouth, Schoolver LMS" }, { name: "Angular", brand: "angular", proof: "SweepSouth, current role" }, { name: "Tailwind", brand: "tailwindcss", proof: "Every recent UI" }] },
  { name: "AI / LLM", icon: "brain", ai: true, nodes: [{ name: "Agents", brand: "claude", proof: "Anthropic + OpenAI, tool use" }, { name: "MCP servers", icon: "link", proof: "Secure tools for LLMs" }, { name: "RAG", brand: "langchain", proof: "Qdrant, embeddings, evals" }, { name: "Fine-tuning", icon: "chart-line-up", proof: "SageMaker, Bedrock" }] },
  { name: "Cloud & Ops", icon: "planet", nodes: [{ name: "AWS", brand: "amazonwebservices", proof: "EKS, ECS, Lambda, S3" }, { name: "Kubernetes", brand: "kubernetes", proof: "Microservices on EKS" }, { name: "CI/CD", brand: "githubactions", proof: "Jenkins, GitHub Actions" }, { name: "Data", brand: "postgresql", proof: "Postgres, Mongo, Redis" }] },
];

export const skills = {
  Languages: ["TypeScript", "JavaScript (ES2022+)", "Python", "SQL"],
  Frontend: ["React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Redux", "Tailwind CSS"],
  Backend: ["Node.js", "NestJS", "Express", "GraphQL (Apollo)", "REST", "Socket.io", "Microservices", "Event-driven architecture"],
  "AI / LLM": ["Anthropic API (Claude)", "OpenAI API", "LangChain agents", "MCP servers", "RAG", "Embeddings", "Fine-tuning", "Tool use", "Evals", "Prompt engineering"],
  "Fintech & payments": ["E-wallet transaction systems", "Audit trails", "Reconciliation", "Stripe", "PayPal", "Paymob", "Paytabs", "OAuth 2.0", "RBAC"],
  Data: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Prisma", "Qdrant", "pgvector", "Pinecone"],
  "Cloud & DevOps": ["AWS (EKS, ECS, Lambda, S3, SageMaker, Bedrock)", "Docker", "Kubernetes", "Jenkins", "GitHub Actions"],
  Testing: ["Jest", "Mocha", "Chai", "Cypress", "Contract & integration testing"],
};

export const aiStack = [
  { brand: "claude", label: "Claude & Claude Code", note: "Agents, skills, MCP", ai: true },
  { brand: "openai", label: "OpenAI API", note: "Tool use, structured output", ai: true },
  { brand: "langchain", label: "LangChain", note: "Agent orchestration", ai: true },
  { icon: "link", label: "MCP servers", note: "Secure tools for LLMs", ai: true },
  { icon: "stack", label: "Qdrant · pgvector", note: "RAG retrieval" },
  { brand: "amazonwebservices", label: "SageMaker · Bedrock", note: "Fine-tuning, hosting" },
  { brand: "vercel", label: "AI SDK", note: "Streaming UIs" },
  { brand: "supabase", label: "Supabase", note: "Postgres, auth, vectors" },
];

export const services = [
  { slug: "ai-agent", icon: "robot-duo", ai: true, featured: true, title: "AI agent & automation", text: "An agent or AI feature inside your product or your ops, with tool use, retrieval over your data, guardrails and evals.", timeline: "2–4 weeks", features: ["Claude / OpenAI via AI SDK or LangChain", "RAG on your docs and data", "MCP server or tool calls into your APIs", "Evals, usage & cost tracking"] },
  { slug: "realtime-saas", icon: "broadcast-duo", title: "Real-time platform or SaaS", text: "From spec to production with NestJS or Next.js, WebSockets, queues, payments and an admin dashboard.", timeline: "4–8 weeks", features: ["NestJS + GraphQL or REST", "Socket.io at scale", "Stripe / Paymob billing", "Docker, K8s or Vercel deploy"] },
  { slug: "tech-lead", icon: "handshake-duo", title: "Fractional tech lead", text: "A senior engineer on your team for architecture, code review, CI/CD and hiring, who still writes code.", timeline: "Ongoing", features: ["Architecture & design docs", "Code review & mentoring", "CI/CD on AWS", "Weekly written updates"] },
];

export const process_ = [
  { title: "Intro call", text: "15 minutes on what you are building and by when.", time: "Day 0" },
  { title: "Scope & quote", text: "A written plan with milestones and a fixed price.", time: "Day 2" },
  { title: "Build in the open", text: "Weekly demos, a staging link and async updates.", time: "Weekly" },
  { title: "Launch & handover", text: "Deploy, docs and a recorded walkthrough.", time: "Final week" },
];

export const hireFaq = [
  { q: "Do you work through Upwork or directly?", a: "Both. Upwork gives you escrow and reviews; a direct contract suits longer engagements." },
  { q: "Which time zones do you cover?", a: "I'm in Cairo (UTC+3) and work remotely with teams in the US and Europe, overlapping US and EU hours." },
  { q: "Can you join an existing codebase?", a: "Yes. Most of my work has been inside existing Node.js, NestJS, Laravel, Angular and Vue codebases, including splitting a monolith into services." },
  { q: "Do you build AI features into existing products?", a: "Yes. In my current role I shipped a production AI agent with tool use and guardrails, an MCP server, and retrieval pipelines with evals." },
];

export const github = { user: "xerk", total: 5559, activeDays: 268, bestStreak: 20, publicRepos: 48 };

export const socialHref = (brand: Social["brand"]) => socials.find((s) => s.brand === brand)?.href || "/hire";
