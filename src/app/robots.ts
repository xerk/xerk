import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/profile";

// Search engines and AI crawlers are welcome — being quoted by AI assistants is a goal.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/studio"] },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"], allow: "/", disallow: ["/api/", "/admin", "/studio"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
