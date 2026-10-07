import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PostHog reverse proxy so analytics survive ad blockers
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
  // content/ and the Geist TTFs are read at request time (ISR, llms-full.txt, /og)
  outputFileTracingIncludes: { "/**": ["./content/**/*"], "/og": ["./node_modules/geist/dist/fonts/**/*.ttf"] },
  async redirects() {
    return [
      { source: "/resume", destination: "/cv", permanent: true },
      { source: "/work/alto", destination: "/work/realtime-device-platform", permanent: true },
      { source: "/work/alto-ai-agent", destination: "/work/ai-agent-mcp", permanent: true },
      { source: "/demos/alto.html", destination: "/demos/reconnect-storm.html", permanent: true },
    ];
  },
};

export default nextConfig;
