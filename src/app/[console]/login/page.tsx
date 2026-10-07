import type { Metadata } from "next";
import { LoginVault } from "@/components/admin/login-form";
import { AdminFlag } from "@/components/admin/shared";
import { LogoMark } from "@/components/xerk/ui";
import { ADMIN_BASE } from "@/lib/admin-path";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = { "not-admin": "That account can't use the dashboard. Sign in with the owner's email." };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && (next === ADMIN_BASE || next.startsWith(`${ADMIN_BASE}/`)) ? next : undefined;
  return (
    <>
      <AdminFlag />
      <LoginVault
        next={safeNext}
        initialError={error ? ERRORS[error] || error.slice(0, 160) : undefined}
        header={
          <header className="xk-vault-head">
            <div className="xk-vault-brand"><LogoMark size={34} tile /><span>xerk<b>/</b>console</span></div>
            <span className="xk-vault-label"><i className="xk-live" />Restricted · owner only</span>
            <h1>Mission control</h1>
            <p>Sign in with a one-time link sent to your inbox.</p>
          </header>
        }
      />
    </>
  );
}
