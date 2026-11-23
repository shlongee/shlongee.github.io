import * as THREE from "three";
import { navigate } from "astro:transitions/client";

const TOUCH_SIZE = 64;
const TOUCH_MAX_AGE = 120;
const TOUCH_RADIUS = 0.15;
const SOURCE_THRESHOLD = 90;
const PARTICLE_STEP = 1;
const CAMERA_Z = 300;
const CAMERA_FOV = 50;
const MAX_SOURCE_WIDTH = 680;

import vertexShader from "./title-particles.vert?raw";
import fragmentShader from "./title-particles.frag?raw";

type TouchPoint = {
  x: number;
  y: number;
  age: number;
  force: number;
};

class TouchTexture {
  readonly canvas = document.createElement("canvas");
  readonly texture: THREE.CanvasTexture;
  private readonly context: CanvasRenderingContext2D;
  private readonly points: TouchPoint[] = [];
  private lastPoint: { x: number; y: number } | null = null;

  constructor() {
    this.canvas.width = TOUCH_SIZE;
    this.canvas.height = TOUCH_SIZE;
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas2D is unavailable");
    this.context = context;
    this.clear();
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }

  addPoint(x: number, y: number, boost = 0) {
    const point = { x, y };
    let force = boost;
    if (this.lastPoint) {
      const dx = point.x - this.lastPoint.x;
      const dy = point.y - this.lastPoint.y;
      force = Math.max(boost, Math.min((dx * dx + dy * dy) * 10000, 1));
    }
    this.lastPoint = point;
    this.points.push({ ...point, age: 0, force });
  }

  resetStroke() {
    this.lastPoint = null;
  }

  update() {
    this.clear();
    for (let index = this.points.length - 1; index >= 0; index -= 1) {
      const point = this.points[index];
      point.age += 1;
      if (point.age > TOUCH_MAX_AGE) {
        this.points.splice(index, 1);
      } else {
        this.drawPoint(point);
      }
    }
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }

  private clear() {
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, TOUCH_SIZE, TOUCH_SIZE);
  }

  private drawPoint(point: TouchPoint) {
    const positionX = point.x * TOUCH_SIZE;
    const positionY = (1 - point.y) * TOUCH_SIZE;
    let intensity: number;
    if (point.age < TOUCH_MAX_AGE * 0.3) {
      intensity = easeOutSine(point.age / (TOUCH_MAX_AGE * 0.3));
    } else {
      intensity = easeOutSine(
        1 - (point.age - TOUCH_MAX_AGE * 0.3) / (TOUCH_MAX_AGE * 0.7),
      );
    }
    intensity *= point.force;
    const radius = TOUCH_SIZE * TOUCH_RADIUS * intensity;
    if (radius <= 0) return;

    const gradient = this.context.createRadialGradient(
      positionX,
      positionY,
      radius * 0.25,
      positionX,
      positionY,
      radius,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.2)");
    gradient.addColorStop(1, "rgba(0,0,0,0.0)");
    this.context.beginPath();
    this.context.fillStyle = gradient;
    this.context.arc(positionX, positionY, radius, 0, Math.PI * 2);
    this.context.fill();
  }
}

function easeOutSine(value: number) {
  return Math.sin((value * Math.PI) / 2);
}

function easeOutQuad(value: number) {
  return 1 - (1 - value) * (1 - value);
}

function easeInQuad(value: number) {
  return value * value;
}

async function loadFont(fontFamily: string) {
  if (!document.fonts) return;
  await document.fonts.ready;
  try {
    await document.fonts.load(`700 100px ${fontFamily}`);
  } catch {
    // Fall back gracefully if the browser already resolved the preloaded font
  }
}

type TravelEffects = {
  ready: boolean;
  start: () => void;
};

function setupWarpLinks(effects: TravelEffects) {
  let navigationTimer = 0;
  let navigating = false;

  const onLinkClick = (event: MouseEvent) => {
    const target = event.target as Element | null;
    const link = target?.closest<HTMLAnchorElement>("a[data-warp-link]");
    if (
      !link ||
      !link.href ||
      link.target === "_blank" ||
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
    if (navigating) return;
    navigating = true;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      void navigate(link.href);
      return;
    }

    window.dispatchEvent(new CustomEvent("shlongeeland:warp"));
    if (effects.ready) effects.start();
    navigationTimer = window.setTimeout(() => {
      void navigate(link.href);
    }, 450);
  };

  document.addEventListener("click", onLinkClick, { capture: true });
  document.addEventListener(
    "astro:before-swap",
    () => {
      if (navigationTimer) window.clearTimeout(navigationTimer);
      document.removeEventListener("click", onLinkClick, { capture: true });
    },
    { once: true },
  );
}

function makeTitleSource(
  title: string,
  width: number,
  height: number,
  fontFamily: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas2D is unavailable");

  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);
  let fontSize = Math.min(height * 0.8, width * 0.15);
  context.font = `700 ${fontSize}px ${fontFamily}`;
  context.letterSpacing = `${fontSize * 0.035}px`;
  const maximumWidth = width * 0.93;
  const measuredWidth = context.measureText(title).width;
  if (measuredWidth > maximumWidth) fontSize *= maximumWidth / measuredWidth;

  context.font = `700 ${fontSize}px ${fontFamily}`;
  context.letterSpacing = `${fontSize * 0.035}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "white";
  context.fillText(title, width / 2, height * 0.46);

  return { canvas, pixels: context.getImageData(0, 0, width, height).data };
}

function makeGeometry(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let count = 0;
  for (let y = 0; y < height; y += PARTICLE_STEP) {
    for (let x = 0; x < width; x += PARTICLE_STEP) {
      if ((x + y) % 2 !== 0) continue;
      if (pixels[(y * width + x) * 4] > SOURCE_THRESHOLD) count += 1;
    }
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex([0, 2, 1, 2, 3, 1]);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0],
      3,
    ),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2),
  );

  const indices = new Float32Array(count);
  const offsets = new Float32Array(count * 2);
  const angles = new Float32Array(count);
  let instance = 0;
  for (let y = 0; y < height; y +=  PARTICLE_STEP) {
    for (let x = 0; x < width; x += PARTICLE_STEP) {
      if ((x + y) % 2 !== 0) continue;
      if (pixels[(y * width + x) * 4] <= SOURCE_THRESHOLD) continue;
      indices[instance] = instance;
      offsets[instance * 2] = x;
      offsets[instance * 2 + 1] = height - y;
      angles[instance] = Math.random() * Math.PI;
      instance += 1;
    }
  }

  geometry.setAttribute(
    "pindex",
    new THREE.InstancedBufferAttribute(indices, 1),
  );
  geometry.setAttribute(
    "offset",
    new THREE.InstancedBufferAttribute(offsets, 2),
  );
  geometry.setAttribute("angle", new THREE.InstancedBufferAttribute(angles, 1));
  geometry.instanceCount = count;
  return geometry;
}

async function initTitleParticles() {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-title-particles]",
  );
  const fallback = document.querySelector<HTMLElement>("[data-title-fallback]");
  if (!canvas || !fallback) return;
  if (canvas.dataset.particlesInit === "true") return;
  canvas.dataset.particlesInit = "true";

  const travelEffects: TravelEffects = { ready: false, start: () => {} };
  setupWarpLinks(travelEffects);

  const fontFamily = getComputedStyle(fallback).fontFamily || "sans-serif";

  const showFallback = () => {
    fallback.dataset.visible = "true";
    canvas.dataset.failed = "true";
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showFallback();
    return;
  }

  const title = canvas.dataset.title || fallback.textContent?.trim() || "";
  if (!title) {
    showFallback();
    return;
  }

  let renderer: THREE.WebGLRenderer;
  let touchTexture: TouchTexture;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });
    renderer.setClearColor(0x000000, 0);
    touchTexture = new TouchTexture();
  } catch {
    showFallback();
    return;
  }

  const targetPrimary = new THREE.Color(document.documentElement.dataset.auroraBase || "#14d8e8");
  const targetSecondary = new THREE.Color(document.documentElement.dataset.auroraAccent || "#a66bff");

  const onPalette = (e: Event) => {
    const detail = (e as CustomEvent<{ base?: string; accent?: string }>).detail;
    if (detail?.base) targetPrimary.set(detail.base);
    if (detail?.accent) targetSecondary.set(detail.accent);
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 1000);
  camera.position.z = CAMERA_Z;
  const uniforms = {
    uTime: { value: 0 },
    uRandom: { value: 1 },
    uDepth: { value: 40 },
    uSize: { value: 0.5 },
    uTextureSize: { value: new THREE.Vector2(1, 1) },
    uTexture: { value: null as THREE.CanvasTexture | null },
    uTouch: { value: touchTexture.texture },
    uColorPrimary: { value: targetPrimary.clone() },
    uColorSecondary: { value: targetSecondary.clone() },
  };
  const material = new THREE.RawShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  if (import.meta.env.DEV && import.meta.hot) {
    import.meta.hot.accept(
      ["./title-particles.vert?raw", "./title-particles.frag?raw"],
      ([vertMod, fragMod]) => {
        if (vertMod) material.vertexShader = vertMod.default;
        if (fragMod) material.fragmentShader = fragMod.default;
        material.needsUpdate = true;
      },
    );
  }

  let mesh: THREE.Mesh<
    THREE.InstancedBufferGeometry,
    THREE.RawShaderMaterial
  > | null = null;
  let sourceTexture: THREE.CanvasTexture | null = null;
  let animationFrame = 0;
  let resizeFrame = 0;
  let disposed = false;
  let targetParticleSize : number;
  let outro: {
    startedAt: number;
    random: number;
    depth: number;
    size: number;
  } | null = null;
  const startedAt = performance.now();

  const startDisintegration = () => {
    if (outro) return;
    outro = {
      startedAt: performance.now(),
      random: uniforms.uRandom.value,
      depth: uniforms.uDepth.value,
      size: uniforms.uSize.value,
    };
  };
  travelEffects.start = startDisintegration;

  const pointerToTouch = (clientX: number, clientY: number, boost = 0) => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    touchTexture.addPoint(
      THREE.MathUtils.clamp((clientX - bounds.left) / bounds.width, 0, 1),
      THREE.MathUtils.clamp(1 - (clientY - bounds.top) / bounds.height, 0, 1),
      boost,
    );
  };

  const onPointerDown = (event: PointerEvent) => {
    if ((event.target as Element | null)?.closest("a, button")) return;
    touchTexture.resetStroke();
    pointerToTouch(event.clientX, event.clientY, 0.75);
  };

  const onPointerMove = (event: PointerEvent) => {
    const boost = event.pointerType === "touch" ? 0.35 : 0;
    pointerToTouch(event.clientX, event.clientY, boost);
  };
  function clearPointer() {
    touchTexture.resetStroke();
  }

  const rebuild = () => {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    const viewportWidth = Math.max(1, Math.round(bounds.width));
    const viewportHeight = Math.max(1, Math.round(bounds.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(viewportWidth, viewportHeight, false);
    camera.aspect = viewportWidth / viewportHeight;
    camera.updateProjectionMatrix();

    const visibleHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV * 0.5)) * CAMERA_Z;
    const visibleWidth = visibleHeight * camera.aspect;

    const targetSourceWidth = THREE.MathUtils.clamp(
      Math.round(viewportWidth * 1.5),
      540,
      MAX_SOURCE_WIDTH,
    );
    const sourceScale = targetSourceWidth / visibleWidth;
    const sourceWidth = Math.max(1, Math.round(visibleWidth * sourceScale));
    const sourceHeight = Math.max(1, Math.round(visibleHeight * sourceScale));
    const inverseSourceScale = 1 / sourceScale;

    targetParticleSize = viewportWidth <= 520 ? 3.2 : 3.0;

    const source = makeTitleSource(title, sourceWidth, sourceHeight, fontFamily);
    const geometry = makeGeometry(source.pixels, sourceWidth, sourceHeight);
    const texture = new THREE.CanvasTexture(source.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }
    sourceTexture?.dispose();
    sourceTexture = texture;
    uniforms.uTexture.value = texture;
    uniforms.uTextureSize.value.set(sourceWidth, sourceHeight);

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(inverseSourceScale, inverseSourceScale, 1);
    mesh.position.set(-visibleWidth / 2, -visibleHeight / 2, 0);
    scene.add(mesh);
  };

  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(rebuild);
  };

const onVisibilityChange = () => {
  if (disposed) return;
  if (document.hidden) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  } else if (!animationFrame) {
    animationFrame = requestAnimationFrame(render);
  }
};

  const render = (now: number) => {
    if (disposed || document.hidden) {
      animationFrame = 0;
      return;
    }
    const elapsed = (now - startedAt) / 1000;
    uniforms.uTime.value = elapsed;
    if (outro) {
      const outroElapsed = (now - outro.startedAt) / 1000;
      const outroProgress = Math.min(outroElapsed / 0.8, 1);
      const sizeProgress = Math.min(outroElapsed / 0.64, 1);
      uniforms.uRandom.value = THREE.MathUtils.lerp(
        outro.random,
        5,
        easeOutQuad(outroProgress),
      );
      uniforms.uDepth.value = THREE.MathUtils.lerp(
        outro.depth,
        -20,
        easeInQuad(outroProgress),
      );
      uniforms.uSize.value = THREE.MathUtils.lerp(
        outro.size,
        0,
        easeOutQuad(sizeProgress),
      );
      } else {
      const intro = easeOutQuad(Math.min(elapsed, 1));
      const depthIntro = easeOutQuad(Math.min(elapsed / 1.5, 1));
      const isCompact = canvas.clientWidth <= 600;
      uniforms.uRandom.value = THREE.MathUtils.lerp(1, isCompact ? 0.75 : 1.8, intro);
      uniforms.uDepth.value = THREE.MathUtils.lerp(40, isCompact ? 2.0 : 4.0, depthIntro);
      uniforms.uSize.value = THREE.MathUtils.lerp(
        0.5,
        targetParticleSize,
        intro,
      );
      uniforms.uColorPrimary.value.lerp(targetPrimary, 0.06);
      uniforms.uColorSecondary.value.lerp(targetSecondary, 0.06);
    }
    touchTexture.update();
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(render);
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(resizeFrame);
    delete canvas.dataset.particlesInit;
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", clearPointer);
    window.removeEventListener("pointercancel", clearPointer);
    window.removeEventListener("pointerleave", clearPointer);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("shlongeeland:palette", onPalette);
    mesh?.geometry.dispose();
    material.dispose();
    sourceTexture?.dispose();
    touchTexture.dispose();
    renderer.dispose();
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", clearPointer, { passive: true });
  window.addEventListener("pointercancel", clearPointer, { passive: true });
  window.addEventListener("pointerleave", clearPointer, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("astro:before-swap", dispose, { once: true });
  window.addEventListener("pagehide", dispose, { once: true });
  window.addEventListener("shlongeeland:palette", onPalette);

  try {
    await loadFont(fontFamily);
    if (disposed) return;
    rebuild();
    fallback.dataset.visible = "false";
    animationFrame = requestAnimationFrame(render);
    travelEffects.ready = true;
  } catch {
    dispose();
    showFallback();
  }
}

document.addEventListener("astro:page-load", () => {
  void initTitleParticles();
})
