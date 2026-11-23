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

  let lastTransform = content.style.transform;
  let lastHeight = frame.style.height;

  const sync = () => {
    const baseWidth = content.offsetWidth;
    const availWidth = frame.clientWidth;
    if (!baseWidth || !availWidth) return;

    const targetScale = getStoredPageScale();
    const scale = Math.min(targetScale, availWidth / baseWidth);
    const offsetX = Math.max(0, (availWidth - baseWidth * scale) / 2);

    let nextTransform = "";
    let nextHeight = "";

    if (Math.abs(scale - 1) < 0.001) {
      nextTransform = offsetX >= 0.5 ? `translateX(${offsetX}px)` : "";
    } else {
      nextTransform = `translateX(${offsetX}px) scale(${scale})`;
      nextHeight = `${content.offsetHeight * scale}px`;
    }

    if (nextTransform !== lastTransform) {
      content.style.transform = nextTransform;
      lastTransform = nextTransform;
    }
    if (nextHeight !== lastHeight) {
      frame.style.height = nextHeight;
      lastHeight = nextHeight;
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