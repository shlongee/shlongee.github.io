const GLOW_SELECTOR =
  ".wormhole-nav__btn, .nav-link, .post-card, .tag-pill, .clear-btn, .menu, .arcane-btn";

interface GlowState {
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  targetAlpha: number;
  alpha: number;
}

let glowMounted = false;

export function mountCursorGlow(): void {
  if (glowMounted) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  glowMounted = true;

  const states = new Map<HTMLElement, GlowState>();
  let rafId = 0;
  let activeEl: HTMLElement | null = null;

  const tick = () => {
    let keepRunning = false;

    for (const [el, s] of states.entries()) {
      s.x += (s.targetX - s.x) * 0.16;
      s.y += (s.targetY - s.y) * 0.16;
      s.alpha += (s.targetAlpha - s.alpha) * 0.12;

      el.style.setProperty("--mx", `${s.x.toFixed(1)}px`);
      el.style.setProperty("--my", `${s.y.toFixed(1)}px`);
      el.style.setProperty("--glow-alpha", s.alpha.toFixed(3));

      const settled =
        Math.abs(s.targetAlpha - s.alpha) < 0.005 &&
        Math.abs(s.targetX - s.x) < 0.25 &&
        Math.abs(s.targetY - s.y) < 0.25;

      if (s.targetAlpha === 0 && s.alpha < 0.01) {
        el.style.setProperty("--glow-alpha", "0");
        states.delete(el);
      } else if (!settled || s.targetAlpha > 0) {
        keepRunning = true;
      }
    }

    rafId = keepRunning ? requestAnimationFrame(tick) : 0;
  };

  const ensureRunning = () => {
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const clearAll = () => {
    activeEl = null;
    for (const s of states.values()) s.targetAlpha = 0;
    ensureRunning();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const target = (e.target as Element | null)?.closest<HTMLElement>(GLOW_SELECTOR) ?? null;

    if (activeEl && activeEl !== target) {
      const prev = states.get(activeEl);
      if (prev) prev.targetAlpha = 0;
    }
    activeEl = target;

    if (!target) {
      ensureRunning();
      return;
    }

    const rect = target.getBoundingClientRect();
    const scaleX = rect.width ? target.offsetWidth / rect.width : 1;
    const scaleY = rect.height ? target.offsetHeight / rect.height : 1;
    const localX = (e.clientX - rect.left) * scaleX;
    const localY = (e.clientY - rect.top) * scaleY;

    let state = states.get(target);
    if (!state) {
      state = { targetX: localX, targetY: localY, x: localX, y: localY, targetAlpha: 1, alpha: 0 };
      states.set(target, state);
    } else {
      state.targetX = localX;
      state.targetY = localY;
      state.targetAlpha = 1;
    }

    ensureRunning();
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", clearAll, { passive: true });
  document.addEventListener("astro:before-swap", clearAll);
}