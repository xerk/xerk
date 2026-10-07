import snapshot from "@/data/github-weeks.json";
import { github } from "@/data/profile";

/** Contribution calendar: live from GitHub when GITHUB_TOKEN is set (cached daily), else the committed snapshot. */
export async function getContributions(): Promise<{ weeks: number[][]; total: number }> {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ query: `{ user(login: "${github.user}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } } } } }` }),
        next: { revalidate: 86400 },
      });
      const json = await res.json();
      const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
      if (cal) return { total: cal.totalContributions, weeks: cal.weeks.map((w: { contributionDays: { contributionCount: number }[] }) => w.contributionDays.map((d) => d.contributionCount)) };
    } catch {}
  }
  return { weeks: snapshot as number[][], total: github.total };
}

export const SITE_REPO = process.env.NEXT_PUBLIC_SITE_REPO || "xerk/xerk";

/** Star count for the site's repo, cached for an hour. Returns null if GitHub is unreachable. */
export async function getRepoStars(repo = SITE_REPO): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: process.env.GITHUB_TOKEN ? { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } : {},
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()).stargazers_count ?? null;
  } catch {
    return null;
  }
}
