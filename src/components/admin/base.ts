"use client";

import { usePathname } from "next/navigation";

/** Client-side admin base path, read from the current URL so the secret path never ships in a bundle. */
export function useAdminHref() {
  const base = "/" + (usePathname().split("/")[1] || "");
  return (p = "") => base + p;
}
