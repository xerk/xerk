import posthog, { type CaptureResult } from "posthog-js";

// Errors thrown entirely inside scripts that in-app browsers inject (e.g. Facebook's iabjs://), not our code.
function isInjectedScriptError(e: CaptureResult) {
  if (e.event !== "$exception") return false;
  const exceptions: { stacktrace?: { frames?: { filename?: string }[] } }[] = e.properties.$exception_list ?? [];
  const frames = exceptions.flatMap((x) => x.stacktrace?.frames ?? []);
  return frames.length > 0 && frames.every((f) => f.filename?.startsWith("iabjs://"));
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
    // and errors from in-app browser scripts.
    before_send: (e) => (!e || /(?:^|; )xk_owner=1/.test(document.cookie) || isInjectedScriptError(e) ? null : e),
  });
}
