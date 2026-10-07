import type { Metadata } from "next";
import { adminHref } from "@/lib/admin-path";
import { redirect } from "next/navigation";
import { AdminFlag, AdminNav } from "@/components/admin/shared";
import { getAdminUser } from "@/lib/supabase/server";
import { Toaster } from "@/components/admin/sheet";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The proxy already gates /admin; this is defence in depth (and gives us the email for the nav).
  const user = await getAdminUser();
  if (!user) redirect(adminHref("/login"));
  return (
    <div className="xk-admin">
      <AdminFlag />
      <AdminNav email={user.email} />
      <Toaster>
        <div className="xk-admin-main">{children}</div>
      </Toaster>
      {/* Sheets, dialogs and toasts portal here so the scoped admin styles apply. */}
      <div id="xk-admin-layer" />
    </div>
  );
}
