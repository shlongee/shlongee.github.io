const THEME_KEY = "theme";
const CRYSTAL_KEY = "shlongeeland-crystal";
const SCALE_KEY = "shlongeeland-scale-v2";
export const DEFAULT_PAGE_SCALE = 1.35;

export function getStoredPageScale(): number {
  const raw = localStorage.getItem(SCALE_KEY);
  const parsed = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(parsed) ? Math.min(2.0, Math.max(0.7, parsed)) : DEFAULT_PAGE_SCALE;
}

function setPageScale(value: number): void {
  const clamped = Math.min(2.0, Math.max(0.7, value));
  const formatted = clamped.toFixed(2);
  document.documentElement.style.setProperty("--page-scale", formatted);
  localStorage.setItem(SCALE_KEY, formatted);
  syncScaleControls(clamped);
  window.dispatchEvent(new CustomEvent("shlongeeland:scale", { detail: clamped }));
}

function syncScaleControls(scale = getStoredPageScale()): void {
  const formatted = scale.toFixed(2);
  document.querySelectorAll<HTMLInputElement>("[data-scale-slider]").forEach((slider) => {
    slider.value = formatted;
  });
  document.querySelectorAll<HTMLElement>("[data-scale-readout]").forEach((el) => {
    el.textContent = `${formatted}x`;
  });
}

function setPopoverOpen(open: boolean, trigger?: HTMLButtonElement | null): void {
  document.querySelectorAll<HTMLButtonElement>("[data-scale-toggle]").forEach((btn) => {
    btn.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll<HTMLElement>("[data-scale-popover]").forEach((pop) => {
    if (open && trigger) {
      const rect = trigger.getBoundingClientRect();
      const top = Math.min(window.innerHeight - 130, rect.bottom + 10);
      const right = Math.max(12, window.innerWidth - rect.right);
      pop.style.top = `${Math.round(top)}px`;
      pop.style.right = `${Math.round(right)}px`;
    }
    pop.hidden = !open;
  });
}

export function applyStoredModes(): void {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const isDark =
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);

  const isCrystal = localStorage.getItem(CRYSTAL_KEY) === "true";
  document.documentElement.classList.toggle("crystal", isCrystal);

  const scale = getStoredPageScale();
  document.documentElement.style.setProperty("--page-scale", scale.toFixed(2));

  document
    .querySelectorAll<HTMLButtonElement>("[data-glass-toggle]")
    .forEach((btn) => btn.setAttribute("aria-pressed", String(isCrystal)));

  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
    .forEach((btn) => btn.setAttribute("aria-pressed", String(isDark)));

  syncScaleControls(scale);
  setPopoverOpen(false);
}

let controlsBound = false;

export function mountArcaneControls(): void {
  applyStoredModes();
  if (controlsBound) return;
  controlsBound = true;

  document.addEventListener("input", (event) => {
    const slider = (event.target as Element | null)?.closest<HTMLInputElement>("[data-scale-slider]");
    if (!slider) return;
    setPageScale(parseFloat(slider.value));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setPopoverOpen(false);
  });

  const syncPaletteButton = (detail?: {
    name?: string;
    base?: string;
    warp?: string;
    accent?: string;
  }) => {
    const base = detail?.base ?? document.documentElement.dataset.auroraBase;
    const accent = detail?.accent ?? document.documentElement.dataset.auroraAccent;
    const warp = detail?.warp ?? base;
    document.querySelectorAll<HTMLButtonElement>("[data-wormhole-shuffle]").forEach((btn) => {
      if (base) btn.style.setProperty("--wormhole-base", base);
      if (warp) btn.style.setProperty("--wormhole-warp", warp);
      if (accent) btn.style.setProperty("--wormhole-accent", accent);
      if (detail?.name) btn.title = `Wormhole: ${detail.name} (click to shuffle)`;
    });
  };

  window.addEventListener("shlongeeland:palette", (e) => {
    syncPaletteButton((e as CustomEvent).detail);
  });
  syncPaletteButton();

  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;

    const themeBtn = target?.closest<HTMLButtonElement>("[data-theme-toggle]");
    if (themeBtn) {
      const nextDark = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", nextDark);
      localStorage.setItem(THEME_KEY, nextDark ? "dark" : "light");
      applyStoredModes();
      window.dispatchEvent(new CustomEvent("shlongeeland:theme"));
      return;
    }

    const glassBtn = target?.closest<HTMLButtonElement>("[data-glass-toggle]");
    if (glassBtn) {
      const nextCrystal = !document.documentElement.classList.contains("crystal");
      document.documentElement.classList.toggle("crystal", nextCrystal);
      localStorage.setItem(CRYSTAL_KEY, String(nextCrystal));
      applyStoredModes();
      return;
    }

    const shuffleBtn = target?.closest<HTMLButtonElement>("[data-wormhole-shuffle]");
    if (shuffleBtn) {
      shuffleBtn.classList.remove("is-spinning");
      void shuffleBtn.offsetWidth;
      shuffleBtn.classList.add("is-spinning");
      window.dispatchEvent(new CustomEvent("shlongeeland:shuffle"));
      return;
    }

    const scaleToggle = target?.closest<HTMLButtonElement>("[data-scale-toggle]");
    if (scaleToggle) {
      const isOpen = scaleToggle.getAttribute("aria-expanded") === "true";
      setPopoverOpen(!isOpen, scaleToggle);
      return;
    }

    const scaleReset = target?.closest<HTMLButtonElement>("[data-scale-reset]");
    if (scaleReset) {
      setPageScale(DEFAULT_PAGE_SCALE);
      return;
    }

    const menuBtn = target?.closest<HTMLButtonElement>("[data-menu-toggle]");
    if (menuBtn) {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!expanded));
      return;
    }

    if (!target?.closest("[data-scale-popover]")) {
      setPopoverOpen(false);
    }
  });

  document.addEventListener("astro:after-swap", applyStoredModes);
  document.addEventListener("astro:page-load", applyStoredModes);
}