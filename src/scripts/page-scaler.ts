import { getStoredPageScale } from "./arcane-controls";

let mounted = false;
let cleanupCurrent: (() => void) | null = null;
let syncCurrent: (() => void) | null = null;

function attachScaler(): void {
  cleanupCurrent?.();
  cleanupCurrent = null;
  syncCurrent = null;

  const frame = document.querySelector<HTMLElement>("[data-page-scale-frame]");
  const content = document.querySelector<HTMLElement>("[data-page-scale-content]");
  if (!frame || !content) return;

  const sync = () => {
    const baseWidth = content.offsetWidth;
    const availWidth = frame.clientWidth;
    if (!baseWidth || !availWidth) return;

    const targetScale = getStoredPageScale();
    const scale = Math.min(targetScale, availWidth / baseWidth);

    if (Math.abs(scale - 1) < 0.001) {
      content.style.transform = "";
      frame.style.height = "";
    } else {
      const offsetX = Math.max(0, (availWidth - baseWidth * scale) / 2);
      content.style.transform = `translateX(${offsetX}px) scale(${scale})`;
      frame.style.height = `${content.offsetHeight * scale}px`;
    }
  };

  const ro = new ResizeObserver(sync);
  ro.observe(frame);
  ro.observe(content);
  document.fonts?.ready.then(sync);
  sync();

  syncCurrent = sync;
  cleanupCurrent = () => ro.disconnect();
}

export function mountPageScaler(): void {
  attachScaler();
  if (mounted) return;
  mounted = true;

  window.addEventListener("shlongeeland:scale", () => syncCurrent?.());
  document.addEventListener("astro:after-swap", attachScaler);
  document.addEventListener("astro:page-load", attachScaler);
}