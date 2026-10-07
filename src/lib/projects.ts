import { cache } from "react";
import { projects as staticProjects, type Project } from "@/data/projects";
import { adminDb, publicDb } from "./supabase";

export type { Project } from "@/data/projects";

export type ProjectRow = { slug: string; code: string; title: string; data: Partial<Project> | null; video_url: string | null; embed_url: string | null; published: boolean; sort: number; updated_at?: string };

/** Turn a `projects` row into a Project: the `data` jsonb, with the column overrides on top. */
export function rowToProject(r: ProjectRow): Project {
  const d = (r.data || {}) as Partial<Project>;
  const p: Project = {
    world: "", company: "", period: "", role: "", summary: "", answer: "", boss: "", updated: "",
    takeaways: [], stack: [], metrics: [], sections: [], faq: [],
    ...d,
    slug: r.slug,
    code: r.code || d.code || "",
    title: r.title || d.title || r.slug,
  };
  // Columns win over jsonb; null columns clear the field.
  p.video = r.video_url || undefined;
  p.embedUrl = r.embed_url || undefined;
  return p;
}

/**
 * Published projects, Supabase first (ordered by `sort`), falling back to the static array in
 * src/data/projects.ts when Supabase is unconfigured, unreachable or empty.
 */
export const getProjects = cache(async (): Promise<Project[]> => {
  const db = publicDb();
  if (!db) return staticProjects;
  try {
    const { data, error } = await db.from("projects").select("slug,code,title,data,video_url,embed_url,published,sort").eq("published", true).order("sort", { ascending: true });
    if (error || !data) return staticProjects;
    if (data.length === 0) {
      // Nothing published: only fall back to static data if the table is truly empty (not everything unpublished).
      const { count } = (await adminDb()?.from("projects").select("slug", { count: "exact", head: true })) ?? { count: 0 };
      return count ? [] : staticProjects;
    }
    return (data as ProjectRow[]).map(rowToProject);
  } catch {
    return staticProjects;
  }
});

export const getProject = cache(async (slug: string): Promise<Project | undefined> => {
  return (await getProjects()).find((p) => p.slug === slug);
});
