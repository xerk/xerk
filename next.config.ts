import type { NextConfig } from "next";

// PostHog cloud region for the /ingest reverse proxy: "us" or "eu".
const PH_REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PostHog reverse proxy so analytics survive ad blockers
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `https://${PH_REGION}-assets.i.posthog.com/static/:path*` },
      { source: "/ingest/:path*", destination: `https://${PH_REGION}.i.posthog.com/:path*` },
    ];
  },
  skipTrailingSlashRedirect: true,
  // content/ and the Geist TTFs are read at request time (ISR, llms-full.txt, /og)
  outputFileTracingIncludes: { "/**": ["./content/**/*"], "/og": ["./node_modules/geist/dist/fonts/**/*.ttf"] },
  async redirects() {
    return [
      // One host for search engines: the apex answered 200 alongside www (canonical is www), so Google indexed both.
      { source: "/:path*", has: [{ type: "host", value: "xerk.io" }], destination: "https://www.xerk.io/:path*", permanent: true },
      { source: "/resume", destination: "/cv", permanent: true },
      { source: "/work/alto", destination: "/work/realtime-device-platform", permanent: true },
      { source: "/work/alto-ai-agent", destination: "/work/ai-agent-mcp", permanent: true },
      { source: "/demos/alto.html", destination: "/demos/reconnect-storm.html", permanent: true },
    ];
  },
};

export default nextConfig;
