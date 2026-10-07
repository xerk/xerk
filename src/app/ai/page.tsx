import { AIStack, BentoGrid, BentoTile, Button, CTABar, FAQ, ProjectCard, Section } from "@/components/xerk/ui";
import { AskMyCV } from "@/components/xerk/client";
import { aiStack } from "@/data/profile";
import { projects } from "@/data/projects";
import { pageMeta, JsonLd, faqJsonLd } from "@/lib/seo";

const faq = [
  { q: "What AI systems has Ahmed Mamdouh shipped to production?", a: "A production AI agent on the Anthropic and OpenAI APIs (LangChain, tool use, memory, guardrails), an MCP server exposing internal systems to LLM clients, and RAG pipelines on AWS with Qdrant and eval harnesses — all at Netsync." },
  { q: "Does he do fine-tuning?", a: "Yes — fine-tuning on S3, SageMaker and Bedrock, with eval harnesses to catch quality regressions." },
  { q: "Can he add AI to an existing product?", a: "Yes. Typical work: an agent with tool calls into your APIs, RAG over your docs and data, guardrails, evals and cost tracking." },
];

export const metadata = pageMeta({ title: "AI engineering — production agents, MCP servers and RAG", description: "AI work by Ahmed Mamdouh: a production agent on Anthropic + OpenAI with guardrails, an MCP server for secure tool access, RAG with Qdrant and evals, fine-tuning on SageMaker & Bedrock.", path: "/ai" });

export default function AIPage() {
  const ai = projects.filter((p) => p.ai || p.slug === "alto");
  return (
    <div className="xk-container">
      <JsonLd data={faqJsonLd(faq)} />
      <header className="xk-page-head" data-hud="AI">
        <span className="xk-label">AI engineering</span>
        <h1 data-split="">Agents, MCP servers and RAG — in production, with guardrails</h1>
        <p>I build AI that works on real operational data: tool use into live systems, retrieval with evals, and the boring reliability work that keeps it safe.</p>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }} data-reveal="">
        <BentoGrid>
          <BentoTile span={2} tall tone="agent" icon="robot" eyebrow="Netsync" value="Agent" title="Production AI agent" text="Anthropic + OpenAI APIs with LangChain: multi-step reasoning, tool use, memory and guardrails for device, support and ops workflows." />
          <BentoTile span={2} icon="link" eyebrow="Protocol" value="MCP" title="Tool server for LLMs" text="Structured query and action tools with secure calls into the database, telemetry and internal services." />
          <BentoTile icon="stack" eyebrow="Retrieval" value="RAG" title="Qdrant + evals" />
          <BentoTile icon="chart-line-up" eyebrow="Training" value="FT" title="SageMaker · Bedrock" />
        </BentoGrid>
      </section>
      <Section eyebrow="01 / Ask" title="Ask my CV — live" text="Grounded in this site's case studies and CV, with sources." scramble={false}>
        <div className="xk-two"><AskMyCV suggestions={["Has he shipped AI agents to production?", "What is an MCP server?", "How does he evaluate RAG?"]} /><FAQ items={faq} /></div>
      </Section>
      <Section eyebrow="02 / Stack" title="The AI stack I use"><AIStack items={aiStack} /></Section>
      <Section eyebrow="03 / Stages" title="AI and real-time case studies">
        <div className="xk-grid" style={{ padding: 0 }}>{ai.map((p) => <ProjectCard key={p.slug} slug={p.slug} title={p.title} eyebrow={`${p.code} · ${p.period}`} summary={p.summary} image={p.image} big={p.big} bigLabel={p.bigLabel} stack={p.stack} ai={p.ai} />)}</div>
      </Section>
      <section className="xk-section"><CTABar tone="accent" title="Add an AI agent to your product" text="Tool use, RAG on your data, guardrails and evals — scoped in one call."><Button variant="primary" href="/hire" iconRight="arrow-right" track="hire_click">Start a mission</Button></CTABar></section>
    </div>
  );
}
