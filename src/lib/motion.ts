"use client";
import { gsap } from "gsap";

// The xerk motion language (see design system → Motion). All helpers respect prefers-reduced-motion.
export const ease = { out: "expo.out", inOut: "power3.inOut", spring: "back.out(1.6)" };

export function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function reveal(root: ParentNode = document) {
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"));
  if (!els.length) return () => {};
  els.forEach((el) => el.setAttribute("data-revealed", ""));
  gsap.set(els, { opacity: 0, y: reduced() ? 0 : 14, filter: reduced() ? "none" : "blur(6px)" });
  const io = new IntersectionObserver(
    (entries) => {
      const batch = entries.filter((e) => e.isIntersecting).map((e) => { io.unobserve(e.target); return e.target; });
      if (batch.length) gsap.to(batch, { opacity: 1, y: 0, filter: "blur(0px)", duration: reduced() ? 0.15 : 0.8, ease: ease.out, stagger: 0.08, clearProps: "filter,transform" });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = "1";
  const text = el.textContent?.trim() || "";
  el.setAttribute("aria-label", text);
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="xk-wmask" aria-hidden="true"><span class="xk-w">${w.replace(/</g, "&lt;")}</span></span>`).join(" ");
  const inner = el.querySelectorAll(".xk-w");
  if (reduced()) gsap.from(inner, { opacity: 0, duration: 0.15 });
  else gsap.from(inner, { yPercent: 110, duration: 0.9, ease: ease.out, stagger: 0.06 });
}

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";
export function scramble(el: HTMLElement, text = el.dataset.text || el.textContent || "") {
  el.dataset.text = text;
  if (reduced()) { el.textContent = text; return; }
  const q = Array.from(text).map((ch) => ({ ch, start: Math.floor(Math.random() * 10), end: 10 + Math.floor(Math.random() * 14) }));
  let frame = 0;
  const tick = () => {
    let out = "", done = 0;
    for (const c of q) {
      if (frame >= c.end) { done++; out += c.ch; }
      else if (frame >= c.start && c.ch !== " ") out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      else out += c.ch === " " ? " " : " ";
    }
    el.textContent = out;
    frame++;
    if (done < q.length && frame < 60) requestAnimationFrame(tick); else el.textContent = text;
  };
  tick();
}

export function scrambleOnView(root: ParentNode = document) {
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-scramble]:not([data-scrambled])"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); scramble(e.target as HTMLElement); } });
  }, { threshold: 0.6 });
  els.forEach((el) => { el.setAttribute("data-scrambled", ""); io.observe(el); });
  return () => io.disconnect();
}

export function counter(el: HTMLElement) {
  const to = parseFloat(el.dataset.count || "0");
  if (reduced()) { el.textContent = String(to); return; }
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: 1.2, ease: ease.out, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
}

export function magnetic(el: HTMLElement, strength = 0.3) {
  if (reduced() || window.matchMedia("(pointer: coarse)").matches) return () => {};
  const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: ease.out });
  const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: ease.out });
  const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * strength); yTo((e.clientY - r.top - r.height / 2) * strength); };
  const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: ease.spring });
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
}

/** Wire everything on a freshly rendered page. Returns a cleanup. */
export function intro(root: ParentNode = document) {
  const cleanups: (() => void)[] = [];
  root.querySelectorAll<HTMLElement>("[data-split]").forEach(splitWords);
  root.querySelectorAll<HTMLElement>("[data-count]").forEach(counter);
  root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => cleanups.push(magnetic(el)));
  cleanups.push(scrambleOnView(root));
  cleanups.push(reveal(root));
  return () => cleanups.forEach((c) => c());
}
