# xerk.io keyword map

Research date: 2026-10-08. Goal: get Ahmed hired or contracted for NestJS, real-time and AI agent work. The data lives in `src/data/seo-keywords.ts` and is seeded into Supabase `seo_keywords` with `scripts/seo-seed.ts`. The dashboard at `/seo` reads it from there.

## What the research found

- Only the home page of xerk.io is in the index we could query, and it still shows a 2024 title and description ("Senior Software Engineer, 8+ years"). None of the 40 sitemap URLs below the home page came up, so case studies and posts can't rank yet. Google Search Console (request indexing, submit the sitemap) is the first fix, ahead of any copy work.
- `xerk.io` and `www.xerk.io` both answered 200. The canonical tag points to www, but Google had indexed the apex. The site now 308-redirects the apex to www.
- "Ahmed Mamdouh" is a crowded name: a fencer, a footballer, a researcher, a product manager, two other developers with portfolios (a-mamdouh.com, ahmed-mamdouh.dev). Search engines and AI assistants need the disambiguators every time: xerk, Cairo, NestJS, 100K+ connections, MCP. Brand keywords in the map include "xerk" for that reason.
- Other profiles disagree on the basics. GitHub says 7+ years, Happenstance and Scribd say 8+, a Himalayas profile lists Saudi Arabia, an F6S profile says "CTO at Agd Ejar, 7 years". The site says 10+. Assistants that see conflicting facts tend to hedge or skip the person. Updating those profiles to match the site helps more than any on-page change.
- Hire terms ("hire nestjs developer", "hire ai agent developer") belong to Toptal, Upwork, Arc, Lemon.io and agencies. Solo portfolio pages still reach page 1 when the page is about exactly one thing: ibelando.com/hire-nestjs-developer ranks #9 to #10 and yogendrasingh.site/services/rag-ai-agent-developer #18. That is the case for the two new landing pages.
- Informational SERPs are a mix of vendor blogs (Ably, Netlify, AWS, Cloudflare) and dev.to/Medium posts. Low-competition, exact-match topics like "websocket reconnect storm" are winnable once the post is indexed. "mcp stateless" and "typescript satisfies vs as" are worth AI citations more than a #1 spot.

## Top 10 to work on first

| # | Keyword | Intent | Target page | Difficulty | Plan |
|---|---|---|---|---|---|
| 1 | ahmed mamdouh xerk | navigational | / | low | Fix stale index entry, entity data, consistent profiles |
| 2 | xerk.io | navigational | / | low | Apex to www redirect, request reindex |
| 3 | ahmed mamdouh senior full-stack engineer | navigational | / | medium | Title and JSON-LD carry name + role + Cairo |
| 4 | hire nestjs developer | transactional | /hire/nestjs-developer | high | New landing page |
| 5 | senior nestjs developer for hire | transactional | /hire/nestjs-developer | medium | Same page, proof in the first screen |
| 6 | hire ai agent developer | transactional | /hire/ai-agent-developer | high | New landing page |
| 7 | mcp server developer for hire | transactional | /hire/ai-agent-developer | medium | Same page, MCP section and FAQ |
| 8 | hire senior full-stack and ai engineer | transactional | /hire | medium | Retitled /hire, links to both landing pages |
| 9 | scale websockets to 100k concurrent connections | informational | /work/realtime-device-platform | medium | Case study + reconnect-storm post, linked both ways |
| 10 | websocket reconnect storm | informational | /blog/scaling-100k-websocket-connections-the-reconnect-storm | low | Already written; needs indexing and links |

## Full map

Priority 1 means now, 3 means when there's time. Strategy "new" means a page was created for it in this pass.

| Keyword | Intent | Target | P | Difficulty | Strategy |
|---|---|---|---|---|---|
| ahmed mamdouh xerk | navigational | / | 1 | low | improve |
| xerk.io | navigational | / | 1 | low | existing |
| ahmed mamdouh senior full-stack engineer | navigational | / | 1 | medium | improve |
| ahmed mamdouh ai engineer | navigational | /ai | 2 | medium | improve |
| ahmed mamdouh cv | navigational | /cv | 3 | low | existing |
| hire nestjs developer | transactional | /hire/nestjs-developer | 1 | high | new |
| freelance nestjs developer | transactional | /hire/nestjs-developer | 1 | high | new |
| senior nestjs developer for hire | transactional | /hire/nestjs-developer | 1 | medium | new |
| nestjs developer egypt | transactional | /hire/nestjs-developer | 2 | medium | new |
| nestjs consultant | commercial | /hire/nestjs-developer | 2 | medium | new |
| node.js websocket developer for hire | transactional | /hire/nestjs-developer | 2 | medium | new |
| hire ai agent developer | transactional | /hire/ai-agent-developer | 1 | high | new |
| freelance ai agent developer | transactional | /hire/ai-agent-developer | 1 | high | new |
| mcp server developer for hire | transactional | /hire/ai-agent-developer | 1 | medium | new |
| build a custom mcp server | commercial | /hire/ai-agent-developer | 2 | medium | new |
| rag developer freelance | transactional | /hire/ai-agent-developer | 2 | medium | new |
| ai engineer for hire production llm agents | transactional | /hire/ai-agent-developer | 2 | high | new |
| hire senior full-stack and ai engineer | transactional | /hire | 1 | medium | improve |
| freelance full stack developer egypt | transactional | /hire | 2 | medium | improve |
| senior full stack developer cairo | transactional | /hire | 2 | medium | improve |
| fractional tech lead node.js | commercial | /hire | 3 | medium | improve |
| scale websockets to 100k concurrent connections | informational | /work/realtime-device-platform | 1 | medium | improve |
| production ai agent and mcp server case study | commercial | /work/ai-agent-mcp | 2 | low | improve |
| e-wallet transaction system audit trail reconciliation | informational | /work/zerocash | 3 | low | existing |
| uptimerobot engineer nestjs graphql | navigational | /work/uptimerobot | 3 | low | existing |
| websocket reconnect storm | informational | /blog/scaling-100k-websocket-connections-the-reconnect-storm | 1 | low | existing |
| mcp stateless | informational | /blog/mcp-went-stateless-and-that-matters | 2 | high | existing |
| ai agents in production what breaks | informational | /blog/what-actually-breaks-when-ai-agents-go-to-production | 2 | medium | existing |
| rag retrieval quality chunking evals | informational | /blog/in-rag-retrieval-is-the-product | 2 | medium | existing |
| at least once delivery idempotency key | informational | /blog/at-least-once-delivery-means-at-least-once | 2 | medium | existing |
| node.js graceful shutdown sigterm kubernetes | informational | /blog/handle-sigterm-or-every-deploy-is-a-small-outage | 2 | high | existing |
| split monolith into microservices p95 latency | informational | /blog/splitting-a-monolith-what-it-actually-bought-us | 3 | medium | existing |
| typescript satisfies vs as | informational | /blog/use-satisfies-before-you-reach-for-as-in-typescript | 3 | high | existing |
| when to use graphql vs rest | informational | /blog/when-graphql-is-worth-it-and-when-it-is-not | 3 | high | existing |
| mongodb or postgres | informational | /blog/mongo-or-postgres-is-the-wrong-first-question | 3 | high | existing |
| laravel multi tenancy database per tenant | informational | /blog/multi-tenancy-with-laravel | 3 | medium | existing |

Difficulty is a judgment from who holds the top 20 (marketplaces and big vendor blogs = high, mixed dev.to/Medium = medium, thin or off-topic results = low). No keyword volume tool was available; add one (see below) before spending effort on priority 3.

## AI assistants (ChatGPT, Perplexity, Claude, Gemini)

Assistants with web search (ChatGPT search, Perplexity, Gemini, Claude with search) pull a handful of pages from a search index and quote the ones that answer the question in plain sentences. Assistants without search answer from training data, which only knows people who were written about on many sites. For a freelancer that means:

1. Be in the index first. Bing feeds ChatGPT search and Copilot, Google feeds Gemini, and Perplexity runs its own crawler plus others. Submit the sitemap to Google Search Console and Bing Webmaster Tools.
2. One entity, same facts everywhere. Name, "xerk", Senior Full-Stack & AI Engineer, Cairo, 10+ years, NestJS, 100K+ concurrent connections, MCP server in production. The Person JSON-LD carries these with `sameAs` links to GitHub, LinkedIn, X and Upwork. The external profiles need to say the same thing.
3. Answer-first sentences. Each case study opens with a one-sentence answer ("Ahmed Mamdouh designed a real-time device management backend on NestJS..."), and the new landing pages and FAQs follow the same pattern. llms.txt now opens with a fact sheet and a Q&A block that assistants can quote directly.
4. Crawlers allowed. robots.txt already allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended.
5. Third-party mentions. Assistants weight what other sites say about a person. A short Reddit r/forhire post, an Upwork profile that links back, and answers on dev.to or Stack Overflow linking the reconnect-storm and MCP posts all count.

Prompts tracked on the dashboard (`AI_PROMPTS` in the data file):

- Who is Ahmed Mamdouh (xerk)?
- Recommend a freelance NestJS engineer who has scaled WebSockets to 100K+ connections
- Who can build a production MCP server for my internal APIs?
- Senior full-stack and AI engineers in Egypt available for contract work
- How do I handle a WebSocket reconnect storm?
- What breaks when AI agents go to production?

Baseline (2026-10-08): ChatGPT, Perplexity and Gemini could not be queried from the research environment and are recorded as untested. Claude without search does not know xerk.io. The web index proxy returns xerk.io at #6 for "Ahmed Mamdouh xerk" and nowhere in the top 20 for the other prompts.

## Baseline ranks

Checked with firecrawl_search (web index, top 20). This is a proxy for Google, recorded as engine `web` in `seo_ranks` with source `baseline-2026-10-08`. Raw rows: `docs/seo/baseline-2026-10-08.json`.

| Keyword | Position |
|---|---|
| xerk.io | 2 (stale title) |
| ahmed mamdouh xerk | 6 (stale title) |
| every other keyword checked (14) | not in top 20 |

## Audit baseline

On-page audit (`src/lib/seo-audit.ts`), 2026-10-08, stored in `seo_audits`:

- Production before this branch: 40 pages, average 91.
- This branch on a local server: 42 pages (two new hire pages), average 97.

What's left is mostly blog titles that don't carry their mapped keyword and a few thin pages (/now, /uses, /work/mall-of-arabia). Post titles are Ahmed's; the dashboard lists them as suggestions rather than changing them.

## What needs Ahmed

- Google Search Console: request indexing for /, /hire, /hire/nestjs-developer, /hire/ai-agent-developer and the case studies; resubmit the sitemap. For real Google positions in the dashboard, create a service account with access to the property and set `GSC_SERVICE_ACCOUNT_JSON` and `GSC_SITE_URL`.
- Bing Webmaster Tools: import the site from GSC (feeds ChatGPT search and Copilot).
- A SERP API key for the rank checker: `SERPER_API_KEY` (serper.dev) or `SERPAPI_API_KEY`. `FIRECRAWL_API_KEY` works as a fallback proxy.
- Update GitHub bio (7+ years), and the Himalayas, F6S and Happenstance profiles, to match the site.
- Set `NEXT_PUBLIC_UPWORK_URL` (or the Upwork field in the dashboard) so Upwork appears in `sameAs` and the hire buttons.
- Subdomains stock.xerk.io, pinpund.xerk.io, tr.xerk.io and multy-app.xerk.io show up for brand searches. Add `noindex` to the ones that aren't meant to be found (tr.xerk.io is a time-tracker login).
- The dub.sh short links in `sameAs` couldn't be resolved from here (dub.sh blocks bots). Put the real LinkedIn and X URLs in the dashboard socials, or tell me the LinkedIn slug.
