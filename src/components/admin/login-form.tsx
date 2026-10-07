"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";

export function LoginForm({ admins, next, initialError }: { admins: string[]; next: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(initialError || "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(addr)) { setError("Enter a valid email address."); return; }
    if (!admins.includes(addr)) { setError("That email isn't on the admin list. This area is only for the site owner."); return; }
    setError(""); setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: false },
    });
    if (error) { setState("idle"); setError(error.message); return; }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="xk-form xk-login-done">
        <Icon name="envelope-simple" />
        <h2 style={{ margin: 0 }}>Check your email</h2>
        <p style={{ margin: 0 }}>A sign-in link is on its way to <strong>{email}</strong>. Open it in this browser to land in the dashboard. The link works once and expires in an hour.</p>
        <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => setState("idle")}>Use a different email</button>
      </div>
    );
  }
  return (
    <form className="xk-form" onSubmit={submit} noValidate>
      <label className={cx("xk-field", error && "has-error")}>
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" autoFocus required aria-invalid={error ? true : undefined} />
        {error && <em role="alert"><Icon name="warning-circle" />{error}</em>}
      </label>
      <button type="submit" className="xk-btn xk-btn-primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
    </form>
  );
}
