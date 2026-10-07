# Postiz integration

Postiz (self-hosted at **https://post.xerk.io**) is the scheduler for all social posting from this repo. Two consumers:

1. **The `link-to-video` skill** (interactive, via the Postiz MCP): video promos for projects / case studies / posts. See `.claude/skills/link-to-video/SKILL.md`.
2. **The site** (automated, via the Postiz public API): auto cross-posting of new blog posts.

## Environment

| var | example | where |
|---|---|---|
| `POSTIZ_API_URL` | `https://post.xerk.io/api` | `.env.local`, Vercel env, GitHub Actions secret |
| `POSTIZ_API_KEY` | (from Postiz -> Settings -> Public API) | same; server-only, never `NEXT_PUBLIC_` |

Optional: `POSTIZ_INTEGRATION_LINKEDIN`, `POSTIZ_INTEGRATION_X` (integration ids, so automation does not need to look them up each run).

Note: the base path of the public API differs by deployment (self-hosted backends are often served under `/api`, so the posts endpoint becomes `https://post.xerk.io/api/public/v1/posts`). Set `POSTIZ_API_URL` so that `${POSTIZ_API_URL}/public/v1/posts` resolves.

## Skill flow (MCP)

The Postiz MCP server exposes tools the skill uses in order:

1. `integrationList` -> find LinkedIn / X integration ids
2. `integrationSchema` -> per-network settings + limits
3. `uploadFromUrlTool` -> pull the rendered MP4 (Supabase public URL or `https://xerk.io/videos/<slug>.mp4`) into Postiz media
4. `integrationSchedulePostTool` -> schedule, **only after the user confirms caption + time**
5. `postsListTool` -> verify

All links are UTM-tagged: `?utm_source=<linkedin|x>&utm_medium=social&utm_campaign=<slug>`.

## Auto cross-posting new blog posts (idea)

Goal: when a new post lands in `content/` on `main`, schedule a LinkedIn + X post linking to it.

```
push to main (content/blog/*.mdx added)
  -> GitHub Action: detect added files (git diff --diff-filter=A HEAD^ HEAD -- content/)
  -> wait for Vercel production deploy (or use the deployment_status event)
  -> read frontmatter: title, summary, slug, cover/og image, draft flag
  -> skip if draft or `social: false`
  -> build captions per network + UTM link
  -> schedulePost(...) for each network, date = now + 1h (time to cancel in Postiz UI)
```

Alternative: a Vercel cron route (`/api/cron/postiz`, protected by `CRON_SECRET`) that compares the published post list with a "posted" marker (e.g. a Supabase `social_posts` table keyed by slug) and schedules anything new. The Action is simpler; the cron route works for posts published from a CMS/DB.

Safety: schedule in the future (not "now") so the owner can review/cancel in post.xerk.io; make it idempotent (record the slug + returned post id; never post a slug twice).

### Example: `schedulePost`

> **Verify against your Postiz version's API docs.** The payload below follows the Postiz public API shape at time of writing (`type`, `date`, `shortLink`, `tags`, `posts[] { integration, value[], settings }`); field names and required `settings` per provider can change between versions.

```ts
// src/lib/postiz.ts (server-only)
type PostizMedia = { id: string; path: string };

export type SchedulePostInput = {
  content: string; // caption (already UTM-tagged)
  mediaUrl?: string; // public URL of an image/video to attach
  integrations: string[]; // Postiz integration ids
  date: Date | string; // when to publish
};

const base = () => {
  const url = process.env.POSTIZ_API_URL;
  const key = process.env.POSTIZ_API_KEY;
  if (!url || !key) throw new Error("POSTIZ_API_URL / POSTIZ_API_KEY not set");
  return { url: url.replace(/\/$/, ""), key };
};

async function uploadFromUrl(mediaUrl: string): Promise<PostizMedia> {
  const { url, key } = base();
  const res = await fetch(`${url}/public/v1/upload-from-url`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({ url: mediaUrl }),
  });
  if (!res.ok) throw new Error(`Postiz upload failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function schedulePost({ content, mediaUrl, integrations, date }: SchedulePostInput) {
  const { url, key } = base();
  const image = mediaUrl ? [await uploadFromUrl(mediaUrl)] : [];

  const res = await fetch(`${url}/public/v1/posts`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "schedule", // or "draft" / "now"
      date: new Date(date).toISOString(),
      shortLink: false, // keep our UTM links intact
      tags: [],
      posts: integrations.map((id) => ({
        integration: { id },
        value: [{ content, image }],
        settings: {}, // provider-specific; check integrationSchema / API docs (e.g. X "who_can_reply_post")
      })),
    }),
  });

  if (!res.ok) throw new Error(`Postiz schedule failed: ${res.status} ${await res.text()}`);
  return res.json(); // contains the created post id(s)
}
```

Usage in a GitHub Action step (`pnpm dlx tsx scripts/crosspost.ts <slug>`) or cron route:

```ts
await schedulePost({
  content: `${title}\n\n${summary}\n\nhttps://xerk.io/blog/${slug}?utm_source=linkedin&utm_medium=social&utm_campaign=${slug}`,
  mediaUrl: `https://xerk.io/blog/${slug}/opengraph-image`,
  integrations: [process.env.POSTIZ_INTEGRATION_LINKEDIN!],
  date: new Date(Date.now() + 60 * 60 * 1000),
});
```

Build one caption per network (different `utm_source`, X <= 280 chars) and call `schedulePost` once per network rather than sharing a single caption.
