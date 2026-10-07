// The dashboard lives at a private, unguessable path (ADMIN_PATH env, server-only) instead of /admin.
// The route folder is src/app/[console]; any other value of that segment 404s.
export const ADMIN_SEGMENT = (process.env.ADMIN_PATH || "admin").replace(/^\/+|\/+$/g, "");
export const ADMIN_BASE = `/${ADMIN_SEGMENT}`;
export const adminHref = (p = "") => ADMIN_BASE + p;
