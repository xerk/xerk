# studio

Working folder for the `link-to-video` skill (`.claude/skills/link-to-video/SKILL.md`): turns a URL into a short xerk-branded promo video and optionally schedules it to LinkedIn / X via Postiz (post.xerk.io).

Everything in here except this README is gitignored (`studio/*/`). Each run writes to its own folder:

```
studio/<slug>/
  source/     scraped markdown, screenshots, branding.json, facts.json
  script.md   beat sheet (hook, proof beats, CTA)
  comp/       HyperFrames / Remotion composition
  out/        rendered MP4(s) + captions.srt
```

Final videos that ship with the site are copied to `public/videos/<slug>.mp4` or uploaded to Supabase Storage (`videos` bucket), so nothing here needs to be committed.

## Usage

In Claude Code, from the repo root:

```
/link-to-video https://xerk.io/work/alto
/link-to-video https://xerk.io/blog/some-post target=x length=15 aspect=9:16
```

Options: `target=linkedin|x|both`, `length=15|30|60`, `aspect=16:9|9:16|1:1`.

Requirements: Firecrawl or Playwright MCP (capture), the `hyperframes` / `product-launch-video` skills (or Remotion skills) for rendering, and the Postiz MCP for scheduling. The skill always asks for confirmation before scheduling a post. See `docs/postiz.md` for the Postiz setup.

To clean up: `rm -rf studio/<slug>`.
