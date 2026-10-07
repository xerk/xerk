import { AIStack, BentoGrid, BentoTile, Button, CTABar, FAQ, ProjectCard, Section } from "@/components/xerk/ui";
import { AskMyCV } from "@/components/xerk/client";
import { getSite } from "@/lib/content";
import { getProjects } from "@/lib/projects";
import { pageMeta, JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const faq = [
  { q: "What AI systems has Ahmed Mamdouh shipped to production?", a: "In his current role: a production AI agent on the Anthropic and OpenAI APIs with tool use, memory and guardrails, an MCP server that gives LLM clients controlled access to internal systems, and retrieval pipelines with eval harnesses." },
  { q: "Does he do fine-tuning?", a: "Yes, fine-tuning on S3, SageMaker and Bedrock, with eval harnesses to catch quality regressions." },
  { q: "Can he add AI to an existing product?", a: "Yes. Typical work: an agent with tool calls into your APIs, RAG over your docs and data, guardrails, evals and cost tracking." },
];

export const metadata = pageMeta({ title: "AI engineering: agents, MCP servers and RAG", description: "AI work by Ahmed Mamdouh: a production agent on the Anthropic and OpenAI APIs with guardrails, an MCP server for tool access, and RAG with Qdrant and evals.", path: "/ai" });

export default async function AIPage() {
  const { aiStack } = await getSite();
  const projects = await getProjects();
  const ai = projects.filter((p) => p.ai || p.slug === "realtime-device-platform");
  return (
    <div className="xk-container">
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "AI", path: "/ai" }])} />
      <header className="xk-page-head" data-hud="AI">
        <span className="xk-label">AI engineering</span>
        <h1 data-split="">AI agents, MCP servers and RAG that run in production</h1>
        <p>I build AI that works on real operational data: tool use into live systems, retrieval with evals, and the boring reliability work that keeps it safe.</p>
      </header>
      <section className="xk-section" style={{ paddingTop: 0 }} data-reveal="">
        <BentoGrid>
          <BentoTile span={2} tall tone="agent" icon="robot" eyebrow="Current role" value="Agent" title="Production AI agent" text="Built on the Anthropic and OpenAI APIs with LangChain. It plans, calls tools, keeps memory and runs every action through guardrails." />
          <BentoTile span={2} icon="link" eyebrow="Protocol" value="MCP" title="Tool server for LLMs" text="Structured query and action tools with secure calls into the database, telemetry and internal services." />
          <BentoTile icon="stack" eyebrow="Retrieval" value="RAG" title="Qdrant + evals" />
          <BentoTile icon="chart-line-up" eyebrow="Training" value="FT" title="SageMaker · Bedrock" />
        </BentoGrid>
      </section>
      <Section eyebrow="01 / Ask" title="Ask my CV" text="Grounded in this site's case studies and CV, with sources." scramble={false}>
        <div className="xk-two"><AskMyCV suggestions={["Has he shipped AI agents to production?", "What is an MCP server?", "How does he evaluate RAG?"]} /><FAQ items={faq} /></div>
      </Section>
      <Section eyebrow="02 / Stack" title="The AI stack I use"><AIStack items={aiStack} /></Section>
      <Section eyebrow="03 / Stages" title="AI and real-time case studies">
        <div className="xk-grid" style={{ padding: 0 }}>{ai.map((p) => <ProjectCard key={p.slug} slug={p.slug} title={p.title} eyebrow={`${p.code} · ${p.period}`} summary={p.summary} image={p.image} video={p.video} hasVideo={!!p.video} big={p.big} bigLabel={p.bigLabel} stack={p.stack} ai={p.ai} />)}</div>
      </Section>
      <section className="xk-section"><CTABar tone="accent" title="Add an AI agent to your product" text="Tool use, RAG on your data, guardrails and evals, scoped in one call."><Button variant="primary" href="/hire/ai-agent-developer" iconRight="arrow-right" track="hire_click">Hire an AI agent developer</Button></CTABar></section>
    </div>
  );
}
