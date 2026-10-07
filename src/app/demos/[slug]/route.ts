import { adminDb } from "@/lib/supabase";

// Serves demo/artifact HTML uploaded from /admin (stored in the `demos` table, because Supabase Storage
// serves .html as text/plain). Static files in public/demos/*.html take precedence over this route.
// The CSP sandbox gives the page an opaque origin: scripts run, but it can't read xerk.io cookies or storage.
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = adminDb();
  const { data } = db ? await db.from("demos").select("html").eq("slug", slug).maybeSingle() : { data: null };
  if (!data?.html) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(data.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads; frame-ancestors 'self'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
