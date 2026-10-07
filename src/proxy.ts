import { NextResponse, type NextRequest } from "next/server";

// Basic-auth gate for /admin and /studio. Set ADMIN_PASSWORD (and optionally ADMIN_USER) in the environment.
export function proxy(req: NextRequest) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return new NextResponse("Not found", { status: 404 });
  const user = process.env.ADMIN_USER || "xerk";
  const header = req.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, p] = atob(encoded).split(":");
    if (u === user && p === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="xerk admin"' } });
}

export const config = { matcher: ["/admin/:path*", "/studio/:path*"] };
