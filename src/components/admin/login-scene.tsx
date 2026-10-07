"use client";

import { useEffect, useRef } from "react";

export type VaultState = "idle" | "typing" | "sending" | "sent" | "error";

/**
 * The sign-in backdrop: a flowing point terrain and a wireframe "core" that reacts to the form.
 * idle → slow orbit, typing → rings wake up, sending → fast spin, sent → lime burst, error → red shake.
 */
export function LoginScene({ state }: { state: VaultState }) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef<VaultState>(state);
  stateRef.current = state;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dispose = () => {};
    let cancelled = false;
    const ok = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
    if (!ok) { el.classList.add("is-fallback"); return; }
    import("three").then((T) => { if (!cancelled) dispose = mount(T, el, stateRef); });
    return () => { cancelled = true; dispose(); };
  }, []);

  return <div ref={ref} className="xk-vault-scene" aria-hidden />;
}

const css = (name: string, fb: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;

function mount(T: typeof import("three"), el: HTMLDivElement, stateRef: { current: VaultState }) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = () => el.clientWidth < 900;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(50, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 100);
  cam.position.set(0, 0.6, 7);

  const accent = new T.Color(), ink = new T.Color(), danger = new T.Color(), violet = new T.Color("#8b7bff");
  const readColors = () => {
    accent.set(css("--accent", "#c6f432"));
    ink.set(css("--ink", "#f2f3f5"));
    danger.set(css("--danger", "#ff7a66"));
  };
  readColors();
  const light = () => document.documentElement.dataset.theme === "light";

  /* Terrain: a grid of points displaced in the vertex shader. */
  const COLS = small() ? 90 : 150, ROWS = small() ? 50 : 70;
  const tp = new Float32Array(COLS * ROWS * 3);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = (r * COLS + c) * 3;
    tp[i] = (c / (COLS - 1) - 0.5) * 34;
    tp[i + 1] = 0;
    tp[i + 2] = -(r / (ROWS - 1)) * 30 + 4;
  }
  const tg = new T.BufferGeometry();
  tg.setAttribute("position", new T.BufferAttribute(tp, 3));
  const terrainU = { uTime: { value: 0 }, uInk: { value: ink }, uAccent: { value: accent }, uPulse: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uStep: { value: 30 / (ROWS - 1) }, uLight: { value: light() ? 1 : 0 } };
  const terrain = new T.Points(tg, new T.ShaderMaterial({
    uniforms: terrainU,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float uTime, uPulse, uPx, uStep;
      varying float vH, vFade;
      void main() {
        vec3 p = position;
        float z = p.z + mod(uTime * 1.2, uStep);
        float h = sin(p.x * 0.35 + uTime * 0.6) * 0.45 + cos(z * 0.42 - uTime * 0.8) * 0.35 + sin((p.x + z) * 0.18) * 0.6;
        float ring = exp(-pow(length(vec2(p.x, z + 6.0)) - uPulse * 22.0, 2.0) * 0.6) * step(0.01, uPulse);
        h += ring * 0.9;
        p.y = h - 2.4; p.z = z;
        vH = clamp((h + 0.6) / 1.8, 0.0, 1.0) + ring;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vFade = smoothstep(-34.0, -6.0, mv.z) * smoothstep(1.0, -3.0, mv.z);
        gl_PointSize = (2.2 + vH * 1.6) * uPx * (8.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uInk, uAccent; uniform float uLight;
      varying float vH, vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5; if (dot(c, c) > 0.25) discard;
        vec3 col = mix(uInk, uAccent, smoothstep(0.55, 1.0, vH));
        gl_FragColor = vec4(col, vFade * (0.18 + vH * 0.55) * (uLight > 0.5 ? 1.3 : 1.0));
      }`,
  }));
  scene.add(terrain);

  /* The core. */
  const core = new T.Group();
  scene.add(core);
  const shell = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.25, 1)), new T.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }));
  const inner = new T.Mesh(new T.IcosahedronGeometry(0.62, 0), new T.MeshBasicMaterial({ color: accent, wireframe: false, transparent: true, opacity: 0.16 }));
  const innerEdges = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(0.62, 0)), new T.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.55 }));
  const nucleus = new T.Mesh(new T.SphereGeometry(0.16, 24, 24), new T.MeshBasicMaterial({ color: accent }));
  core.add(shell, inner, innerEdges, nucleus);

  // Vertex dots on the shell.
  const shellPts = new T.Points(new T.IcosahedronGeometry(1.25, 1), new T.PointsMaterial({ color: ink, size: 0.05, transparent: true, opacity: 0.9 }));
  core.add(shellPts);

  // Orbit rings with satellites.
  const rings: { ring: import("three").Mesh; sat: import("three").Mesh; speed: number; r: number; tilt: import("three").Euler }[] = [];
  [[1.95, 1.1, 0.3, 0.7], [2.35, -0.5, 1.2, -0.45], [2.75, 0.2, -0.9, 0.32]].forEach(([r, a, b, s], i) => {
    const holder = new T.Group();
    holder.rotation.set(a, b, 0);
    const ring = new T.Mesh(new T.TorusGeometry(r, 0.006, 6, 160), new T.MeshBasicMaterial({ color: i === 1 ? violet : ink, transparent: true, opacity: 0.35 }));
    const sat = new T.Mesh(new T.SphereGeometry(0.05, 12, 12), new T.MeshBasicMaterial({ color: i === 1 ? violet : accent }));
    holder.add(ring, sat);
    core.add(holder);
    rings.push({ ring, sat, speed: s, r, tilt: holder.rotation });
  });

  // Drifting shards.
  const shards: import("three").LineSegments[] = [];
  const shardGeo = new T.EdgesGeometry(new T.OctahedronGeometry(0.12, 0));
  for (let i = 0; i < 26; i++) {
    const m = new T.LineSegments(shardGeo, new T.LineBasicMaterial({ color: i % 5 === 0 ? accent : ink, transparent: true, opacity: 0.4 }));
    m.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.3) * 6, -Math.random() * 8 - 1);
    m.userData = { v: 0.15 + Math.random() * 0.3, s: Math.random() * 2 + 0.5 };
    scene.add(m);
    shards.push(m);
  }

  /* Interaction */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => { mouse.tx = (e.clientX / window.innerWidth) * 2 - 1; mouse.ty = (e.clientY / window.innerHeight) * 2 - 1; };
  window.addEventListener("pointermove", onMove, { passive: true });

  const layout = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h);
    cam.aspect = w / Math.max(1, h);
    cam.updateProjectionMatrix();
    const s = small();
    core.position.set(s ? 0 : 2.3, s ? 1.55 : 0.35, 0);
    core.scale.setScalar(s ? 0.62 : 1);
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(el);

  const mo = new MutationObserver(() => { readColors(); terrainU.uLight.value = light() ? 1 : 0; });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* Loop */
  let spin = 0.25, glow = 0, burst = 0, shake = 0, last = performance.now(), raf = 0, prev: VaultState = stateRef.current, t = 0;
  const tint = new T.Color();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += still ? 0 : dt;
    const st = stateRef.current;
    if (st !== prev) {
      if (st === "sent") burst = 1;
      if (st === "error") shake = 1;
      prev = st;
    }
    const targetSpin = st === "sending" ? 3.2 : st === "typing" ? 0.7 : st === "sent" ? 0.45 : 0.25;
    spin += (targetSpin - spin) * Math.min(1, dt * 3);
    glow += ((st === "typing" || st === "sending" ? 1 : 0) - glow) * Math.min(1, dt * 4);
    burst = Math.max(0, burst - dt * 0.55);
    shake = Math.max(0, shake - dt * 1.8);

    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 3);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 3);
    cam.position.x = mouse.x * 0.6;
    cam.position.y = 0.6 - mouse.y * 0.35;
    cam.lookAt(small() ? 0 : 0.8, 0, 0);

    if (!still) {
      core.rotation.y += dt * spin;
      core.rotation.x = Math.sin(t * 0.3) * 0.25 + mouse.y * 0.2;
      inner.rotation.y -= dt * spin * 1.8;
      innerEdges.rotation.copy(inner.rotation);
      core.position.y += Math.sin(t * 1.2) * 0.0015;
    }
    if (shake > 0) core.position.x += Math.sin(t * 60) * 0.03 * shake;

    tint.copy(accent).lerp(danger, shake);
    (shell.material as import("three").LineBasicMaterial).color.copy(tint);
    (nucleus.material as import("three").MeshBasicMaterial).color.copy(tint);
    (inner.material as import("three").MeshBasicMaterial).color.copy(tint);
    (inner.material as import("three").MeshBasicMaterial).opacity = 0.12 + glow * 0.12 + burst * 0.4;
    nucleus.scale.setScalar(1 + Math.sin(t * 3) * 0.12 + glow * 0.4 + burst * 1.6);
    shell.scale.setScalar(1 + burst * 0.35);

    rings.forEach((r, i) => {
      const a = t * r.speed * (1 + spin) + i * 2;
      r.sat.position.set(Math.cos(a) * r.r, Math.sin(a) * r.r, 0);
      (r.ring.material as import("three").MeshBasicMaterial).opacity = 0.22 + glow * 0.3 + burst * 0.4;
    });
    shards.forEach((m) => {
      const u = m.userData as { v: number; s: number };
      m.rotation.x += dt * u.s; m.rotation.y += dt * u.s * 0.7;
      m.position.y += dt * u.v * (1 + glow * 2);
      if (m.position.y > 4.5) m.position.y = -3;
    });

    terrainU.uTime.value = t;
    terrainU.uPulse.value = burst > 0 ? 1 - burst : 0;
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => el.classList.add("is-ready"));

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    ro.disconnect();
    mo.disconnect();
    scene.traverse((o) => {
      const m = o as import("three").Mesh;
      m.geometry?.dispose();
      const mat = m.material as import("three").Material | import("three").Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
