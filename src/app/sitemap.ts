import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/profile";
import { LANDINGS, STATIC_UPDATED } from "@/data/landing";
import { getProjects } from "@/lib/projects";
import { getPosts } from "@/lib/posts";

const day = (s?: string) => {
  const d = s ? new Date(s.length === 7 ? `${s}-01` : s) : null;
  return d && !Number.isNaN(d.getTime()) ? d : new Date(STATIC_UPDATED);
};
const latest = (...dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime())));

// lastmod is the real date the content changed (post date, project "updated", STATIC_UPDATED), never the build time.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);
  const staticDate = day(STATIC_UPDATED);
  const postDate = posts.length ? latest(...posts.map((p) => day(p.publishedAt))) : staticDate;
  const workDate = projects.length ? latest(...projects.map((p) => day(p.updated))) : staticDate;
  const aiDate = latest(staticDate, ...projects.filter((p) => p.ai).map((p) => day(p.updated)));

  const page = (path: string, lastModified: Date, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority });
  return [
    page("", latest(staticDate, postDate, workDate), 1, "weekly"),
    page("/hire", staticDate, 0.9),
    ...LANDINGS.map((l) => page(`/hire/${l.slug}`, staticDate, 0.9)),
    page("/work", workDate, 0.9),
    page("/ai", aiDate, 0.8),
    page("/blog", postDate, 0.8, "weekly"),
    page("/cv", staticDate, 0.7),
    page("/uses", staticDate, 0.5),
    page("/now", staticDate, 0.5),
    page("/play", staticDate, 0.4),
    ...projects.map((p) => page(`/work/${p.slug}`, day(p.updated), 0.8)),
    ...posts.map((p) => page(`/blog/${p.slug}`, day(p.publishedAt), 0.6, "yearly")),
  ];
}
