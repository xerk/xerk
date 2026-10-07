# xerk.io — v2

The portfolio, CV and freelance site of **Ahmed Mamdouh**, senior full-stack & AI engineer. It is played like a game: a 3D connection-globe hero, a player card, project *stages*, achievements, a skill tree, a quest log and a working terminal. Every number on it comes from the CV or GitHub.

- **Design system:** [xerk Design System](https://claude.ai/artifact/LCe6FheYqPqkyJPYSgozKR). It covers the tokens, components, Home / Case study / Hire page layouts, motion and the SEO playbook.
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, GSAP, Three.js, AI SDK 7 (Vercel AI Gateway), PostHog, Supabase and Telegram.

## Run it

```bash
pnpm install
cp .env.example .env.local   # every integration is optional; the site works without them
pnpm dev
```

`pnpm build` builds the site, `pnpm typecheck` runs the type checker, and `pnpm seed` pushes projects and posts to Supabase.

## Where things live

| What | Where |
|---|---|
| Profile, CV, stats, achievements, skill tree, services | `src/data/profile.ts` (single source of truth) |
| Case studies (`/work/[slug]`) | `src/data/projects.ts` — set `embedUrl` to a **public** Claude artifact to enable "Play the demo" |
| Field notes (`/blog`) | `content/<slug>/index.mdx` (plus published rows in the Supabase `posts` table) |
| Design-system components | `src/components/xerk/` (`ui.tsx` server, `client.tsx` interactive, `chrome.tsx` header/footer/⌘K) |
| Tokens and styles | `src/styles/tokens.css`, `src/styles/xerk.css` (ported from the design system) |
| Motion (GSAP) | `src/lib/motion.ts` — reveal on scroll, split headlines, scramble, count-up, magnetic CTA |
| SEO / AI search | `src/lib/seo.tsx` (JSON-LD), `/og`, `/sitemap.xml`, `/robots.txt` (AI crawlers allowed), `/llms.txt`, `/llms-full.txt`, `/rss.xml` |

## Pages

- `/` — the game: hero scene, player card, level select, achievements, skill tree, quest log, terminal plus Ask my CV, GitHub heatmap, notes.
- `/work` and `/work/[slug]` — case studies, each with a TL;DR, a table of contents, a demo embed, metrics, an FAQ and JSON-LD.
- `/blog` and `/blog/[slug]` — field notes.
- `/ai` — AI work with Ask my CV.
- `/hire` — services, process, FAQ and the lead form.
- `/cv` — HTML CV plus the PDF.
- `/uses` and `/now`.
- `/admin` (password) — traffic, leads, visits and an integrations checklist.
- `/studio` (password) — the link → video tool.

## Integrations (set in Vercel → Environment Variables)

| Feature | Env vars | Without them |
|---|---|---|
| Analytics (proxied via `/ingest`) | `NEXT_PUBLIC_POSTHOG_KEY` | no analytics |
| Telegram: visitor pings, leads, `/stats` `/week` `/leads`, daily digest | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET` | silent |
| Stats in the digest and `/admin` | `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` (or Supabase `visits`) | "n/a" |
| Leads, visits and content in the DB | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | leads still go to Telegram |
| Ask my CV with an LLM | `AI_GATEWAY_API_KEY` (or Vercel OIDC), `AI_MODEL` | keyword search over the CV and case studies |
| Live GitHub heatmap | `GITHUB_TOKEN` | committed snapshot |
| Admin and studio | `ADMIN_PASSWORD` | `/admin` returns 404 |
| Upwork link, booking link | `NEXT_PUBLIC_UPWORK_URL`, `NEXT_PUBLIC_BOOKING_URL` | placeholder Upwork URL, mailto |

**Telegram setup (one command):** create a bot with @BotFather, send it any message, then run `bash scripts/telegram-setup.sh <BOT_TOKEN>` and redeploy.

**Telegram setup (manual):**
1. Create a bot with @BotFather.
2. Message the bot.
3. Get your chat id from @userinfobot.
4. Register the webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://www.xerk.io/api/telegram&secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

**Supabase setup:**
1. Create a project, or add it from the Vercel Marketplace so the env vars sync automatically.
2. Run `supabase/migrations/0001_init.sql`.
3. Run `pnpm seed`.

## Link → video (Phase 5)

Run `/link-to-video https://xerk.io/work/alto` in Claude Code. It scrapes the page, writes a script from real numbers, renders a branded video with HyperFrames, attaches it to the project and schedules it through Postiz (post.xerk.io) after you confirm. See `.claude/skills/link-to-video/SKILL.md` and `docs/postiz.md`.

## Demos

The interactive demos are self-contained pages in `public/demos/` (`alto.html` is a reconnect-storm simulator, `agent.html` is an AI agent and MCP trace playground). The case studies load them through `embedUrl`. They follow the site theme via `?theme=`.

## Content rules

- Numbers must be real and match the CV.
- Game words go in labels and buttons. The `h1`, the meta description and the JSON-LD stay plain ("senior full-stack & AI engineer").
- Every case study opens with an answer-first TL;DR sentence. AI assistants quote it.
