import { profile, github, experience } from "./profile";
import type { Project } from "./projects";

export const MOTD = `xerk.os v2.0 — ${profile.years}+ years loaded\ntype \`help\` for commands`;

export const terminalCommands = (projects: Pick<Project, "code" | "title" | "slug">[]): Record<string, string[]> => ({
  whoami: [`${profile.name} — senior full-stack & AI engineer`, `${profile.years}+ years · ${profile.location} (${profile.timezone}) · remote with US & EU teams`],
  projects: projects.map((p) => `${p.code}  ${p.title.padEnd(24)} ${p.slug}`).concat(["", "try: open ai-agent-mcp"]),
  experience: experience.map((e) => `${e.period.padEnd(20)} ${e.company} — ${e.role}`),
  stack: ["TypeScript · Node.js · NestJS · GraphQL · Socket.io", "React · Next.js · Vue · Angular · Tailwind", "Claude · OpenAI · LangChain · MCP · RAG · Qdrant", "AWS (EKS, Lambda, Bedrock) · Docker · Kubernetes"],
  achievements: ["100K+ concurrent connections · 2.1M+ users served · p95 −40%", "MCP server + AI agent in production · 7+ engineers led"],
  github: [`${github.total.toLocaleString("en-US")} contributions in the last year · ${github.activeDays} active days · ${github.publicRepos} public repos`],
  contact: [profile.email, "or run: hire"],
  hire: ["→ /hire  ·  Upwork  ·  book a call", "Reply within one working day."],
  "sudo hire-me": ["[sudo] permission granted.", "Opening /hire … achievement unlocked: Root access (+200 XP)"],
});
