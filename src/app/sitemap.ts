import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/profile";
import { getProjects } from "@/lib/projects";
import { getPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/work", "/ai", "/hire", "/blog", "/cv", "/uses", "/now", "/play"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : p === "/hire" || p === "/work" ? 0.9 : 0.7 }));
  const projects = await getProjects();
  const work = projects.map((p) => ({ url: `${SITE_URL}/work/${p.slug}`, lastModified: p.updated ? new Date(p.updated + "-01") : new Date(), changeFrequency: "monthly" as const, priority: 0.8 }));
  const posts = (await getPosts()).map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.publishedAt), changeFrequency: "yearly" as const, priority: 0.6 }));
  return [...pages, ...work, ...posts];
}
