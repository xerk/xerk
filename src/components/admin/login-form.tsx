"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { requestSignInLink } from "@/app/[console]/login/actions";
import { Icon } from "@/components/xerk/icon";
import { cx } from "@/lib/utils";
import { LoginScene, type VaultState } from "./login-scene";

const BOOT = ["secure channel", "owner-only access", "alerts armed"];

export function LoginVault({ header, next, initialError }: { header: ReactNode; next?: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<VaultState>(initialError ? "error" : "idle");
  const [error, setError] = useState(initialError || "");
  const [boot, setBoot] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBoot((b) => (b >= BOOT.length ? b : b + 1)), 380);
    return () => clearInterval(id);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { setError("Enter a valid email address."); setState("error"); return; }
    setError(""); setState("sending");
    const started = Date.now();
    const r = await requestSignInLink({ email: addr, next, company }).catch(() => ({ ok: false as const, error: "Network error. Try again." }));
    await new Promise((res) => setTimeout(res, Math.max(0, 1100 - (Date.now() - started)))); // let the core spin up
    if (!r.ok) { setError(r.error); setState("error"); return; }
    setState("sent");
  };

  const sent = state === "sent";
  return (
    <div className="xk-vault">
      <LoginScene state={state} />
      <div className="xk-vault-grain" aria-hidden />
      <section className={cx("xk-vault-card", sent && "is-sent")} aria-live="polite">
        <i className="xk-vault-tick tl" /><i className="xk-vault-tick tr" /><i className="xk-vault-tick bl" /><i className="xk-vault-tick br" />
        {header}

        <ul className="xk-vault-boot" aria-hidden>
          {BOOT.map((b, i) => (
            <li key={b} className={cx(i < boot && "is-on")}><span>{i < boot ? "ok" : "··"}</span>{b}</li>
          ))}
        </ul>

        {sent ? (
          <div className="xk-vault-done">
            <span className="xk-vault-done-icon"><Icon name="envelope-simple" /></span>
            <h2>Check your inbox</h2>
            <p>If <strong>{email}</strong> is the owner&rsquo;s address, a sign-in link is on its way. Open it in this browser. It works once and expires in 15 minutes.</p>
            <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm" onClick={() => { setState("idle"); setEmail(""); }}>Use a different email</button>
          </div>
        ) : (
          <form className="xk-vault-form" onSubmit={submit} noValidate>
            <label className={cx("xk-vault-field", error && "has-error")}>
              <span>Email</span>
              <div className="xk-vault-input">
                <Icon name="at" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state !== "sending") setState(e.target.value ? "typing" : "idle"); }}
                  onBlur={() => state === "typing" && setState("idle")}
                  placeholder="owner@domain.com"
                  autoComplete="email"
                  autoFocus
                  required
                  aria-invalid={error ? true : undefined}
                  disabled={state === "sending"}
                />
              </div>
              {error && <em role="alert"><Icon name="warning-circle" />{error}</em>}
            </label>
            {/* Honeypot. Humans never see it. */}
            <input className="xk-vault-hp" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} name="company" aria-hidden />
            <button type="submit" className={cx("xk-btn xk-btn-primary xk-vault-go", state === "sending" && "is-busy")} disabled={state === "sending"}>
              {state === "sending" ? <>Encrypting link<span className="xk-vault-dots" /></> : <>Send sign-in link <Icon name="arrow-right" /></>}
            </button>
          </form>
        )}

        <footer className="xk-vault-meta">
          <span><Icon name="lock-key" />One-time link, no password</span>
          <span><Icon name="shield-check" />Every sign-in is reported</span>
        </footer>
      </section>
      <a href="/" className="xk-vault-back"><Icon name="arrow-left" />xerk.io</a>
    </div>
  );
}
