import posthog, { type CaptureResult } from "posthog-js";

// Rejections from the JS bridge of Microsoft's email link scanners (CefSharp), not our code.
function isLinkScannerError(e: CaptureResult) {
  if (e.event !== "$exception") return false;
  const exceptions: { value?: string }[] = e.properties.$exception_list ?? [];
  return exceptions.some((x) => /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/.test(x.value ?? ""));
}

// Runs before the app hydrates, so PostHog is ready for the first pageview.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (KEY && !/bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) {
  posthog.init(KEY, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
    defaults: "2025-05-24", // SPA pageviews on route change, pageleave, modern defaults
    person_profiles: "identified_only",
    // Drop everything from the owner's own browser (xk_owner cookie, set by src/proxy.ts on sign-in),
    // and link-scanner bridge errors.
    before_send: (e) => (!e || /(?:^|; )xk_owner=1/.test(document.cookie) || isLinkScannerError(e) ? null : e),
  });
}
