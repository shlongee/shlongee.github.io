let mounted = false;
let cleanupCurrent: (() => void) | null = null;

function attachScaler(): void {
  cleanupCurrent?.();
  cleanupCurrent = null;

  const frame = document.querySelector<HTMLElement>("[data-page-scale-frame]");
  const content = document.querySelector<HTMLElement>("[data-page-scale-content]");
  if (!frame || !content) return;

  const sync = () => {
    const baseWidth = content.offsetWidth;
    const availWidth = frame.clientWidth;
    if (!baseWidth || !availWidth) return;

    const scale = Math.min(1, availWidth / baseWidth);
    if (scale >= 0.999) {
      content.style.transform = "";
      frame.style.height = "";
    } else {
      content.style.transform = `scale(${scale})`;
      frame.style.height = `${content.offsetHeight * scale}px`;
    }
  };

  const ro = new ResizeObserver(sync);
  ro.observe(frame);
  ro.observe(content);
  document.fonts?.ready.then(sync);
  sync();

  cleanupCurrent = () => ro.disconnect();
}

export function mountPageScaler(): void {
  attachScaler();
  if (mounted) return;
  mounted = true;

  document.addEventListener("astro:after-swap", attachScaler);
  document.addEventListener("astro:page-load", attachScaler);
}