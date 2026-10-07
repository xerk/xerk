import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SITE_URL } from "@/data/profile";
import { getSite } from "@/lib/content";
import { adminDb } from "@/lib/supabase";
import { esc, sendTelegram } from "@/lib/telegram";

// Tadween (post.xerk.io) "Website" channel webhook.
//   GET    verify the token, return the channel's display name/avatar
//   POST   create or update a blog post (upsert on external_id)
//   DELETE ?external_id=… unpublish
// Auth: Bearer TADWEEN_WEBHOOK_SECRET. POSTs are also checked against X-Tadween-Signature
// (HMAC-SHA256 of "<timestamp>.<raw body>" keyed with the same secret, max 5 minutes old) when present.

const SECRET = process.env.TADWEEN_WEBHOOK_SECRET;
const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function authorized(req: NextRequest) {
  if (!SECRET) return false;
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") && safeEqual(h.slice(7).trim(), SECRET);
}

function signatureOk(req: NextRequest, raw: string): string | null {
  const ts = req.headers.get("x-tadween-timestamp");
  const sig = req.headers.get("x-tadween-signature");
  if (!ts && !sig) return null; // unsigned is allowed (Bearer already checked)
  if (!ts || !sig) return "Incomplete signature headers.";
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return "Signature timestamp is too old.";
  const expected = "sha256=" + crypto.createHmac("sha256", SECRET!).update(`${ts}.${raw}`).digest("hex");
  return safeEqual(sig, expected) ? null : "Signature mismatch.";
}

const Body = z.object({
  external_id: z.string().min(1).max(200),
  title: z.string().trim().min(1, "Title is required.").max(200),
  body_md: z.string().max(200_000).optional().default(""),
  body_html: z.string().max(400_000).optional(),
  summary: z.string().max(600).optional().nullable(),
  tags: z.array(z.string().max(40)).max(12).optional().default([]),
  cover_url: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  status: z.enum(["published", "draft"]).optional().default("published"),
  publish_at: z.string().optional().nullable(),
  lang: z.string().max(10).optional().nullable(),
  dir: z.enum(["ltr", "rtl"]).optional().nullable(),
});

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 80).replace(/^-|-$/g, "");
const stripHtml = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const cleanTag = (t: string) => t.replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, "-");

function revalidate(slug: string) {
  ["/", "/blog", `/blog/${slug}`, "/rss.xml", "/sitemap.xml", "/llms.txt", "/llms-full.txt"].forEach((p) => revalidatePath(p));
  revalidatePath("/", "layout");
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return fail(401, "Invalid token.");
  const { profile } = await getSite();
  return NextResponse.json({ ok: true, name: profile.name, url: SITE_URL, avatar: profile.avatar.startsWith("http") ? profile.avatar : `${SITE_URL}${profile.avatar}` });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return fail(401, "Invalid token.");
  const raw = await req.text();
  const sigError = signatureOk(req, raw);
  if (sigError) return fail(401, sigError);

  let json: unknown;
  try { json = JSON.parse(raw); } catch { return fail(400, "Body must be JSON."); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return fail(422, parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
  const b = parsed.data;
  const body_md = b.body_md.trim() || (b.body_html ? stripHtml(b.body_html) : "");
  if (!body_md) return fail(422, "The post has no text.");

  const db = adminDb();
  if (!db) return fail(503, "The site's database isn't configured.");

  // Upsert on external_id: keep the slug the post already has, so its URL never changes on edit.
  const { data: existing, error: e1 } = await db.from("posts").select("slug").eq("external_id", b.external_id).maybeSingle();
  if (e1) return fail(500, "Database error, try again.");
  let slug = existing?.slug as string | undefined;
  if (!slug) {
    const base = slugify(b.title) || `post-${b.external_id.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: taken } = await db.from("posts").select("slug").eq("slug", slug).maybeSingle();
      if (!taken) break;
      slug = `${base}-${i}`;
    }
  }

  const publishedAt = b.publish_at && !Number.isNaN(Date.parse(b.publish_at)) ? new Date(b.publish_at).toISOString() : new Date().toISOString();
  const row = {
    slug,
    external_id: b.external_id,
    title: b.title,
    summary: (b.summary || body_md.replace(/[#>*_`[\]()!-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)) || null,
    tags: [...new Set(b.tags.map(cleanTag).filter(Boolean))],
    body_md,
    cover_url: b.cover_url || null,
    video_url: b.video_url || null,
    status: b.status,
    published_at: publishedAt,
    lang: b.lang || null,
    dir: b.dir || (b.lang === "ar" ? "rtl" : null),
    source: "tadween",
    updated_at: new Date().toISOString(),
  };
  const { error: e2 } = await db.from("posts").upsert(row, { onConflict: "slug" });
  if (e2) { console.error("tadween publish failed", e2.message); return fail(500, "Couldn't save the post, try again."); }

  revalidate(slug);
  const url = `${SITE_URL}/blog/${slug}`;
  if (b.status === "published") await sendTelegram(`📝 <b>${existing ? "Post updated" : "New post"} from Tadween</b>\n${esc(b.title)}\n${url}`);
  return NextResponse.json({ ok: true, url, id: slug }, { status: existing ? 200 : 201 });
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return fail(401, "Invalid token.");
  const externalId = req.nextUrl.searchParams.get("external_id");
  if (!externalId) return fail(400, "external_id is required.");
  const db = adminDb();
  if (!db) return fail(503, "The site's database isn't configured.");
  const { data } = await db.from("posts").select("slug").eq("external_id", externalId).maybeSingle();
  if (!data) return fail(404, "Already gone.");
  // Unpublish rather than delete, so it can be restored from the dashboard.
  const { error } = await db.from("posts").update({ status: "draft", updated_at: new Date().toISOString() }).eq("slug", data.slug);
  if (error) return fail(500, "Couldn't unpublish, try again.");
  revalidate(data.slug);
  return NextResponse.json({ ok: true });
}
