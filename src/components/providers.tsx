"use client";

import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { track, sessionId } from "@/lib/track";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!/bot|crawl|spider|headless/i.test(navigator.userAgent)) track("pageview");
  }, [pathname, search]);
  return null;
}

/** Pings Telegram once per browser session so the owner knows real people are visiting. */
function VisitPing() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("xk:pinged") || /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) return;
      sessionStorage.setItem("xk:pinged", "1");
      const params = new URLSearchParams(location.search);
      fetch("/api/visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sid: sessionId(), path: location.pathname, referrer: document.referrer, utm_source: params.get("utm_source"), utm_medium: params.get("utm_medium"), lang: navigator.language, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Suspense fallback={null}><PageViews /></Suspense>
        <VisitPing />
        {children}
      </ThemeProvider>
    </PostHogProvider>
  );
}
