// Who may use /admin and /studio. Comma-separated ADMIN_EMAILS env; defaults to the site owner.
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "gm.xerk@gmail.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.trim().toLowerCase());
}
