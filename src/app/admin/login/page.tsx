import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { AdminFlag } from "@/components/admin/shared";
import { adminEmails } from "@/lib/admin-emails";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = { "not-admin": "You're signed in with an email that isn't on the admin list. Sign in with the owner's email." };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  return (
    <div className="xk-login">
      <AdminFlag />
      <div>
        <span className="xk-label">Mission control</span>
        <h1>Sign in</h1>
        <p className="xk-muted" style={{ margin: "8px 0 0" }}>Enter your email and you'll get a one-time sign-in link. No password.</p>
      </div>
      <LoginForm admins={adminEmails()} next={safeNext} initialError={error ? ERRORS[error] || error : undefined} />
    </div>
  );
}
