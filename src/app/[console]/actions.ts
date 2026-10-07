"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/supabase";
import { getAdminUser } from "@/lib/supabase/server";
import { markdownToHtml } from "@/lib/posts";
import { adminHref } from "@/lib/admin-path";
import type { Project } from "@/data/projects";

// Every write in /admin goes through here: verify the session belongs to an admin, then use the service role.

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

const MEDIA_BUCKET = "media";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEAD_STATUSES = ["new", "replied", "won", "lost", "spam"] as const;

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not signed in as an admin.");
  const db = adminDb();
  if (!db) throw new Error("Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY).");
  return { user, db };
}

async function run<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn(), message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const PUBLIC_PATHS = ["/", "/blog", "/work", "/ai", "/play", "/cv", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/rss.xml"];

/** Make edits live: every listing/feed page, the affected detail pages, and the root layout (the ⌘K palette lists posts and projects). */
function revalidatePublic(extra: string[] = []) {
  [...PUBLIC_PATHS, ...extra].forEach((p) => revalidatePath(p));
  revalidatePath("/", "layout");
  revalidatePath(adminHref(), "layout");
}

const hasContentFile = (slug: string) => SLUG_RE.test(slug) && fs.existsSync(path.join(process.cwd(), "content", slug, "index.mdx"));

/* ---------------- Posts ---------------- */

export type PostInput = {
  originalSlug?: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  body_md: string;
  cover_url: string;
  video_url: string;
  status: "draft" | "published";
  published_at: string; // YYYY-MM-DD or ""
};

export async function previewMarkdown(md: string): Promise<ActionResult<string>> {
  return run(async () => {
    await requireAdmin();
    return markdownToHtml(md);
  });
}

export async function savePost(input: PostInput): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const { db } = await requireAdmin();
    const slug = input.slug.trim();
    if (!SLUG_RE.test(slug)) throw new Error("Slug must be lowercase letters, numbers and dashes.");
    if (!input.title.trim()) throw new Error("Title is required.");
    if (input.status !== "draft" && input.status !== "published") throw new Error("Bad status.");
    const renamed = input.originalSlug && input.originalSlug !== slug;
    if (renamed || !input.originalSlug) {
      const { data: clash } = await db.from("posts").select("slug").eq("slug", slug).maybeSingle();
      if (clash) throw new Error(`A post with the slug "${slug}" already exists.`);
    }
    const publishedAt = input.published_at || (input.status === "published" ? new Date().toISOString().slice(0, 10) : "");
    const row = {
      slug,
      title: input.title.trim(),
      summary: input.summary.trim() || null,
      tags: input.tags.map((t) => t.trim()).filter(Boolean),
      body_md: input.body_md,
      cover_url: input.cover_url.trim() || null,
      video_url: input.video_url.trim() || null,
      status: input.status,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("posts").upsert(row);
    if (error) throw new Error(error.message);
    if (renamed) await retirePost(db, input.originalSlug!);
    revalidatePublic([`/blog/${slug}`, ...(renamed ? [`/blog/${input.originalSlug}`] : [])]);
    return { slug };
  }, input.status === "published" ? "Published" : "Saved");
}

/** Remove a post row. If a content/ file has the same slug, keep a draft row instead so the file doesn't reappear. */
async function retirePost(db: NonNullable<ReturnType<typeof adminDb>>, slug: string): Promise<"deleted" | "unpublished"> {
  if (hasContentFile(slug)) {
    const { error } = await db.from("posts").update({ status: "draft", updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) throw new Error(error.message);
    return "unpublished";
  }
  const { error } = await db.from("posts").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  return "deleted";
}

export async function setPostStatus(slug: string, status: "draft" | "published"): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    const patch: Record<string, string> = { status, updated_at: new Date().toISOString() };
    if (status === "published") {
      const { data } = await db.from("posts").select("published_at").eq("slug", slug).maybeSingle();
      if (!data?.published_at) patch.published_at = new Date().toISOString();
    }
    const { error } = await db.from("posts").update(patch).eq("slug", slug);
    if (error) throw new Error(error.message);
    revalidatePublic([`/blog/${slug}`]);
    return undefined;
  }, status === "published" ? "Published" : "Unpublished");
}

export async function deletePost(slug: string): Promise<ActionResult> {
  try {
    const { db } = await requireAdmin();
    const how = await retirePost(db, slug);
    revalidatePublic([`/blog/${slug}`]);
    return { ok: true, message: how === "deleted" ? "Deleted" : `content/${slug}/index.mdx is in the repo, so the post was unpublished instead. Delete that folder to remove it for good.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/* ---------------- Projects ---------------- */

export type ProjectInput = { originalSlug?: string; project: Project; published: boolean };

export async function saveProject(input: ProjectInput): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const { db } = await requireAdmin();
    const p = { ...input.project };
    p.slug = p.slug.trim();
    if (!SLUG_RE.test(p.slug)) throw new Error("Slug must be lowercase letters, numbers and dashes.");
    if (!p.title?.trim()) throw new Error("Title is required.");
    if (!p.code?.trim()) throw new Error("Code is required (e.g. 1-7).");
    p.updated = new Date().toISOString().slice(0, 7);
    const renamed = input.originalSlug && input.originalSlug !== p.slug;
    let sort: number;
    const { data: existing } = await db.from("projects").select("slug,sort").eq("slug", input.originalSlug || p.slug).maybeSingle();
    if (input.originalSlug && existing) sort = existing.sort;
    else {
      if (existing) throw new Error(`A project with the slug "${p.slug}" already exists.`);
      const { data: last } = await db.from("projects").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
      sort = (last?.sort ?? -1) + 1;
    }
    if (renamed) {
      const { data: clash } = await db.from("projects").select("slug").eq("slug", p.slug).maybeSingle();
      if (clash) throw new Error(`A project with the slug "${p.slug}" already exists.`);
    }
    // Drop empty optionals so the jsonb stays tidy.
    const data = JSON.parse(JSON.stringify(p, (_k, v) => (v === "" || v === undefined ? undefined : v)));
    const row = { slug: p.slug, code: p.code.trim(), title: p.title.trim(), data, video_url: p.video || null, embed_url: p.embedUrl || null, published: input.published, sort, updated_at: new Date().toISOString() };
    const { error } = await db.from("projects").upsert(row);
    if (error) throw new Error(error.message);
    if (renamed) {
      await db.from("projects").delete().eq("slug", input.originalSlug!);
      // Keep an uploaded demo reachable at the new slug.
      const { data: demo } = await db.from("demos").select("html").eq("slug", input.originalSlug!).maybeSingle();
      if (demo) await db.from("demos").upsert({ slug: p.slug, html: demo.html, updated_at: new Date().toISOString() });
    }
    revalidatePublic([`/work/${p.slug}`, ...(renamed ? [`/work/${input.originalSlug}`] : [])]);
    return { slug: p.slug };
  }, "Saved");
}

export async function setProjectPublished(slug: string, published: boolean): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    const { error } = await db.from("projects").update({ published, updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) throw new Error(error.message);
    revalidatePublic([`/work/${slug}`]);
    return undefined;
  }, published ? "Published" : "Hidden");
}

export async function reorderProjects(slugs: string[]): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    const results = await Promise.all(slugs.map((slug, sort) => db.from("projects").update({ sort }).eq("slug", slug)));
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    revalidatePublic(slugs.map((s) => `/work/${s}`));
    return undefined;
  }, "Order saved");
}

export async function deleteProject(slug: string): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    const { error } = await db.from("projects").delete().eq("slug", slug);
    if (error) throw new Error(error.message);
    await db.from("demos").delete().eq("slug", slug);
    revalidatePublic([`/work/${slug}`]);
    return undefined;
  }, "Deleted");
}

/**
 * Demo/artifact HTML: the browser uploads the file to the media bucket (signed URL), then this copies it
 * into the `demos` table, served as text/html by /demos/[slug] (Storage serves .html as text/plain).
 */
export async function importDemo(slug: string, storagePath: string): Promise<ActionResult<{ embedUrl: string }>> {
  return run(async () => {
    const { db } = await requireAdmin();
    if (!SLUG_RE.test(slug)) throw new Error("Save the project with a valid slug first.");
    assertMediaPath(storagePath);
    const { data: blob, error } = await db.storage.from(MEDIA_BUCKET).download(storagePath);
    if (error || !blob) throw new Error(error?.message || "Could not read the uploaded file.");
    const html = await blob.text();
    if (!/<html|<body|<script|<div|<!doctype/i.test(html)) throw new Error("That file doesn't look like HTML.");
    const { error: e2 } = await db.from("demos").upsert({ slug, html, updated_at: new Date().toISOString() });
    if (e2) throw new Error(e2.message);
    revalidatePath(`/demos/${slug}`);
    return { embedUrl: `/demos/${slug}` };
  }, "Demo uploaded");
}

/* ---------------- Media ---------------- */

function assertMediaPath(p: string) {
  if (!/^[a-z0-9][a-z0-9._/-]*$/i.test(p) || p.includes("..") || p.includes("//") || p.length > 300) throw new Error("Invalid file path.");
}

/** Clean a user file name into something safe for a storage key. */
function safeName(name: string) {
  const ext = (name.match(/\.([a-z0-9]{1,8})$/i)?.[1] || "bin").toLowerCase();
  const base = name.replace(/\.[^.]*$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  return { base, ext };
}

/**
 * Signed upload URL so the browser uploads straight to Supabase Storage (bypasses the 4.5 MB Vercel body limit).
 * `fixedName` (e.g. "cover", "preview", "demo") gives a stable path that's overwritten on re-upload.
 */
export async function createUploadUrl(folder: string, fileName: string, fixedName?: string): Promise<ActionResult<{ path: string; token: string; publicUrl: string }>> {
  return run(async () => {
    const { db } = await requireAdmin();
    const dir = folder.replace(/^\/+|\/+$/g, "");
    assertMediaPath(dir || "uploads");
    const { base, ext } = safeName(fileName);
    const name = fixedName ? `${fixedName}.${ext}` : `${Date.now().toString(36)}-${base}.${ext}`;
    const filePath = dir ? `${dir}/${name}` : name;
    assertMediaPath(filePath);
    const { data, error } = await db.storage.from(MEDIA_BUCKET).createSignedUploadUrl(filePath, { upsert: true });
    if (error || !data) throw new Error(error?.message || "Could not create an upload URL.");
    const publicUrl = db.storage.from(MEDIA_BUCKET).getPublicUrl(filePath).data.publicUrl;
    // Cache-bust fixed names so a re-uploaded cover shows up right away.
    return { path: filePath, token: data.token, publicUrl: fixedName ? `${publicUrl}?v=${Date.now().toString(36)}` : publicUrl };
  });
}

export async function deleteMedia(filePath: string): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    assertMediaPath(filePath);
    const { error } = await db.storage.from(MEDIA_BUCKET).remove([filePath]);
    if (error) throw new Error(error.message);
    revalidatePath(adminHref("/media"));
    return undefined;
  }, "Deleted");
}

/* ---------------- Leads ---------------- */

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) throw new Error("Bad status.");
    const { error } = await db.from("leads").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(adminHref("/leads"));
    revalidatePath(adminHref());
    return undefined;
  }, "Saved");
}

/* ---------------- Site content (profile, experience, skills…) ---------------- */

const CONTENT_SHAPES: Record<string, "object" | "array"> = {
  profile: "object", github: "object", skills: "object",
  socials: "array", stats: "array", ticker: "array", achievements: "array", experience: "array", skillTree: "array", aiStack: "array", services: "array", process: "array", hireFaq: "array",
};

function checkContent(key: string, value: unknown) {
  const shape = CONTENT_SHAPES[key];
  if (!shape) throw new Error(`Unknown section "${key}".`);
  if (shape === "array" ? !Array.isArray(value) : !value || typeof value !== "object" || Array.isArray(value)) throw new Error(`"${key}" must be a JSON ${shape}.`);
  if (JSON.stringify(value).length > 200_000) throw new Error("That's too big to save.");
  if (key === "profile") {
    const p = value as Record<string, unknown>;
    for (const f of ["name", "title", "headline", "email"]) if (!String(p[f] || "").trim()) throw new Error(`Profile ${f} is required.`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email))) throw new Error("Profile email isn't valid.");
    if (!Number.isFinite(Number(p.years))) throw new Error("Years must be a number.");
  }
  if (key === "experience") {
    (value as Record<string, unknown>[]).forEach((e, i) => {
      for (const f of ["company", "role", "period"]) if (!String(e[f] || "").trim()) throw new Error(`Experience #${i + 1}: ${f} is required.`);
      for (const f of ["objectives", "loot", "stack"]) if (!Array.isArray(e[f])) throw new Error(`Experience #${i + 1}: ${f} must be a list.`);
    });
  }
  if (key === "socials") {
    (value as Record<string, unknown>[]).forEach((s, i) => { if (!/^https?:\/\//.test(String(s.href || ""))) throw new Error(`Link #${i + 1} needs a full https:// URL.`); });
  }
}

/** Save one site_content section; every public page reads it, so revalidate the whole site. */
export async function saveContent(key: string, value: unknown): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    checkContent(key, value);
    const { error } = await db.from("site_content").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    revalidatePublic(["/hire", "/uses", "/now", "/cv"]);
    return undefined;
  }, "Saved. The site is updating.");
}

/** Drop a section's row so the site falls back to the defaults in src/data/profile.ts. */
export async function resetContent(key: string): Promise<ActionResult> {
  return run(async () => {
    const { db } = await requireAdmin();
    if (!CONTENT_SHAPES[key]) throw new Error(`Unknown section "${key}".`);
    const { error } = await db.from("site_content").delete().eq("key", key);
    if (error) throw new Error(error.message);
    revalidatePublic(["/hire", "/uses", "/now", "/cv"]);
    return undefined;
  }, "Reset to the built-in defaults.");
}
