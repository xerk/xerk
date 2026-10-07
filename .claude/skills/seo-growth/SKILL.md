---
name: seo-growth
description: Re-run SEO and AI-search (GEO) work for xerk.io - keyword research, rank and AI-citation checks, the on-page audit - then propose and ship humanized content fixes and refresh the /seo dashboard data. Use when Ahmed says /seo-growth, "improve SEO", "check rankings", or "why doesn't ChatGPT know me".
---

# seo-growth

Goal: get Ahmed Mamdouh (xerk) hired or contracted. Rank in Google and get cited by ChatGPT, Perplexity, Claude and Gemini for the hire and proof keywords. One run = measure, decide, fix, record.

## Ground rules (from Ahmed, not negotiable)

- Facts only from the site/CV data: `src/data/profile.ts`, `src/data/projects.ts`, `content/*/index.mdx`, the Supabase `site_content`/`projects`/`posts` rows. No invented numbers, clients, testimonials or years.
- No prices or hourly rates anywhere (copy, JSON-LD `priceRange`, FAQs).
- Current employer (Netsync) is under NDA: the company name as it already appears, nothing about products or internals.
- The scheduler is called Tadween in any UI text. Never "Postiz".
- Never print or commit secrets. `.env.local` is gitignored; read keys from the environment only.
- pnpm only. Next.js 16: read `node_modules/next/dist/docs/` before using an API you're unsure of.
- Every sentence you write or rewrite goes through the humanizer skill (`~/.claude/skills/humanizer/SKILL.md`): first person where it's Ahmed's voice, plain and specific, no em/en dashes, no not-X-but-Y, no triads for rhythm, no stock AI words. Read it before writing copy.
- DB wins over files. Site copy, projects and posts are read from Supabase first. If you change copy in a repo file, check whether the DB row still matches the old file version (compare with key-order-insensitive equality; jsonb reorders keys). If it does, update the row too. If Ahmed edited it in the dashboard, don't overwrite it: propose the change in your summary instead.

## Map of the system

| What | Where |
|---|---|
| Keyword map (source of truth) | `src/data/seo-keywords.ts` (`SEO_KEYWORDS`, `AI_PROMPTS`) |
| Research notes | `docs/seo/keyword-map.md`, snapshots in `docs/seo/*.json` |
| Tables | `seo_keywords`, `seo_ranks`, `seo_audits` (`supabase/migrations/20261012000000_seo.sql`, service role only) |
| Seed / import snapshots | `node --env-file-if-exists=.env.local --experimental-strip-types scripts/seo-seed.ts [docs/seo/<file>.json]` |
| Rank check | `node --env-file-if-exists=.env.local --experimental-strip-types scripts/seo-rank-check.ts [--dry] [--priority=1] [--backend=gsc|serper|serpapi|firecrawl]` |
| On-page audit | `src/lib/seo-audit.ts`; run via `/api/cron/seo` (Bearer `CRON_SECRET`, `?base=` to pick a host) or the dashboard's Run audit button |
| Dashboard | `<admin>/seo` = `src/app/[console]/(cms)/seo/page.tsx`, data in `src/lib/seo-data.ts` |
| Metadata helpers | `src/lib/seo.tsx` (`pageMeta`, `personJsonLd`, `serviceJsonLd`, `faqJsonLd`, `breadcrumbJsonLd`, `clip`) |
| Hire landing pages + internal links | `src/data/landing.ts` (`LANDINGS`, `CASE_META`, `PROJECT_POSTS`, `hireFor`, `STATIC_UPDATED`) |
| AI crawler files | `src/app/llms.txt/route.ts`, `src/app/llms-full.txt/route.ts`, shared facts in `src/lib/llms.ts` |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts` |

## Run

Work in a git worktree or branch. Commit with clear messages ending in the Co-Authored-By line from the session's attribution rules. Don't push or merge unless Ahmed asks.

### 1. Measure

1. Rank check. Run `scripts/seo-rank-check.ts`. If it says no backend is configured, use your own web search tool (firecrawl_search or WebSearch, top 20, no location) for every priority-1 keyword and the priority-2 hire keywords. Record results as a snapshot JSON in `docs/seo/ranks-YYYY-MM-DD.json` using the format of `docs/seo/baseline-2026-10-08.json` (engine `"web"` for search-tool proxies, `"google"` only for a real Google SERP), then import it with `scripts/seo-seed.ts <file>`. Note the exact query in `query` if it differs from the keyword.
2. AI visibility. For each prompt in `AI_PROMPTS`:
   - If you can reach an assistant (an MCP tool, the user pasting answers, a browser you control), record `engine` = chatgpt/perplexity/claude/gemini with `cited` true or false and what it said in `notes`.
   - Always record what a search-backed assistant would retrieve: run the prompt through your web search tool and store an `engine: "web"` row with the position of xerk.io (or null).
   - Answer the prompt from your own knowledge without search and record that as `engine: "claude"`.
   - Anything you couldn't test stays out (or `cited: null` with a note). Never mark untested as false.
   Put these in the same snapshot file under `"ai"` and import it.
3. Audit. Audit production and, if you changed pages locally, the local dev server:
   - `CRON_SECRET=<any> pnpm dev --port <free port>` in the worktree, then `curl -H "Authorization: Bearer <same>" "http://localhost:<port>/api/cron/seo"` (local) and `...?base=https://www.xerk.io` (production).
   - Read the issues from `seo_audits` for the latest `run_id` (service-role query) or from the dashboard.
4. Research refresh (monthly or when asked). Search the hire keywords and the brand query ("Ahmed Mamdouh xerk"). Note who holds the top 10, any solo portfolio pages ranking (they show what's beatable), new SERP features, and any profile elsewhere that contradicts the site (years, location, title). Update `docs/seo/keyword-map.md` and add or reprioritize keywords in `src/data/seo-keywords.ts`, then rerun `scripts/seo-seed.ts`.

### 2. Decide

Rank the work by expected effect on hiring, highest first:

1. Indexing and entity problems (pages missing from the index, duplicate hosts, stale titles, conflicting facts across profiles). Most of these need Ahmed: list them clearly.
2. Audit errors on money pages (`/`, `/hire*`, `/work/*`, `/ai`).
3. Priority-1 keywords whose target page doesn't carry the keyword in title, H1 and first paragraph.
4. Internal links: every case study links to its posts and the matching hire page; every post links to a case study or hire page; `/hire` links to both landing pages.
5. New content only when research shows a gap a real page could fill (a landing page or a post), written from facts already on the site.
6. Warnings and info-level issues on everything else.

### 3. Fix

- Titles: under about 60 characters including the ` | Ahmed Mamdouh` suffix (use `absolute: true` in `pageMeta` for long post titles). Keyword near the front. Descriptions one sentence, 120 to 158 characters, keyword once.
- Copy: humanize, first person, specific numbers from the CV. Read every sentence against the humanizer patterns before saving.
- Structured data: Person (`personJsonLd`) is global; hire pages get `serviceJsonLd` + FAQPage + BreadcrumbList; case studies CreativeWork; posts BlogPosting. Never add prices or ratings.
- llms.txt: facts first, disambiguation line, Q&A that mirrors how people ask. Add any new page there and to `sitemap.ts`.
- When you edit static page copy, bump `STATIC_UPDATED` in `src/data/landing.ts` so the sitemap lastmod moves.
- Verify: `pnpm exec next typegen && pnpm typecheck`, then `pnpm build`. Re-run the local audit and confirm the score went up and no new errors appeared. Screenshot changed public pages in light and dark, desktop and mobile (set reduced motion, or scroll-reveal sections render blank in full-page shots).

### 4. Record and report

- Import the snapshot, store the audit run, and check `<admin>/seo` renders (KPIs, keyword table, AI grid, actions).
- Report to Ahmed: what moved since the last run (positions, audit average, citations), what you changed and why, and a short list of things only he can do (Search Console, Bing Webmaster Tools, API keys, profile updates elsewhere, Upwork URL), with links.

## Things only Ahmed can do (check whether they're done each run)

- Google Search Console: request indexing, resubmit the sitemap; create a service account with read access and set `GSC_SERVICE_ACCOUNT_JSON` + `GSC_SITE_URL` in Vercel for real positions.
- Bing Webmaster Tools: import from GSC (feeds ChatGPT search and Copilot).
- A SERP key (`SERPER_API_KEY` or `SERPAPI_API_KEY`) or `FIRECRAWL_API_KEY` in Vercel and `.env.local`.
- `CRON_SECRET` set, and the cron added to `vercel.json`: `{ "path": "/api/cron/seo", "schedule": "0 5 * * 1" }`.
- Profiles that disagree with the site: GitHub bio, Himalayas, F6S, Happenstance, old Scribd CVs.
- Real LinkedIn and X URLs (not dub.sh) in Site data so `sameAs` matches the profiles; `NEXT_PUBLIC_UPWORK_URL` or the Upwork field set.
- `noindex` on unrelated subdomains (stock., pinpund., tr., multy-app.xerk.io).
