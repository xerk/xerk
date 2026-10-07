---
name: link-to-video
description: Turn any URL (a project, case study, blog post or product) into a short xerk-branded promo video and optionally schedule it to LinkedIn/X via Postiz (post.xerk.io).
---

# link-to-video

Runbook: URL -> captured source -> beat sheet -> branded MP4 -> attached to the site -> (optional) scheduled social post.
Follow the steps in order. Do not skip the confirmation gate in step 6.

## 0. Input

```
/link-to-video <url> [target=linkedin|x|both] [length=15|30|60] [aspect=16:9|9:16|1:1]
```

Defaults: `target=both`, `length=30`, `aspect` = `9:16` for x-only, `1:1` for linkedin-only, `16:9` for both (or render one per network if the user asks).

Derive `<slug>`: for `xerk.io/work/<slug>` or `xerk.io/blog/<slug>` use the last path segment; otherwise kebab-case the page title (max 40 chars). All work lives in `studio/<slug>/`:

```
studio/<slug>/
  source/      page.md, screenshot-*.png, branding.json, facts.json
  script.md    beat sheet
  comp/        composition project (hyperframes or remotion)
  out/         <slug>-<aspect>-<length>s.mp4, captions.srt
```

## 1. Capture

Preferred: Firecrawl MCP.

```
firecrawl_scrape { url, formats: ["markdown", "screenshot", "branding"], onlyMainContent: true }
```

- Save markdown to `source/page.md`, branding to `source/branding.json`, download the screenshot to `source/screenshot-hero.png`.
- For more frames (full page, mobile, specific sections) use `actions` (`scroll`, `screenshot` with `fullPage`) or the Playwright MCP (`browser_navigate`, `browser_resize`, `browser_take_screenshot`).
- For xerk.io pages, also read the local source (`content/`, `src/data/`) when it is richer than the rendered page.
- Extract into `source/facts.json`: title, one-line summary, 3-6 key numbers (each with its exact source sentence), stack/tags, any client/role. **Only use numbers that literally appear on the page.** No invented metrics.

## 2. Script

Write `studio/<slug>/script.md` as a beat sheet. Budget by `length`:

| length | hook | proof beats | CTA |
|---|---|---|---|
| 15s | 0-2s | 3 x ~3.5s | last 2.5s |
| 30s | 0-2s | 4 x ~6s | last 4s |
| 60s | 0-2s | 5 x ~10s | last 6s |

Template:

```md
# <Title> - <length>s / <aspect>
Source: <url>

| # | t (s) | on-screen text (<= 7 words) | visual | caption / VO line |
|---|---|---|---|---|
| 0 | 0-2 | HOOK: the sharpest number or claim | hero screenshot punch-in | ... |
| 1 | ... | proof: <real number> <what it means> | screenshot crop / stat card | ... |
| ... |
| N | ... | xerk.io | logo lockup + URL | "More at xerk.io" |
```

Rules: hook lands inside 2s; each proof beat carries one real number or concrete fact from `facts.json`; CTA is always `xerk.io` (or the full page URL beneath it). Show the script to the user only if they asked to review; otherwise continue.

## 3. Render

Preferred: the installed `product-launch-video` skill (URL/brief -> promo) on top of `hyperframes` (`hyperframes-core`, `hyperframes-animation`, `hyperframes-cli` for lint/check/render). Fallback: `remotion-best-practices` -> `remotion-create` / `remotion-captions` / `remotion-render`.

Hand the render skill: `script.md`, `facts.json`, the screenshots, the brand block below, `length`, `aspect`. Build the project in `studio/<slug>/comp/` and render to `studio/<slug>/out/<slug>-<aspect>-<length>s.mp4`.

Requirements:
- Burned-in captions for every line (most social views are muted) + export `out/captions.srt`.
- Validate before render (`hyperframes check` / Remotion studio preview); snapshot hook + CTA frames and eyeball them.
- 30 fps, H.264 MP4, AAC audio if any; target < 50 MB (X limit 512 MB, LinkedIn 5 GB, but smaller uploads faster).
- Music optional (subtle, ducked under VO). No stock "corporate" vibes.

### Brand rules (xerk)

| token | value |
|---|---|
| background | near-black `#0a0a0a` (dark-first; never a white canvas) |
| foreground | `#fafafa`, muted `#a1a1aa` |
| accent | lime `#c6f432` (highlights, numbers, cursor, progress bar) |
| AI accent | violet `#9b7cff` (only for AI/LLM-related beats) |
| fonts | Geist (headlines/body), Geist Mono (labels, numbers, logo) |
| style | game-style HUD: thin 1px borders, corner brackets, mono labels like `[ 01 / PROOF ]`, subtle grid/scanlines, XP-bar style progress |
| logo | lowercase `xerk` in Geist Mono + blinking lime block cursor `█` (~1 Hz). Flat 2D. **No 3D logo**, no gradients on the wordmark |
| motion | snappy, ease-out, 150-400ms; punch-ins on screenshots; numbers count up |
| safe area | keep text within 90% title-safe; for 9:16 keep clear of the bottom 20% (platform UI) |

## 4. Attach to the site

If `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (check `.env.local`):

```ts
// run with: pnpm dlx tsx studio/<slug>/attach.ts
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const slug = "<slug>";
const file = await readFile(`studio/${slug}/out/${slug}-16x9-30s.mp4`);

const { error: upErr } = await supabase.storage
  .from("videos")
  .upload(`${slug}.mp4`, file, { contentType: "video/mp4", upsert: true });
if (upErr) throw upErr;

const { data } = supabase.storage.from("videos").getPublicUrl(`${slug}.mp4`);
const { error: dbErr } = await supabase.from("projects").update({ video_url: data.publicUrl }).eq("slug", slug);
if (dbErr) throw dbErr;
console.log(data.publicUrl);
```

Equivalent SQL (after upload): `update projects set video_url = '<public-url>' where slug = '<slug>';`
The `videos` bucket must be public (or serve signed URLs). If the `projects` row does not exist, report it; do not create one.

Otherwise (no Supabase): `cp studio/<slug>/out/<file>.mp4 public/videos/<slug>.mp4` and report the path `/videos/<slug>.mp4` so the user can reference it in `src/data` / `content`. Public URL for Postiz: `https://xerk.io/videos/<slug>.mp4` (only valid after deploy; otherwise upload the local file via Postiz instead).

## 5. Distribute (Postiz MCP, post.xerk.io)

Only if `target` is set and the user wants posting.

1. `integrationList` -> pick the LinkedIn and/or X integration ids (match by provider + name). If missing, stop and tell the user to connect the channel at post.xerk.io.
2. `integrationSchema` for each -> respect required settings and character limits (X: 280 chars incl. link; LinkedIn: ~3000).
3. `uploadFromUrlTool` with the public video URL (Supabase or deployed site) -> keep the returned media id/path.
4. Draft the caption per network (template below) with the UTM-tagged link:
   `<url>?utm_source=<linkedin|x>&utm_medium=social&utm_campaign=<slug>` (use `&` if the URL already has a query string).
5. Propose a schedule time (default: next weekday 09:30 in the user's timezone for LinkedIn, 15:00 for X), in ISO 8601 with offset.

### 6. Confirmation gate (mandatory)

Show the user, per network: integration name, caption (exact text), video file, scheduled time. **Do not call `integrationSchedulePostTool` until the user explicitly confirms.** Apply edits and re-show if they change anything.

Then call `integrationSchedulePostTool` once per network (or once with both integrations if the schema allows) and record the returned post ids. Use `postsListTool` to verify they appear.

### Caption template

```
<hook line - the same claim as the video's first 2s>

<1-2 lines of proof with the real numbers>
<optional: stack / role in one line>

<CTA verb> -> <utm-tagged url>

#<tag1> #<tag2> #<tag3>
```

- LinkedIn: 3-6 short lines, first-person, max 3 hashtags, link at the end.
- X: one punchy line + link, max 1-2 hashtags, total <= 280 chars.
- No emojis spam, no "excited to announce", no fabricated numbers.

## 7. Report

Return:
- `studio/<slug>/script.md`, the MP4 path(s), `captions.srt`
- duration (verify with `ffprobe -v error -show_entries format=duration -of csv=p=0 <mp4>`), aspect, file size
- where it was attached (Supabase public URL + updated row, or `public/videos/<slug>.mp4`)
- Postiz post ids, networks and scheduled times (or "not scheduled")

## Checklist

- [ ] slug derived; `studio/<slug>/{source,out}` created
- [ ] page captured: markdown + screenshot(s) + branding; `facts.json` with sourced numbers
- [ ] `script.md`: hook <= 2s, 3-5 proof beats with real numbers, CTA `xerk.io`
- [ ] composition uses xerk tokens, Geist/Geist Mono, mono `xerk` + blinking lime cursor, no 3D logo
- [ ] captions burned in + `captions.srt`
- [ ] MP4 rendered, duration matches `length` (+/- 1s), aspect correct
- [ ] attached: Supabase `videos` + `projects.video_url`, or `public/videos/<slug>.mp4`
- [ ] UTM params on every link
- [ ] caption + time shown to user and **confirmed** before scheduling
- [ ] post ids reported
