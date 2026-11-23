import { navigate } from "astro:transitions/client";
import { LANG_STORAGE_KEY } from "../i18n/ui";
import { isValidLang } from "../i18n/utils";

const THEME_KEY = "theme";
const CRYSTAL_KEY = "shlongeeland-crystal";
const PAUSE_KEY = "shlongeeland-paused";
const SCALE_KEY = "shlongeeland-scale-v2";
export const DEFAULT_PAGE_SCALE = 1.35;

const PALETTE_NAMES_RU: Record<string, string> = {
  "Classic Borealis": "Классическое сияние",
  "Hacker Terminal": "Хакерский терминал",
  "Monochrome Noir": "Монохромный нуар",
  "Polar Prism": "Полярная призма",
  "Infrared Thermal": "Инфракрасный тепловизор",
  "Cyberpunk Neon": "Киберпанк неон",
  "Abyssal Trench": "Бездна океана",
  "Serene Polar Dawn": "Тихий полярный рассвет",
  "Alabaster Ink (B&W)": "Алебастр и тушь (Ч/Б)",
  "Opal & Rosewater": "Опал и розовая вода",
  "Sunlit Mint Jade": "Солнечный мятный нефрит",
  "Hacker Daybreak": "Хакерский рассвет",
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function getStoredPageScale(): number {
  const raw = safeGet(SCALE_KEY);
  const parsed = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(parsed) ? Math.min(2.0, Math.max(0.7, parsed)) : DEFAULT_PAGE_SCALE;
}

function setPageScale(value: number): void {
  const clamped = Math.min(2.0, Math.max(0.7, value));
  const formatted = clamped.toFixed(2);
  document.documentElement.style.setProperty("--page-scale", formatted);
  safeSet(SCALE_KEY, formatted);
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

let activeSettingsTrigger: HTMLButtonElement | null = null;

function clampPopoverToViewport(pop: HTMLElement, trigger: HTMLElement): void {
  const margin = 12;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;

  pop.style.maxWidth = `${Math.max(180, vw - margin * 2)}px`;
  pop.style.maxHeight = `${Math.max(140, vh - margin * 2)}px`;

  const triggerRect = trigger.getBoundingClientRect();
  const popWidth = pop.offsetWidth;
  const popHeight = pop.offsetHeight;

  const rawLeft = triggerRect.right - popWidth;
  const left = Math.min(Math.max(margin, rawLeft), Math.max(margin, vw - popWidth - margin));

  const spaceBelow = vh - triggerRect.bottom - 10 - margin;
  const spaceAbove = triggerRect.top - 10 - margin;
  let top = triggerRect.bottom + 10;
  if (popHeight > spaceBelow && spaceAbove > spaceBelow) {
    top = triggerRect.top - popHeight - 10;
  }
  top = Math.min(Math.max(margin, top), Math.max(margin, vh - popHeight - margin));

  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
  pop.style.right = "auto";
}

function repositionOpenSettings(): void {
  const pop = document.querySelector<HTMLElement>("[data-settings-popover]");
  if (!pop || pop.hidden) return;
  const trigger =
    activeSettingsTrigger && document.contains(activeSettingsTrigger)
      ? activeSettingsTrigger
      : document.querySelector<HTMLButtonElement>("[data-settings-toggle]");
  if (trigger) clampPopoverToViewport(pop, trigger);
}

function setLangSubpanelOpen(open: boolean): void {
  document.querySelectorAll<HTMLButtonElement>("[data-lang-toggle]").forEach((btn) => {
    btn.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll<HTMLElement>("[data-lang-panel]").forEach((panel) => {
    panel.hidden = !open;
  });
  repositionOpenSettings();
}

function setScaleSubpanelOpen(open: boolean): void {
  document.querySelectorAll<HTMLButtonElement>("[data-scale-toggle]").forEach((btn) => {
    btn.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll<HTMLElement>("[data-scale-panel]").forEach((panel) => {
    panel.hidden = !open;
  });
  repositionOpenSettings();
}

function setSettingsPopoverOpen(open: boolean, trigger?: HTMLButtonElement | null): void {
  activeSettingsTrigger = open ? (trigger ?? null) : null;
  document.querySelectorAll<HTMLButtonElement>("[data-settings-toggle]").forEach((btn) => {
    btn.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll<HTMLElement>("[data-settings-popover]").forEach((pop) => {
    pop.hidden = !open;
    if (open) {
      const anchor = trigger ?? document.querySelector<HTMLButtonElement>("[data-settings-toggle]");
      if (anchor) clampPopoverToViewport(pop, anchor);
    }
  });
  if (!open) {
    setLangSubpanelOpen(false);
    setScaleSubpanelOpen(false);
  }
}

let lastPalette: { name?: string; base?: string; warp?: string; accent?: string } | undefined;

function syncPaletteButton(detail = lastPalette): void {
  if (detail) lastPalette = detail;
  const base = detail?.base ?? document.documentElement.dataset.auroraBase;
  const accent = detail?.accent ?? document.documentElement.dataset.auroraAccent;
  const warp = detail?.warp ?? base;
  const isRu = document.documentElement.lang === "ru";

  document.querySelectorAll<HTMLButtonElement>("[data-wormhole-shuffle]").forEach((btn) => {
    if (base) btn.style.setProperty("--wormhole-base", base);
    if (warp) btn.style.setProperty("--wormhole-warp", warp);
    if (accent) btn.style.setProperty("--wormhole-accent", accent);
    if (detail?.name) {
      const displayName = isRu ? (PALETTE_NAMES_RU[detail.name] ?? detail.name) : detail.name;
      btn.title = isRu
        ? `Червоточина: ${displayName} (нажмите для смены)`
        : `Wormhole: ${displayName} (click to shuffle)`;
    }
  });
}

export function applyStoredModes(): void {
  const savedTheme = safeGet(THEME_KEY);
  const isDark =
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);

  const isCrystal = safeGet(CRYSTAL_KEY) === "true";
  document.documentElement.classList.toggle("crystal", isCrystal);

  const isPaused = safeGet(PAUSE_KEY) === "true";
  document.documentElement.classList.toggle("motion-paused", isPaused);

  const scale = getStoredPageScale();
  document.documentElement.style.setProperty("--page-scale", scale.toFixed(2));

  document.querySelectorAll<HTMLButtonElement>("[data-glass-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(isCrystal));
    const valEl = btn.querySelector<HTMLElement>("[data-glass-value]");
    if (valEl) {
      valEl.textContent = (isCrystal ? btn.dataset.labelOn : btn.dataset.labelOff) ?? "";
    }
  });

  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(isDark));
    const valEl = btn.querySelector<HTMLElement>("[data-theme-value]");
    if (valEl) {
      valEl.textContent = (isDark ? btn.dataset.labelDark : btn.dataset.labelLight) ?? "";
    }
  });

  document.querySelectorAll<HTMLButtonElement>("[data-motion-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(isPaused));
    const label = isPaused ? btn.dataset.labelResume : btn.dataset.labelPause;
    const title = isPaused ? btn.dataset.titleResume : btn.dataset.titlePause;
    if (label) btn.setAttribute("aria-label", label);
    if (title) btn.title = title;
  });

  syncScaleControls(scale);
  syncPaletteButton();
}

function closeMenusOnSwap(): void {
  setSettingsPopoverOpen(false);
  applyStoredModes();
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
    if (event.key === "Escape") {
      setSettingsPopoverOpen(false);
    }
  });

  window.addEventListener("resize", repositionOpenSettings, { passive: true });
  window.visualViewport?.addEventListener("resize", repositionOpenSettings, { passive: true });

  window.addEventListener("shlongeeland:palette", (e) => {
    syncPaletteButton((e as CustomEvent).detail);
  });

  document.addEventListener(
    "click",
    (event) => {
      const langOption = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "[data-lang-option]",
      );
      if (!langOption) return;

      const nextLang = langOption.dataset.langOption;
      if (isValidLang(nextLang)) {
        safeSet(LANG_STORAGE_KEY, nextLang);
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setSettingsPopoverOpen(false);

      const targetUrl = new URL(langOption.href, window.location.origin);
      if (!targetUrl.search && window.location.search) {
        targetUrl.search = window.location.search;
      }
      if (!targetUrl.hash && window.location.hash) {
        targetUrl.hash = window.location.hash;
      }

      const nextPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      const currPath = window.location.pathname + window.location.search + window.location.hash;
      if (nextPath !== currPath) {
        void navigate(nextPath);
      }
    },
    { capture: true },
  );

  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;

    const settingsToggle = target?.closest<HTMLButtonElement>("[data-settings-toggle]");
    if (settingsToggle) {
      const isOpen = settingsToggle.getAttribute("aria-expanded") === "true";
      setSettingsPopoverOpen(!isOpen, settingsToggle);
      return;
    }

    const langToggle = target?.closest<HTMLButtonElement>("[data-lang-toggle]");
    if (langToggle) {
      const isOpen = langToggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) setScaleSubpanelOpen(false);
      setLangSubpanelOpen(!isOpen);
      return;
    }

    const themeBtn = target?.closest<HTMLButtonElement>("[data-theme-toggle]");
    if (themeBtn) {
      const nextDark = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", nextDark);
      safeSet(THEME_KEY, nextDark ? "dark" : "light");
      applyStoredModes();
      window.dispatchEvent(new CustomEvent("shlongeeland:theme"));
      return;
    }

    const glassBtn = target?.closest<HTMLButtonElement>("[data-glass-toggle]");
    if (glassBtn) {
      const nextCrystal = !document.documentElement.classList.contains("crystal");
      document.documentElement.classList.toggle("crystal", nextCrystal);
      safeSet(CRYSTAL_KEY, String(nextCrystal));
      applyStoredModes();
      return;
    }

    const scaleToggle = target?.closest<HTMLButtonElement>("[data-scale-toggle]");
    if (scaleToggle) {
      const isOpen = scaleToggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) setLangSubpanelOpen(false);
      setScaleSubpanelOpen(!isOpen);
      return;
    }

    const scaleReset = target?.closest<HTMLButtonElement>("[data-scale-reset]");
    if (scaleReset) {
      setPageScale(DEFAULT_PAGE_SCALE);
      return;
    }

    const motionBtn = target?.closest<HTMLButtonElement>("[data-motion-toggle]");
    if (motionBtn) {
      const nextPaused = !document.documentElement.classList.contains("motion-paused");
      document.documentElement.classList.toggle("motion-paused", nextPaused);
      safeSet(PAUSE_KEY, String(nextPaused));
      applyStoredModes();
      window.dispatchEvent(new CustomEvent("shlongeeland:pause", { detail: nextPaused }));
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

    const menuBtn = target?.closest<HTMLButtonElement>("[data-menu-toggle]");
    if (menuBtn) {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!expanded));
      return;
    }

    if (!target?.closest("[data-settings-popover]")) {
      setSettingsPopoverOpen(false);
    }
  });

  document.addEventListener("astro:after-swap", closeMenusOnSwap);
  document.addEventListener("astro:page-load", closeMenusOnSwap);
}