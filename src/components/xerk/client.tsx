"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { Icon } from "./icon";
import iconData from "./icon-data.json";
import { Badge, Button, XPBar } from "./ui";
import { cx } from "@/lib/utils";
import { intro, reduced } from "@/lib/motion";
import { track, unlock, unlockedList, openQuests, ACHIEVEMENTS, type AchievementId } from "@/lib/track";

/* ---------- Motion root: runs the GSAP intro on every route ---------- */
export function MotionRoot() {
  const pathname = usePathname();
  useEffect(() => {
    let clean = () => {};
    const id = requestAnimationFrame(() => { clean = intro(document); });
    return () => { cancelAnimationFrame(id); clean(); };
  }, [pathname]);
  useEffect(() => {
    // Spotlight cards follow the pointer; clicks on [data-track] become analytics events.
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(".xk-spot") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const click = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-track]") as HTMLElement | null;
      if (el?.dataset.track) track(el.dataset.track, { path: location.pathname, label: el.textContent?.trim().slice(0, 60) });
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("click", click);
    return () => { document.removeEventListener("pointermove", move); document.removeEventListener("click", click); };
  }, []);
  return null;
}

/* ---------- Theme ---------- */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme !== "light";
  return (
    <button type="button" className="xk-iconbtn" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title="Toggle theme">
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

export function SearchTrigger() {
  return (
    <button type="button" className="xk-search-trigger" onClick={() => window.dispatchEvent(new Event("xk:palette"))} aria-label="Search (⌘K)">
      <Icon name="magnifying-glass" /><span>Search</span><kbd className="xk-kbd">⌘K</kbd>
    </button>
  );
}

/* ---------- Scroll HUD ---------- */
export function ScrollHUD() {
  const [prog, setProg] = useState(0);
  const [section, setSection] = useState("01 / Start");
  const [unlocked, setUnlocked] = useState(0);
  const pathname = usePathname();
  useEffect(() => {
    const on = () => { const d = document.scrollingElement || document.documentElement; setProg(Math.round(((window.scrollY || d.scrollTop) / Math.max(1, d.scrollHeight - window.innerHeight)) * 100)); };
    window.addEventListener("scroll", on, { passive: true }); on();
    const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-hud]"));
    setSection(secs.length ? "01 / Start" : document.title.split("—")[0].trim().slice(0, 32));
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setSection((e.target as HTMLElement).dataset.hud || "")), { rootMargin: "-40% 0px -55% 0px" });
    secs.forEach((s) => io.observe(s));
    const sync = () => setUnlocked(readUnlocked().length);
    sync(); window.addEventListener("xk:achievement", sync);
    return () => { window.removeEventListener("scroll", on); io.disconnect(); window.removeEventListener("xk:achievement", sync); };
  }, [pathname]);
  return (
    <div className={cx("xk-hud", pathname !== "/play" && "is-thin")}>
      <div className="xk-hud-bar" style={{ width: `${prog}%` }} />
      <div className="xk-hud-row">
        <span><Icon name="map-trifold" />{section}</span>
        <span>XP <b>{prog}</b>%</span>
        <button type="button" className="xk-hud-ach" onClick={openQuests} aria-label="Open side quests"><Icon name="trophy" />{unlocked}/{Object.keys(ACHIEVEMENTS).length} quests</button>
      </div>
    </div>
  );
}

/* ---------- Achievements (visitor) ---------- */
function readUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem("xk:ach") || "[]"); } catch { return []; }
}

export function AchievementToaster() {
  const [toast, setToast] = useState<{ id: AchievementId; key: number } | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    const on = (e: Event) => { const id = (e as CustomEvent).detail as AchievementId; setToast({ id, key: Date.now() }); };
    window.addEventListener("xk:achievement", on);
    unlock("explorer");
    return () => window.removeEventListener("xk:achievement", on);
  }, []);
  useEffect(() => {
    if (pathname.startsWith("/work/")) {
      try {
        const seen = new Set<string>(JSON.parse(sessionStorage.getItem("xk:cases") || "[]")); seen.add(pathname);
        sessionStorage.setItem("xk:cases", JSON.stringify([...seen]));
        if (seen.size >= 3) unlock("scout");
      } catch {}
    }
    if (pathname.startsWith("/blog/")) unlock("reader");
    if (pathname.startsWith("/hire")) unlock("recruiter");
  }, [pathname]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t); }, [toast]);
  if (!toast) return null;
  const a = ACHIEVEMENTS[toast.id];
  return (
    <div className="xk-toast-wrap" key={toast.key}>
      <div className="xk-toast" role="status">
        <div className="xk-toast-icon"><Icon name={a.icon} /></div>
        <button type="button" className="xk-toast-body" onClick={() => { setToast(null); openQuests(); }}><span className="xk-label">Achievement unlocked</span><strong>{a.title}</strong><p>{a.text} · see all quests</p></button>
        <span className="xk-toast-xp">+{a.xp} XP</span>
        <button className="xk-toast-x" aria-label="Dismiss" onClick={() => setToast(null)}><Icon name="x" /></button>
      </div>
    </div>
  );
}

/* ---------- Command palette (⌘K) ---------- */
export type PaletteItem = { label: string; href: string; icon?: string; brand?: string; hint?: string; ai?: boolean; group: string };

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
      if (e.key === "`" && !(e.target as HTMLElement)?.closest?.("input,textarea")) { e.preventDefault(); window.dispatchEvent(new Event("xk:terminal")); }
    };
    const ev = () => setOpen(true);
    window.addEventListener("keydown", key); window.addEventListener("xk:palette", ev);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("xk:palette", ev); };
  }, []);
  useEffect(() => { if (open) { setQ(""); setIdx(0); track("palette_open"); } }, [open]);
  if (!open) return null;
  const lq = q.toLowerCase();
  const list = items.filter((it) => !lq || it.label.toLowerCase().includes(lq) || it.group.toLowerCase().includes(lq));
  const groups = [...new Set(list.map((i) => i.group))];
  const go = (it: PaletteItem) => {
    setOpen(false);
    if (it.href === "#terminal") window.dispatchEvent(new Event("xk:terminal"));
    else if (it.href === "#ask") window.dispatchEvent(new Event("xk:ask"));
    else if (/^(https?:|mailto:)/.test(it.href)) window.open(it.href, "_blank");
    else router.push(it.href);
  };
  let n = -1;
  return (
    <div className="xk-palette-backdrop" onClick={() => setOpen(false)}>
      <div className="xk-cmd" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="xk-cmd-input">
          <Icon name="magnifying-glass" />
          <input autoFocus placeholder="Search projects, blog posts, or commands" value={q} aria-label="Search"
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, list.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && list[idx]) go(list[idx]);
            }} />
          <kbd className="xk-kbd">esc</kbd>
        </div>
        <div className="xk-cmd-list" role="listbox">
          {list.length === 0 && <div className="xk-cmd-empty">No results. Try <code>ai</code> or <code>nest</code>.</div>}
          {groups.map((g) => (
            <div key={g} className="xk-cmd-group">
              <span className="xk-label">{g}</span>
              {list.filter((i) => i.group === g).map((it) => {
                n++; const me = n;
                return (
                  <div key={it.label} role="option" aria-selected={me === idx} className="xk-cmd-item" onMouseEnter={() => setIdx(me)} onClick={() => go(it)}>
                    <Icon name={it.icon || "arrow-right"} brand={it.brand} /><span>{it.label}</span>{it.ai && <Badge tone="agent">AI</Badge>}<span className="xk-cmd-hint">{it.hint || ""}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="xk-cmd-foot"><span><kbd className="xk-kbd">↑↓</kbd> navigate</span><span><kbd className="xk-kbd">↵</kbd> open</span><span><kbd className="xk-kbd">`</kbd> terminal</span><span className="xk-cmd-ai"><Icon name="sparkle" />Ask my CV</span></div>
      </div>
    </div>
  );
}

/* ---------- Hero scene (Three.js, procedural) ---------- */
export function HeroScene({ metric = "100K+ concurrent", label = "Live · connections", nodes = 520, packets = 70, hud = true }: { metric?: string; label?: string; nodes?: number; packets?: number; hud?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dispose = () => {};
    let cancelled = false;
    const canWebGL = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
    if (!canWebGL) { el.classList.add("is-fallback"); return; }
    import("three").then((T) => {
      if (cancelled || !ref.current) return;
      dispose = mountNetwork(T, el, { nodes, packets });
    });
    return () => { cancelled = true; dispose(); };
  }, [nodes, packets]);
  return (
    <div ref={ref} className="xk-scene" aria-hidden>
      <div className="xk-scene-fallback" />
      {hud && <div className="xk-scene-hud"><span><i className="xk-live" />{label}</span><span>{metric}</span></div>}
    </div>
  );
}

function cssVar(name: string, fb: string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb; }

function mountNetwork(T: typeof import("three"), el: HTMLDivElement, opts: { nodes: number; packets: number }) {
  const still = reduced();
  const small = window.innerWidth < 768;
  const N = small ? Math.round(opts.nodes * 0.6) : opts.nodes, M = small ? Math.round(opts.packets * 0.6) : opts.packets, R = 2.15;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(42, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 100);
  cam.position.set(0, 0, 6.2);
  const world = new T.Group(); scene.add(world);
  const pos = new Float32Array(N * 3), cols = new Float32Array(N * 3), kind: number[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i, j = 1 + Math.sin(i * 12.9898) * 0.03;
    pos.set([Math.cos(th) * r * R * j, y * R * j, Math.sin(th) * r * R * j], i * 3);
    kind.push(i % 23 === 0 ? 2 : i % 9 === 0 ? 1 : 0);
  }
  const nb: number[][] = Array.from({ length: N }, () => []);
  const edges: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const best: [number, number][] = [];
    for (let k = 0; k < N; k++) {
      if (i === k) continue;
      const dx = pos[i * 3] - pos[k * 3], dy = pos[i * 3 + 1] - pos[k * 3 + 1], dz = pos[i * 3 + 2] - pos[k * 3 + 2], d = dx * dx + dy * dy + dz * dz;
      if (best.length < 3 || d < best[2][0]) { best.push([d, k]); best.sort((a, b) => a[0] - b[0]); if (best.length > 3) best.pop(); }
    }
    best.forEach(([, k]) => { if (i < k) edges.push([i, k]); nb[i].push(k); });
  }
  const lpos = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], n) => { for (let q = 0; q < 3; q++) { lpos[n * 6 + q] = pos[a * 3 + q]; lpos[n * 6 + 3 + q] = pos[b * 3 + q]; } });
  const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pos, 3)); pg.setAttribute("color", new T.BufferAttribute(cols, 3));
  const pm = new T.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.95 });
  world.add(new T.Points(pg, pm));
  const lg = new T.BufferGeometry(); lg.setAttribute("position", new T.BufferAttribute(lpos, 3));
  const lm = new T.LineBasicMaterial({ transparent: true, opacity: 0.32 }); world.add(new T.LineSegments(lg, lm));
  const rings = [[2.9, 1.15, 0.2], [3.35, -0.5, 0.9]].map(([rad, rx, rz]) => {
    const pts = Array.from({ length: 129 }, (_, a) => { const t = (a / 128) * Math.PI * 2; return new T.Vector3(Math.cos(t) * rad, 0, Math.sin(t) * rad); });
    const ring = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ transparent: true, opacity: 0.22 }));
    ring.rotation.x = rx; ring.rotation.z = rz; scene.add(ring); return ring;
  });
  // Tech-stack badges riding on the globe: textures drawn at runtime from the brand SVG paths (no downloaded assets).
  const BRANDS = ["nestjs", "nextdotjs", "react", "typescript", "nodedotjs", "graphql", "socketdotio", "docker", "kubernetes", "amazonwebservices", "postgresql", "mongodb", "redis", "laravel", "claude", "openai", "langchain", "tailwindcss", "angular", "vuedotjs"];
  const brandPaths = (iconData as { brands: Record<string, (string | number)[][]> }).brands;
  const logoCount = small ? 10 : 16;
  const logoSprites: import("three").Sprite[] = [];
  const badgeTexture = (name: string) => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2);
    g.fillStyle = cssVar("--surface", "#111316"); g.fill();
    g.lineWidth = 4; g.strokeStyle = cssVar("--border-strong", "#61666f"); g.stroke();
    g.save(); g.translate(34, 34); g.scale(60 / 24, 60 / 24); g.fillStyle = cssVar("--ink", "#f2f3f5");
    (brandPaths[name] || []).forEach((d) => g.fill(new Path2D(String(d[0]))));
    g.restore();
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  const ga2 = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < logoCount; i++) {
    const name = BRANDS[i % BRANDS.length];
    const y = 1 - ((i + 0.5) / logoCount) * 2, r = Math.sqrt(1 - y * y), th = ga2 * i * 7.3;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: badgeTexture(name), transparent: true, depthWrite: false }));
    sp.position.set(Math.cos(th) * r * R * 1.16, y * R * 1.16, Math.sin(th) * r * R * 1.16);
    sp.scale.setScalar(small ? 0.42 : 0.36);
    sp.userData.name = name;
    world.add(sp); logoSprites.push(sp);
  }
  const repaintLogos = () => logoSprites.forEach((sp) => { const m = sp.material as import("three").SpriteMaterial; m.map?.dispose(); m.map = badgeTexture(sp.userData.name); m.needsUpdate = true; });
  const tmp = new T.Vector3();
  type P = { a: number; b: number; t: number; s: number };
  const launch = (p: P, from: number) => { p.a = from; p.b = nb[from][Math.floor(Math.random() * nb[from].length)]; p.t = 0; p.s = 0.008 + Math.random() * 0.02; };
  const pk: P[] = Array.from({ length: M }, () => { const p = { a: 0, b: 0, t: 0, s: 0 }; launch(p, Math.floor(Math.random() * N)); p.t = Math.random(); return p; });
  const ppos = new Float32Array(M * 3);
  const kg = new T.BufferGeometry(); kg.setAttribute("position", new T.BufferAttribute(ppos, 3));
  const km = new T.PointsMaterial({ size: 0.085, transparent: true }); world.add(new T.Points(kg, km));
  const paint = () => {
    const ink = new T.Color(cssVar("--ink-muted", "#9ba1aa")), acc = new T.Color(cssVar("--accent-text", "#c6f432")), ag = new T.Color(cssVar("--agent-text", "#9b7cff"));
    for (let i = 0; i < N; i++) { const c = kind[i] === 2 ? ag : kind[i] === 1 ? acc : ink; cols.set([c.r, c.g, c.b], i * 3); }
    pg.attributes.color.needsUpdate = true;
    lm.color = new T.Color(cssVar("--border-strong", "#61666f")); km.color = acc;
    rings.forEach((r, n) => ((r.material as import("three").LineBasicMaterial).color = n ? ag : acc));
  };
  paint();
  const mo = new MutationObserver(() => requestAnimationFrame(() => { paint(); repaintLogos(); }));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  let tx = 0, ty = 0, raf = 0, clock = 0, visible = true;
  const onMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; };
  window.addEventListener("pointermove", onMove, { passive: true });
  const frame = () => {
    clock += 0.016;
    for (let i = 0; i < M; i++) { const p = pk[i]; p.t += p.s; if (p.t >= 1) launch(p, p.b); for (let q = 0; q < 3; q++) ppos[i * 3 + q] = pos[p.a * 3 + q] + (pos[p.b * 3 + q] - pos[p.a * 3 + q]) * p.t; }
    kg.attributes.position.needsUpdate = true;
    world.rotation.y += 0.0016;
    world.rotation.x += (ty * 0.5 - world.rotation.x) * 0.04;
    world.rotation.z += (-tx * 0.25 - world.rotation.z) * 0.04;
    rings[0].rotation.y += 0.002; rings[1].rotation.y -= 0.0014;
    pm.size = 0.045 + Math.sin(clock * 2) * 0.006;
    logoSprites.forEach((sp) => { sp.getWorldPosition(tmp); const front = (tmp.z / (R * 1.16) + 1) / 2; (sp.material as import("three").SpriteMaterial).opacity = 0.12 + front * 0.88; sp.renderOrder = front > 0.5 ? 2 : 0; });
    renderer.render(scene, cam);
    if (!still && visible) raf = requestAnimationFrame(frame);
  };
  frame();
  const vis = new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was && !still) raf = requestAnimationFrame(frame); });
  vis.observe(el);
  const ro = new ResizeObserver(() => { const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return; renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); if (still || !visible) renderer.render(scene, cam); });
  ro.observe(el);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); vis.disconnect(); mo.disconnect(); window.removeEventListener("pointermove", onMove);
    logoSprites.forEach((sp) => { (sp.material as import("three").SpriteMaterial).map?.dispose(); sp.material.dispose(); });
    pg.dispose(); lg.dispose(); kg.dispose(); pm.dispose(); lm.dispose(); km.dispose(); renderer.dispose(); renderer.domElement.remove();
  };
}

/* ---------- Level select ---------- */
export type Level = { slug: string; code: string; title: string; world: string; period: string; summary: string; boss: string; image?: string; big?: string; bigLabel?: string; stack: string[]; ai?: boolean; embedUrl?: string };

export function LevelSelect({ levels }: { levels: Level[] }) {
  const [sel, setSel] = useState(0);
  const cur = levels[sel];
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setSel((s) => (s + 1) % levels.length); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setSel((s) => (s - 1 + levels.length) % levels.length); }
  };
  return (
    <div className="xk-levels">
      <div className="xk-levels-grid" role="listbox" tabIndex={0} onKeyDown={key} aria-label="Projects">
        {levels.map((l, i) => (
          <button key={l.slug} role="option" aria-selected={i === sel} className={cx("xk-level", l.ai && "is-ai")} onClick={() => setSel(i)}>
            <span className="xk-level-n">{l.code}</span><strong>{l.title}</strong><span className="xk-level-world">{l.world}</span>
            <span className="xk-level-state"><Icon name="check-circle" />Cleared</span>
          </button>
        ))}
      </div>
      <div className="xk-level-detail" key={sel}>
        <div className="xk-level-visual">{cur.image ? <img src={cur.image} alt={`${cur.title} screenshot`} /> : <div className="xk-level-poster"><span>{cur.big}</span><em>{cur.bigLabel}</em></div>}</div>
        <div className="xk-level-info">
          <div className="xk-level-meta"><span className="xk-label">Stage {cur.code} · {cur.period}</span>{cur.ai && <Badge tone="agent">AI</Badge>}</div>
          <h3>{cur.title}</h3>
          <p>{cur.summary}</p>
          <div className="xk-boss"><Icon name="skull" /><div><span className="xk-label">Boss</span><strong>{cur.boss}</strong></div></div>
          <div className="xk-tags">{cur.stack.slice(0, 5).map((s) => <Badge key={s}>{s}</Badge>)}</div>
          <div className="xk-level-actions"><Button variant="primary" iconRight="arrow-right" href={`/work/${cur.slug}`} track="project_view">Enter case study</Button>{cur.embedUrl && <Button icon="game-controller" href={`/work/${cur.slug}#demo`}>Play demo</Button>}</div>
        </div>
      </div>
      <div className="xk-levels-hint"><kbd className="xk-kbd">↑</kbd><kbd className="xk-kbd">↓</kbd> select stage · <kbd className="xk-kbd">↵</kbd> enter</div>
    </div>
  );
}

/* ---------- Terminal ---------- */
export function Terminal({ commands, boot = [], motd, inline = true }: { commands: Record<string, string[]>; boot?: string[]; motd?: string; inline?: boolean }) {
  const [lines, setLines] = useState<{ cmd?: string; out?: string }[]>([]);
  const [val, setVal] = useState("");
  const [full, setFull] = useState(false);
  const body = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const run = (raw: string) => {
    const c = raw.trim().toLowerCase();
    track("terminal_command", { command: c.slice(0, 40) });
    if (c === "clear") return setLines([]);
    if (c === "sudo hire-me") { unlock("root"); setTimeout(() => router.push("/hire"), 1200); }
    if (c.startsWith("open ")) { const t = c.slice(5); setTimeout(() => router.push(t.startsWith("/") ? t : `/work/${t}`), 400); }
    const out = c === "help" ? ["commands: " + [...Object.keys(commands).filter((k) => !k.startsWith("sudo")), "open <stage>", "clear"].join("  ")] : commands[c] || (c.startsWith("open ") ? [`opening ${c.slice(5)}…`] : [`command not found: ${raw} — try \`help\``]);
    setLines((ls) => [...ls, { cmd: raw }, ...out.map((o) => ({ out: o }))]);
  };
  useEffect(() => {
    const t = boot.map((c, i) => setTimeout(() => run(c), 600 + i * 900));
    const open = () => setFull(true);
    if (inline) window.addEventListener("xk:terminal", open);
    return () => { t.forEach(clearTimeout); window.removeEventListener("xk:terminal", open); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, [lines]);
  useEffect(() => { if (full) { unlock("hacker"); setTimeout(() => input.current?.focus(), 50); } }, [full]);
  const term = (
    <div className="xk-term" onClick={() => input.current?.focus({ preventScroll: true })}>
      <div className="xk-term-bar"><i /><i /><i /><span>guest@xerk.io: ~</span><span className="xk-term-tip">type <code>help</code>{full && <button className="xk-toast-x" aria-label="Close terminal" onClick={(e) => { e.stopPropagation(); setFull(false); }}><Icon name="x" /></button>}</span></div>
      <div className="xk-term-body" ref={body}>
        {motd && <pre className="xk-term-motd">{motd}</pre>}
        {lines.map((l, i) => (l.cmd != null ? <div key={i} className="xk-term-line"><span className="xk-term-ps">❯ </span>{l.cmd}</div> : <div key={i} className="xk-term-out">{l.out}</div>))}
        <form className="xk-term-line" onSubmit={(e) => { e.preventDefault(); if (val.trim()) run(val); setVal(""); }}>
          <span className="xk-term-ps">❯ </span>
          <input ref={input} value={val} onChange={(e) => setVal(e.target.value)} aria-label="Terminal command" spellCheck={false} autoComplete="off" onFocus={() => unlock("hacker")} />
          <span className="xk-term-cursor" aria-hidden />
        </form>
      </div>
    </div>
  );
  return <>{term}{full && <div className="xk-term-full" onClick={() => setFull(false)}><div onClick={(e) => e.stopPropagation()} style={{ width: "min(900px, 100%)" }}>{term}</div></div>}</>;
}

/* ---------- Ask my CV ---------- */
type Msg = { role: "user" | "ai"; text: string; sources?: { label: string; href: string }[] };
export function AskMyCV({ suggestions = [], initial = [] }: { suggestions?: string[]; initial?: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [msgs, busy]);
  useEffect(() => { const f = () => { input.current?.scrollIntoView({ block: "center" }); input.current?.focus(); }; window.addEventListener("xk:ask", f); return () => window.removeEventListener("xk:ask", f); }, []);
  const ask = async (q: string) => {
    if (!q || busy) return;
    setVal(""); setBusy(true);
    const history = [...msgs, { role: "user" as const, text: q }];
    setMsgs(history);
    track("ask_cv_question", { question: q.slice(0, 200) });
    unlock("curious");
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, history: history.slice(-6) }) });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "ai", text: data.answer || "Sorry, I couldn't answer that.", sources: data.sources }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "The AI is offline right now. Try the terminal or the CV page." }]);
    } finally { setBusy(false); }
  };
  return (
    <section className="xk-ask" aria-label="Ask my CV" id="ask">
      <div className="xk-ask-head"><span className="xk-ask-avatar"><Icon name="sparkle-duo" /></span><div><strong>Ask my CV</strong><span>AI answers from my real work, with sources</span></div><Badge tone="agent">Beta</Badge></div>
      <div className="xk-ask-list" ref={list} aria-live="polite">
        {msgs.length === 0 && <div className="xk-msg xk-msg-ai"><p>Ask me anything about Ahmed&apos;s projects, stack or availability.</p></div>}
        {msgs.map((m, i) => (
          <div key={i} className={`xk-msg xk-msg-${m.role}`}>
            <p>{m.text}</p>
            {m.sources && m.sources.length > 0 && <div className="xk-msg-sources">{m.sources.map((s, j) => <Link key={j} href={s.href}><span>{j + 1}</span>{s.label}</Link>)}</div>}
          </div>
        ))}
        {busy && <div className="xk-msg xk-msg-ai"><span className="xk-typing"><i /><i /><i /></span></div>}
      </div>
      {suggestions.length > 0 && <div className="xk-ask-suggest">{suggestions.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}</div>}
      <form className="xk-ask-input" onSubmit={(e) => { e.preventDefault(); ask(val.trim()); }}>
        <input ref={input} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Ask about projects, stack, availability…" aria-label="Your question" maxLength={300} />
        <button type="submit" className="xk-iconbtn" aria-label="Send" disabled={busy}><Icon name="paper-plane-tilt" /></button>
      </form>
    </section>
  );
}

/* ---------- Contact form ---------- */
export function ContactForm({ budgets = ["< $2k", "$2k–5k", "$5k–15k", "$15k+"], service }: { budgets?: string[]; service?: string }) {
  const [budget, setBudget] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "");
    if (!/.+@.+\..+/.test(email)) { setError("Enter a valid email so I can reply."); return; }
    setError(""); setState("sending");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.get("name"), email, budget, message: f.get("message"), service, company: f.get("company"), source: document.referrer || "direct", path: location.pathname }) });
      if (!res.ok) throw new Error();
      track("lead_submit", { budget, service });
      unlock("party");
      setState("done");
    } catch { setState("idle"); setError("Something went wrong. Email me at gm.xerk@gmail.com instead."); }
  };
  if (state === "done") return <div className="xk-form xk-form-done"><Icon name="check-circle" /><h3>Message sent</h3><p>I reply within one working day.</p></div>;
  return (
    <form className="xk-form" onSubmit={submit} noValidate>
      <div className="xk-field-row">
        <label className="xk-field"><span>Name</span><input name="name" placeholder="Your name" autoComplete="name" required /></label>
        <label className={cx("xk-field", error && "has-error")}><span>Email</span><input name="email" type="email" placeholder="you@company.com" autoComplete="email" aria-invalid={error ? true : undefined} required />{error && <em role="alert"><Icon name="warning-circle" />{error}</em>}</label>
      </div>
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: -9999 }} />
      <fieldset className="xk-field"><legend>Budget</legend><div className="xk-chips">{budgets.map((b) => <button key={b} type="button" aria-pressed={budget === b} onClick={() => setBudget(b)}>{b}</button>)}</div></fieldset>
      <label className="xk-field"><span>Project</span><textarea name="message" rows={4} placeholder="What are you building, and by when?" /></label>
      <div className="xk-form-foot"><span className="xk-muted"><Icon name="clock" /> Reply within 24h</span><Button variant="primary" type="submit" iconRight="paper-plane-tilt">{state === "sending" ? "Sending…" : "Send message"}</Button></div>
    </form>
  );
}

/* ---------- Artifact embed ---------- */
export function ArtifactEmbed({ title, src, poster, screens, video, code, url, liveTitle, liveText, caption }: { title: string; src?: string; poster?: string; screens?: { src: string; alt: string }[]; video?: string; code?: string; url?: string; liveTitle?: string; liveText?: string; caption?: string }) {
  const gallery = screens && screens.length ? screens : poster ? [{ src: poster, alt: `${title} screenshot` }] : [];
  const [shot, setShot] = useState(0);
  const tabs = [src && "live", video && "video", gallery.length && "screens", code && "code"].filter(Boolean) as string[];
  const [tab, setTab] = useState(tabs[0] || "screens");
  const [live, setLive] = useState(false);
  const labels: Record<string, [string, string]> = { live: ["Interactive", "cursor-click"], video: ["Video", "video-camera"], screens: ["Screens", "images"], code: ["Code", "code"] };
  if (!tabs.length) return null;
  return (
    <figure className="xk-embed" id="demo">
      <div className="xk-embed-bar">
        <div className="xk-embed-tabs" role="tablist">{tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}><Icon name={labels[t][1]} />{labels[t][0]}</button>)}</div>
        <div className="xk-embed-tools">{url && <span className="xk-embed-url"><Icon name="globe" />{url}</span>}{src && <a className="xk-iconbtn" href={src} target="_blank" rel="noopener" aria-label="Open full screen"><Icon name="arrows-out" /></a>}</div>
      </div>
      <div className="xk-embed-stage" style={{ aspectRatio: "16 / 9" }}>
        {tab === "live" && (live && src ? <iframe src={`${src}${src.includes("?") ? "&" : "?"}theme=${typeof document !== "undefined" ? document.documentElement.dataset.theme || "dark" : "dark"}`} title={`${title} — interactive demo`} loading="lazy" allow="fullscreen; clipboard-write" /> : (
          <div className="xk-embed-launch">{poster && <img src={poster} alt="" />}<div className="xk-embed-launch-inner"><Badge tone="accent" icon="cursor-click">Live artifact</Badge><strong>{liveTitle || "Try it yourself"}</strong><p>{liveText || "Runs in your browser. Nothing to install."}</p><button className="xk-btn xk-btn-primary" onClick={() => { setLive(true); track("demo_launch", { title }); unlock("player"); }}><Icon name="play" />Launch demo</button></div></div>
        ))}
        {tab === "video" && video && <video src={video} poster={poster} controls playsInline onPlay={() => track("video_play", { title })} />}
        {tab === "screens" && gallery[shot] && <>
          <img src={gallery[shot].src} alt={gallery[shot].alt} style={{ objectFit: "contain", background: "var(--surface-raised)" }} />
          {gallery.length > 1 && <div className="xk-embed-dots">{gallery.map((g, i) => <button key={g.src} aria-label={`Show ${g.alt}`} aria-current={i === shot ? "true" : undefined} onClick={() => setShot(i)} />)}</div>}
        </>}
        {tab === "code" && <pre className="xk-embed-code">{code}</pre>}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/* ---------- Boot screen (first visit only) ---------- */
export function BootScreen() {
  const [n, setN] = useState(-1);
  const lines: [string, string][] = [["loading profile", "ok"], ["mounting 10+ years", "ok"], ["linking 100K+ sockets", "ok"], ["warming up agents", "ok"], ["xerk.os ready", "✓"]];
  useEffect(() => {
    try {
      if (reduced() || sessionStorage.getItem("xk:booted") || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) return;
      sessionStorage.setItem("xk:booted", "1");
    } catch { return; }
    setN(0);
  }, []);
  useEffect(() => {
    if (n < 0) return;
    if (n >= lines.length) { const t = setTimeout(() => setN(-1), 250); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), 140);
    return () => clearTimeout(t);
  }, [n, lines.length]);
  if (n < 0) return null;
  return (
    <div className="xk-boot" onClick={() => setN(-1)} role="presentation">
      <div className="xk-boot-inner">
        <span className="xk-logo"><svg viewBox="0 0 64 64" width={40} height={40} className="xk-mark is-blink" aria-hidden><g className="xk-mark-a" strokeWidth="6.5" strokeLinecap="round"><path d="M15 21 32 43" /><path d="M32 21 15 43" /></g><rect className="xk-mark-b-fill xk-mark-cursor" x="38" y="19" width="11" height="26" rx="2.5" /></svg><span className="xk-wordmark" style={{ fontSize: 29 }}>xerk</span></span>
        <ol>{lines.slice(0, n).map((l) => <li key={l[0]}><span>{l[0]}</span><b>{l[1]}</b></li>)}</ol>
        <XPBar label="Loading" value={Math.round((n / lines.length) * 100)} />
        <button className="xk-boot-start" onClick={() => setN(-1)}>Skip intro</button>
      </div>
    </div>
  );
}

/* ---------- Side quests (visitor achievements) ---------- */
export function QuestPanel() {
  const [open, setOpen] = useState(false);
  const [got, setGot] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setGot(unlockedList());
    const show = () => { sync(); setOpen(true); track("quests_open"); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    sync();
    window.addEventListener("xk:quests", show); window.addEventListener("xk:achievement", sync); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("xk:quests", show); window.removeEventListener("xk:achievement", sync); window.removeEventListener("keydown", key); };
  }, []);
  if (!open) return null;
  return (
    <div className="xk-palette-backdrop" onClick={() => setOpen(false)}>
      <div className="xk-quests-panel" role="dialog" aria-modal="true" aria-label="Side quests" onClick={(e) => e.stopPropagation()}>
        <QuestList got={got} onGo={() => setOpen(false)} />
      </div>
    </div>
  );
}

export function QuestList({ got: initial, onGo }: { got?: string[]; onGo?: () => void }) {
  const [got, setGot] = useState<string[]>(initial || []);
  useEffect(() => {
    if (initial) { setGot(initial); return; }
    const sync = () => setGot(unlockedList()); sync();
    window.addEventListener("xk:achievement", sync); return () => window.removeEventListener("xk:achievement", sync);
  }, [initial]);
  const ids = Object.keys(ACHIEVEMENTS) as AchievementId[];
  const total = ids.reduce((n, id) => n + ACHIEVEMENTS[id].xp, 0);
  const xp = ids.filter((id) => got.includes(id)).reduce((n, id) => n + ACHIEVEMENTS[id].xp, 0);
  const next = ids.find((id) => !got.includes(id));
  return (
    <div className="xk-sq">
      <div className="xk-sq-head">
        <div><span className="xk-label">Side quests</span><strong>{got.length}/{ids.length} unlocked</strong></div>
        <XPBar label="XP" value={Math.round((xp / total) * 100)} text={`${xp} / ${total} XP`} />
      </div>
      <ol className="xk-sq-list">
        {ids.map((id) => {
          const a = ACHIEVEMENTS[id]; const done = got.includes(id);
          return (
            <li key={id} className={cx("xk-sq-item", done && "is-done", id === next && "is-next")}>
              <span className="xk-sq-icon"><Icon name={done ? "check" : a.icon} /></span>
              <div><strong>{a.title}<em>+{a.xp} XP</em></strong><span>{done ? a.text : a.hint}</span></div>
              {done ? <span className="xk-sq-state">Done</span> : <Link href={a.href} className={cx("xk-btn", id === next ? "xk-btn-primary" : "xk-btn-secondary", "xk-btn-sm")} onClick={() => { track("quest_go", { quest: id }); onGo?.(); }}>{a.cta}<Icon name="arrow-right" className="xk-btn-trail" /></Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
