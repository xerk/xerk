import { notFound } from "next/navigation";
import { ADMIN_SEGMENT } from "@/lib/admin-path";

export const dynamic = "force-dynamic";

// [console] is a catch-all top-level segment; only the private ADMIN_PATH value is a real page.
export default async function ConsoleGate({ children, params }: { children: React.ReactNode; params: Promise<{ console: string }> }) {
  if ((await params).console !== ADMIN_SEGMENT) notFound();
  return children;
}
