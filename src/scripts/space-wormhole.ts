import * as THREE from "three";
import tunnelVertex from "./wormhole.vert?raw";
import tunnelFragment from "./wormhole.frag?raw";
import starsVertex from "./stars.vert?raw";
import starsFragment from "./stars.frag?raw";
import mushroomVertex from "./mushroom.vert?raw";
import mushroomFragment from "./mushroom.frag?raw";

interface WormholePalette {
  name: string;
  deep: string;
  fog: string;
  base: string;
  warp: string;
  accent: string;
}

const DARK_PALETTES: WormholePalette[] = [
  { name: "Classic Borealis", deep: "#020710", fog: "#071c2b", base: "#14d8e8", warp: "#24e6b5", accent: "#a66bff" },
  { name: "Hacker Terminal", deep: "#010502", fog: "#041c0b", base: "#00ff66", warp: "#26c952", accent: "#b8ffd0" },
  { name: "Monochrome Noir", deep: "#040405", fog: "#16181c", base: "#78808f", warp: "#c2c9d6", accent: "#ffffff" },
  { name: "Polar Prism", deep: "#03070e", fog: "#091d2b", base: "#24f0a8", warp: "#4b82ff", accent: "#ff5ea8" },
  { name: "Infrared Thermal", deep: "#080107", fog: "#21051b", base: "#e61c52", warp: "#ff771c", accent: "#ffe14d" },
  { name: "Cyberpunk Neon", deep: "#070312", fog: "#190a36", base: "#00f5d4", warp: "#ff2a85", accent: "#ffd166" },
  { name: "Abyssal Trench", deep: "#01050c", fog: "#04182e", base: "#0088ff", warp: "#00f0ff", accent: "#a882ff" },
];

const LIGHT_PALETTES: WormholePalette[] = [
  { name: "Serene Polar Dawn", deep: "#1c2f45", fog: "#789bb8", base: "#30d0f5", warp: "#5eecc8", accent: "#b78cff" },
  { name: "Alabaster Ink (B&W)", deep: "#24272e", fog: "#8d94a1", base: "#b4bcc9", warp: "#dce1eb", accent: "#ffffff" },
  { name: "Opal & Rosewater", deep: "#2f2742", fog: "#8f80ad", base: "#62e8c4", warp: "#82b4ff", accent: "#ffb3cc" },
  { name: "Sunlit Mint Jade", deep: "#1c383d", fog: "#749fa3", base: "#4eedaf", warp: "#72dfe8", accent: "#ffe49e" },
  { name: "Hacker Daybreak", deep: "#12291c", fog: "#578269", base: "#29e878", warp: "#75ffa8", accent: "#e0ffeb" },
];

export function mountSpaceWormhole(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-space-wormhole]");
  if (!canvas) return;

  if (canvas.dataset.wormholeMounted) return;
  canvas.dataset.wormholeMounted = "true";

  const isDarkTheme = () => document.documentElement.classList.contains("dark");
  let darkIndex = 0;
  let lightIndex = 0;

  const getInitialPalette = () =>
    isDarkTheme() ? DARK_PALETTES[darkIndex] : LIGHT_PALETTES[lightIndex];
  
  const initial = getInitialPalette();

  const publishPalette = (palette: WormholePalette) => {
    document.documentElement.dataset.auroraBase = palette.base;
    document.documentElement.dataset.auroraAccent = palette.accent;
    window.dispatchEvent(new CustomEvent("shlongeeland:palette", { detail: palette }));
  };
  publishPalette(initial);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch {
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x03050b, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.z = 100;

  const tunnelUniforms = {
    uTime: { value: 0 },
    uWarp: { value: 0 },
    uSpeed: { value: 0.42 },
    uSwirl: { value: 1.0 },
    uDensity: { value: 0.7 },
    uSplit: { value: 0.0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uColorDeep: { value: new THREE.Color(initial.deep) },
    uColorFog: { value: new THREE.Color(initial.fog) },
    uColorBase: { value: new THREE.Color(initial.base) },
    uColorWarp: { value: new THREE.Color(initial.warp) },
    uColorAccent: { value: new THREE.Color(initial.accent) },
  };

  const targetColors = {
    deep: new THREE.Color(initial.deep),
    fog: new THREE.Color(initial.fog),
    base: new THREE.Color(initial.base),
    warp: new THREE.Color(initial.warp),
    accent: new THREE.Color(initial.accent),
  };

  const applyTargetPalette = (palette: WormholePalette) => {
    targetColors.deep.set(palette.deep);
    targetColors.fog.set(palette.fog);
    targetColors.base.set(palette.base);
    targetColors.warp.set(palette.warp);
    targetColors.accent.set(palette.accent);
  };

  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadMat = new THREE.RawShaderMaterial({
    uniforms: tunnelUniforms,
    vertexShader: tunnelVertex,
    fragmentShader: tunnelFragment,
    depthTest: false,
    depthWrite: false,
  });
  const bgScene = new THREE.Scene();
  const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  bgScene.add(new THREE.Mesh(quadGeo, quadMat));

  // Procedural twinkling stars
  const starCount = 550;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starSeeds = new Float32Array(starCount);
  const starPalette = [
    new THREE.Color(0xe8fff8),
    new THREE.Color(0x9be7ff),
    new THREE.Color(0x9effcf),
    new THREE.Color(0xffffff),
    new THREE.Color(0xe6b8ff),
  ];

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    starPositions[i3] = (Math.random() - 0.5) * 960;
    starPositions[i3 + 1] = (Math.random() - 0.5) * 650;
    starPositions[i3 + 2] = -Math.random() * 1400;
    const c = starPalette[i % starPalette.length];
    starColors[i3] = c.r;
    starColors[i3 + 1] = c.g;
    starColors[i3 + 2] = c.b;
    starSizes[i] = Math.random() > 0.86 ? 4.8 + Math.random() * 3.0 : 2.2 + Math.random() * 2.4;
    starSeeds[i] = Math.random();
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute("aSeed", new THREE.BufferAttribute(starSeeds, 1));

  const starUniforms = {
    uPixelRatio: { value: pixelRatio },
    uTime: tunnelUniforms.uTime,
    uWarp: tunnelUniforms.uWarp,
    uFogColor: tunnelUniforms.uColorFog,
  };

  const starMat = new THREE.RawShaderMaterial({
    uniforms: starUniforms,
    vertexShader: starsVertex,
    fragmentShader: starsFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

    // --- 3D Bioluminescent Aurora Mushrooms ---
  const capPoints = [
    new THREE.Vector2(0.0, 14.0),
    new THREE.Vector2(5.5, 13.0),
    new THREE.Vector2(11.5, 9.2),
    new THREE.Vector2(14.5, 4.0),
    new THREE.Vector2(13.2, 0.8),
    new THREE.Vector2(6.0, 2.2),
    new THREE.Vector2(0.0, 3.0),
  ];
  const stemPoints = [
    new THREE.Vector2(0.0, -14.0),
    new THREE.Vector2(3.6, -12.8),
    new THREE.Vector2(2.6, -4.0),
    new THREE.Vector2(3.1, 3.5),
    new THREE.Vector2(0.0, 4.0),
  ];
  const capGeo = new THREE.LatheGeometry(capPoints, 18);
  const stemGeo = new THREE.LatheGeometry(stemPoints, 12);

  type MushroomEffect = "aurora" | "ripple" | "surge" | "bloom";
  interface Mushroom3D {
    group: THREE.Group;
    capMat: THREE.RawShaderMaterial;
    stemMat: THREE.RawShaderMaterial;
    effect: MushroomEffect;
    label: string;
    labelRu: string;
    colorHex: string;
    speedMul: number;
    phase: number;
    rotSpeed: THREE.Vector3;
    popScale: number;
    popping: boolean;
    baseScale: number;
  }

  const mushroomConfigs: Array<{ effect: MushroomEffect; color: string; label: string, labelRu: string }> = [
    { effect: "aurora", color: "#4af2be", label: "✦ Aurora shift", labelRu: "✦ Сдвиг сияния" },
    { effect: "ripple", color: "#6ee2ff", label: "✦ Warp ripple", labelRu: "✦ Спазм червоточины" },
    { effect: "surge", color: "#c98eff", label: "✦ Star surge", labelRu: "✦ Звёздный рывок" },
    { effect: "bloom", color: "#ff9ed6", label: "✦ Spore glow", labelRu: "✦ Сияние спор" },
    { effect: "aurora", color: "#7effe0", label: "✦ Recolor", labelRu: "✦ Перекрас" },
  ];

  const mushroomRoot = new THREE.Group();
  const rayTargets: THREE.Mesh[] = [];
  const mushrooms: Mushroom3D[] = [];

  const placeMushroomAtSpawn = (m: THREE.Group, zStart: number) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 140 + Math.random() * 270;
    m.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, zStart);
  };

  mushroomConfigs.forEach((cfg, index) => {
    const group = new THREE.Group();
    const baseUniforms = {
      uGlowColor: { value: new THREE.Color(cfg.color) },
      uFogColor: tunnelUniforms.uColorFog,
      uTime: tunnelUniforms.uTime,
      uHover: { value: 0 },
    };

    const capMat = new THREE.RawShaderMaterial({
      uniforms: { ...baseUniforms, uIsCap: { value: 1.0 } },
      vertexShader: mushroomVertex,
      fragmentShader: mushroomFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const stemMat = new THREE.RawShaderMaterial({
      uniforms: { ...baseUniforms, uIsCap: { value: 0.0 } },
      vertexShader: mushroomVertex,
      fragmentShader: mushroomFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const capMesh = new THREE.Mesh(capGeo, capMat);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    capMesh.userData.mushroomIndex = index;
    stemMesh.userData.mushroomIndex = index;
    rayTargets.push(capMesh, stemMesh);

    group.add(stemMesh, capMesh);
    group.scale.setScalar(0.85 + Math.random() * 0.45);
    placeMushroomAtSpawn(group, -240 - index * 240);
    mushroomRoot.add(group);

    mushrooms.push({
      group,
      capMat,
      stemMat,
      effect: cfg.effect,
      label: cfg.label,
      labelRu: cfg.labelRu,
      colorHex: cfg.color,
      speedMul: 0.9 + Math.random() * 0.5,
      phase: index * 1.9,
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.9,
        (Math.random() - 0.5) * 0.6,
      ),
      popScale: 1,
      popping: false,
      baseScale: 0.75 + Math.random() * 0.55,
    });
  });
  scene.add(mushroomRoot);

  // Star surge boost (triggered by clicking the purple mushroom)
  let starSurge = 0;
  let pulseTimer = 0;
  const triggerPulse = () => {
    overrideWarp = null;
    warpTarget = 0.2;
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      warpTarget = 0;
    }, 360);
  };

  // Raycaster for hovering & clicking 3D mushrooms without blocking page elements
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoveredMushroomIdx = -1;

  const updateNdc = (clientX: number, clientY: number) => {
    ndc.set(
      (clientX / Math.max(1, window.innerWidth)) * 2 - 1,
      -(clientY / Math.max(1, window.innerHeight)) * 2 + 1,
    );
  };

  const spawnDomBurst = (cx: number, cy: number, color: string, label: string) => {
    const whisper = document.createElement("span");
    whisper.className = "mushroom-whisper";
    whisper.textContent = label;
    whisper.style.left = `${cx}px`;
    whisper.style.top = `${cy - 12}px`;
    whisper.style.color = color;
    document.body.append(whisper);
    window.setTimeout(() => whisper.remove(), 20000);

    for (let i = 0; i < 12; i++) {
      const spore = document.createElement("span");
      spore.className = "mushroom-spore";
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.35;
      const dist = 28 + Math.random() * 52;
      spore.style.left = `${cx}px`;
      spore.style.top = `${cy}px`;
      spore.style.background = color;
      spore.style.color = color;
      spore.style.setProperty("--dx", `${Math.cos(a) * dist}px`);
      spore.style.setProperty("--dy", `${Math.sin(a) * dist}px`);
      document.body.append(spore);
      window.setTimeout(() => spore.remove(), 800);
    }
  };

  const isBlockedElement = (target: EventTarget | null) =>
    Boolean((target as Element | null)?.closest(".codex-sheet, a, button, input, aside"));

  const onMushroomHover = (e: PointerEvent) => {
    if (!isFinePointer || isBlockedElement(e.target)) {
      if (hoveredMushroomIdx !== -1) {
        hoveredMushroomIdx = -1;
        document.body.style.cursor = "";
      }
      return;
    }
    updateNdc(e.clientX, e.clientY);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(rayTargets, false);
    const nextIdx = hits.length ? (hits[0].object.userData.mushroomIndex as number) : -1;
    if (nextIdx !== hoveredMushroomIdx) {
      hoveredMushroomIdx = nextIdx;
      document.body.style.cursor = nextIdx !== -1 ? "pointer" : "";
    }
  };

  const onMushroomClick = (e: MouseEvent) => {
    if (isBlockedElement(e.target)) return;
    updateNdc(e.clientX, e.clientY);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(rayTargets, false);
    if (!hits.length) return;

    const idx = hits[0].object.userData.mushroomIndex as number;
    const m = mushrooms[idx];
    if (!m || m.popping) return;

    m.popping = true;
    const label = document.documentElement.lang === "ru" ? m.labelRu : m.label;
    spawnDomBurst(e.clientX, e.clientY, m.colorHex, label);

    if (m.effect === "aurora") onShuffle();
    else if (m.effect === "ripple") triggerPulse();
    else if (m.effect === "surge") starSurge = 1.0;
  };

  window.addEventListener("pointermove", onMushroomHover, { passive: true });
  document.addEventListener("click", onMushroomClick);

  const targetPointer = new THREE.Vector2();
  let warpTarget = 0;
  let overrideWarp: number | null = null;
  let paused = false;
  let rafId = 0;
  let last = performance.now();
  let fpsFrames = 0;
  let fpsLast = performance.now();

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    tunnelUniforms.uResolution.value.set(width, height);
    starUniforms.uPixelRatio.value = pr;
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };

  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onPointerMove = (e: PointerEvent) => {
    if (!isFinePointer) return;
    targetPointer.set(
      (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2,
      -(e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2,
    );
  };

  const onWarp = () => {
    overrideWarp = null;
    warpTarget = 1;
  };

  const onPageLoad = () => {
    overrideWarp = null;
    warpTarget = 0;
  };

  const onThemeSync = () => {
    const palette = isDarkTheme() ? DARK_PALETTES[darkIndex] : LIGHT_PALETTES[lightIndex];
    applyTargetPalette(palette);
    publishPalette(palette)
    devHud?.syncFromTargets();
  };

  const onShuffle = () => {
    if (isDarkTheme()) {
      darkIndex = (darkIndex + 1) % DARK_PALETTES.length;
      applyTargetPalette(DARK_PALETTES[darkIndex]);
      publishPalette(DARK_PALETTES[darkIndex])
    } else {
      lightIndex = (lightIndex + 1) % LIGHT_PALETTES.length;
      applyTargetPalette(LIGHT_PALETTES[lightIndex]);
      publishPalette(LIGHT_PALETTES[lightIndex])
    }
    devHud?.syncFromTargets();
  };

  const animate = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!paused && !reducedMotion) {
      starSurge = Math.max(0, starSurge - dt * 0.9);
      const speed = 42 + tunnelUniforms.uWarp.value * 950 + starSurge * 280;
      const pos = starGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < starCount; i++) {
        let z = pos.getZ(i) + speed * dt;
        if (z > 100) z = -1400;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;

      const tSec = tunnelUniforms.uTime.value;
      mushrooms.forEach((m, i) => {
        const hoverTarget = i === hoveredMushroomIdx ? 1 : 0;
        const curHover = m.capMat.uniforms.uHover.value as number;
        const nextHover = curHover + (hoverTarget - curHover) * Math.min(1, dt * 8);
        m.capMat.uniforms.uHover.value = nextHover;
        m.stemMat.uniforms.uHover.value = nextHover;

        m.group.position.z += speed * 0.82 * m.speedMul * dt;
        m.group.position.x += Math.sin(tSec * 0.7 + m.phase) * 14 * dt;
        m.group.position.y += Math.cos(tSec * 0.85 + m.phase) * 12 * dt;

        m.group.rotation.x += m.rotSpeed.x * dt;
        m.group.rotation.y += m.rotSpeed.y * dt;
        m.group.rotation.z += m.rotSpeed.z * dt;

        m.group.scale.setScalar(m.baseScale * m.popScale);

        if (m.popping) {
          m.popScale -= dt * 3.8;
          m.group.rotation.y += dt * 14;
          if (m.popScale <= 0.02) {
            m.popping = false;
            m.popScale = 0.05;
            placeMushroomAtSpawn(m.group, -1300);
          }
        } else {
          m.popScale += (1 - m.popScale) * Math.min(1, dt * 4);
        }
        m.group.scale.setScalar(m.popScale);

        if (m.group.position.z > 95) {
          placeMushroomAtSpawn(m.group, -1350);
          m.popScale = 0.2;
        }
      });
      tunnelUniforms.uTime.value += dt;
    }

    // Smooth color transitions for theme toggle and shuffle
    const colorRate = Math.min(1, dt * 2.4);
    tunnelUniforms.uColorDeep.value.lerp(targetColors.deep, colorRate);
    tunnelUniforms.uColorFog.value.lerp(targetColors.fog, colorRate);
    tunnelUniforms.uColorBase.value.lerp(targetColors.base, colorRate);
    tunnelUniforms.uColorWarp.value.lerp(targetColors.warp, colorRate);
    tunnelUniforms.uColorAccent.value.lerp(targetColors.accent, colorRate);

    const activeWarp = overrideWarp ?? warpTarget;
    tunnelUniforms.uWarp.value += (activeWarp - tunnelUniforms.uWarp.value) * Math.min(1, dt * 5);
    tunnelUniforms.uPointer.value.lerp(targetPointer, Math.min(1, dt * 4)); 

    camera.position.x = tunnelUniforms.uPointer.value.x * 16;
    camera.position.y = tunnelUniforms.uPointer.value.y * 10;
    camera.lookAt(0, 0, -400);

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(bgScene, bgCamera);
    renderer.render(scene, camera);

    if (!reducedMotion) {
      rafId = requestAnimationFrame(animate);
    }

    if (devHud) {
      fpsFrames += 1;
      if (now - fpsLast >= 500) {
        devHud.updateFps(Math.round((fpsFrames * 1000) / (now - fpsLast)));
        fpsFrames = 0;
        fpsLast = now;
      }
    }
  };

  // DEV SHADER TUNER (stripped completely in `npm run build`)
  let devHud: {
  dispose: () => void;
  syncFromTargets: () => void;
  updateFps: (fps: number) => void;
  } | null = null;
  if (import.meta.env.DEV) {
     devHud = createDevHud(tunnelUniforms, targetColors, {
       onWarpChange: (v) => { overrideWarp = v; },
       onPauseToggle: (isPaused) => { paused = isPaused; },
       onStarsToggle: (visible) => { stars.visible = visible; },
       onShuffle,
       onReset: () => {
         tunnelUniforms.uSpeed.value = 0.42;
         tunnelUniforms.uSwirl.value = 1.0;
         tunnelUniforms.uDensity.value = 0.7;
         tunnelUniforms.uSplit.value = 0.0;
         overrideWarp = null;
         onThemeSync();
       },
     });
    
    if (import.meta.hot) {
      import.meta.hot.accept(
        [
          "./wormhole.vert?raw",
          "./wormhole.frag?raw",
          "./stars.vert?raw",
          "./stars.frag?raw",
          "./mushroom.vert?raw",
          "./mushroom.frag?raw",
        ],
        ([wVert, wFrag, sVert, sFrag, mVert, mFrag]) => {
          if (wVert) quadMat.vertexShader = wVert.default;
          if (wFrag) quadMat.fragmentShader = wFrag.default;
          if (wVert || wFrag) quadMat.needsUpdate = true;

          if (sVert) starMat.vertexShader = sVert.default;
          if (sFrag) starMat.fragmentShader = sFrag.default;
          if (sVert || sFrag) starMat.needsUpdate = true;

          if (mVert || mFrag) {
            for (const m of mushrooms) {
              if (mVert) {
                m.capMat.vertexShader = mVert.default;
                m.stemMat.vertexShader = mVert.default;
              }
              if (mFrag) {
                m.capMat.fragmentShader = mFrag.default;
                m.stemMat.fragmentShader = mFrag.default;
              }
              m.capMat.needsUpdate = true;
              m.stemMat.needsUpdate = true;
            }
          }
        },
      );
    }
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("shlongeeland:warp", onWarp);
  window.addEventListener("shlongeeland:pulse", triggerPulse);
  window.addEventListener("shlongeeland:theme", onThemeSync);
  window.addEventListener("shlongeeland:shuffle", onShuffle);
  document.addEventListener("astro:page-load", onPageLoad);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      last = performance.now();
      if (!rafId && !reducedMotion) rafId = requestAnimationFrame(animate);
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });

  if (reducedMotion) {
    requestAnimationFrame(animate);
  } else {
    rafId = requestAnimationFrame(animate);
  }
}

const css = String.raw;

function createDevHud(
  uniforms: {
    uSpeed: { value: number };
    uSwirl: { value: number };
    uDensity: { value: number };
    uSplit: { value: number };
    uColorDeep: { value: THREE.Color };
    uColorFog: { value: THREE.Color };
    uColorBase: { value: THREE.Color };
    uColorWarp: { value: THREE.Color };
    uColorAccent: { value: THREE.Color };
  },
  targetColors: {
    deep: THREE.Color;
    fog: THREE.Color;
    base: THREE.Color;
    warp: THREE.Color;
    accent: THREE.Color;
  },
  callbacks: {
    onWarpChange: (value: number | null) => void;
    onPauseToggle: (paused: boolean) => void;
    onStarsToggle: (visible: boolean) => void;
    onShuffle: () => void;
    onReset: () => void;
  },
) {
  const STORAGE_KEY = "shlongeeland-devhud-state";
  const controller = new AbortController();
  const { signal } = controller;

  type HudState = { x: number; y: number; collapsed: boolean };
  const loadState = (): HudState => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { x: 12, y: 12, collapsed: false };
      const parsed = JSON.parse(raw) as Partial<HudState>;
      return {
        x: typeof parsed.x === "number" ? parsed.x : 12,
        y: typeof parsed.y === "number" ? parsed.y : 12,
        collapsed: Boolean(parsed.collapsed),
      };
    } catch {
      return { x: 12, y: 12, collapsed: false };
    }
  };

  const state = loadState();
  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  };

  const panel = document.createElement("aside");
  panel.style.cssText = css`
    position: fixed;
    top: ${state.y}px;
    left: ${state.x}px;
    z-index: 9999;
    width: 272px;
    border-radius: 10px;
    background: rgba(10, 12, 20, 0.9);
    color: #eee;
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(10px);
    font: 12px/1.4 monospace;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  `;

  // --- Draggable Header + FPS Badge ---
  const header = document.createElement("div");
  header.style.cssText = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    cursor: grab;
    user-select: none;
    touch-action: none;
    background: rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  `;

  const titleWrap = document.createElement("div");
  titleWrap.style.cssText = css`
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const title = document.createElement("span");
  title.textContent = "Shader HUD";
  title.style.cssText = css`
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #9effcf;
  `;

  const fpsBadge = document.createElement("span");
  fpsBadge.textContent = "-- fps";
  fpsBadge.style.cssText = css`
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: #9be7ff;
  `;

  titleWrap.append(title, fpsBadge);

  const minimizeBtn = document.createElement("button");
  minimizeBtn.type = "button";
  minimizeBtn.setAttribute("aria-label", "Toggle shader HUD");
  minimizeBtn.style.cssText = css`
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.08);
    color: #eee;
    font: 700 14px/1 monospace;
    cursor: pointer;
  `;

  header.append(titleWrap, minimizeBtn);

  // --- Collapsible Body ---
  const body = document.createElement("div");
  body.style.cssText = css`
    padding: 10px 12px 12px;
    display: grid;
    gap: 8px;
  `;

  const applyCollapsed = (collapsed: boolean) => {
    state.collapsed = collapsed;
    body.style.display = collapsed ? "none" : "grid";
    header.style.borderBottom = collapsed
      ? "none"
      : "1px solid rgba(255, 255, 255, 0.12)";
    minimizeBtn.textContent = collapsed ? "+" : "−";
    minimizeBtn.setAttribute("aria-expanded", String(!collapsed));
  };

  const clampPosition = () => {
    const margin = 8;
    const rect = panel.getBoundingClientRect();
    const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
    state.x = Math.min(Math.max(margin, state.x), maxX);
    state.y = Math.min(Math.max(margin, state.y), maxY);
    panel.style.left = `${state.x}px`;
    panel.style.top = `${state.y}px`;
  };

  minimizeBtn.addEventListener(
    "click",
    () => {
      applyCollapsed(!state.collapsed);
      clampPosition();
      saveState();
    },
    { signal },
  );

  let dragStart: { pointerX: number; pointerY: number; originX: number; originY: number } | null = null;
  header.addEventListener(
    "pointerdown",
    (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest("button")) return;
      if (e.button !== 0) return;
      e.stopPropagation();
      header.setPointerCapture(e.pointerId);
      header.style.cursor = "grabbing";
      dragStart = { pointerX: e.clientX, pointerY: e.clientY, originX: state.x, originY: state.y };
    },
    { signal },
  );
  header.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      if (!dragStart) return;
      e.stopPropagation();
      state.x = dragStart.originX + (e.clientX - dragStart.pointerX);
      state.y = dragStart.originY + (e.clientY - dragStart.pointerY);
      clampPosition();
    },
    { signal },
  );
  const endDrag = (e: PointerEvent) => {
    if (!dragStart) return;
    dragStart = null;
    header.style.cursor = "grab";
    if (header.hasPointerCapture(e.pointerId)) header.releasePointerCapture(e.pointerId);
    saveState();
  };
  header.addEventListener("pointerup", endDrag, { signal });
  header.addEventListener("pointercancel", endDrag, { signal });
  window.addEventListener(
    "resize",
    () => {
      clampPosition();
      saveState();
    },
    { passive: true, signal },
  );

  // --- Sliders (tracked so Reset updates them cleanly) ---
  const sliderSyncs: Array<() => void> = [];
  const makeSlider = (
    label: string,
    min: number,
    max: number,
    step: number,
    getVal: () => number,
    onInput: (v: number) => void,
  ) => {
    const row = document.createElement("label");
    row.style.cssText = css`
      display: grid;
      gap: 2px;
    `;
    const readout = document.createElement("span");
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);

    const sync = () => {
      const v = getVal();
      input.value = String(v);
      readout.textContent = `${label}: ${v.toFixed(2)}`;
    };
    sliderSyncs.push(sync);
    sync();

    input.addEventListener(
      "input",
      () => {
        const v = parseFloat(input.value);
        readout.textContent = `${label}: ${v.toFixed(2)}`;
        onInput(v);
      },
      { signal },
    );
    row.append(readout, input);
    return row;
  };

  // --- Color Pickers (update both targetColors & uniform immediately!) ---
  const colorSyncs: Array<() => void> = [];
  const makeColor = (
    label: string,
    target: THREE.Color,
    uniform: THREE.Color,
  ) => {
    const row = document.createElement("label");
    row.style.cssText = css`
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    const input = document.createElement("input");
    input.type = "color";
    input.style.cssText = css`
      width: 44px;
      height: 22px;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    `;

    const sync = () => {
      input.value = `#${target.getHexString()}`;
    };
    colorSyncs.push(sync);
    sync();

    input.addEventListener(
      "input",
      () => {
        target.set(input.value);
        uniform.set(input.value);
      },
      { signal },
    );
    row.append(label, input);
    return row;
  };

  const makeBtn = (text: string, onClick: () => void) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.style.cssText = css`
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: #eee;
      font: 11px/1.2 monospace;
      cursor: pointer;
    `;
    b.addEventListener("click", onClick, { signal });
    return b;
  };

  // --- Warp Row (Slider + Auto Release) ---
  let warpOverride = 0;
  let warpLocked = false;
  const warpRow = makeSlider(
    "Warp",
    0,
    1,
    0.01,
    () => warpOverride,
    (v) => {
      warpOverride = v;
      warpLocked = true;
      callbacks.onWarpChange(v);
    },
  );

  // --- Action Buttons ---
  let paused = false;
  let starsVisible = true;
  let uiHidden = false;

  const setPageUiHidden = (hidden: boolean) => {
    document
      .querySelectorAll<HTMLElement>(
        ".title-particles, .wormhole-home__nav, .home-arcane-dock, .codex-shell",
      )
      .forEach((el) => {
        el.style.visibility = hidden ? "hidden" : "visible";
      });
  };

  const pauseBtn = makeBtn("Pause", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    callbacks.onPauseToggle(paused);
  });

  const starsBtn = makeBtn("Stars: On", () => {
    starsVisible = !starsVisible;
    starsBtn.textContent = starsVisible ? "Stars: On" : "Stars: Off";
    callbacks.onStarsToggle(starsVisible);
  });

  const hideUiBtn = makeBtn("Hide UI", () => {
    uiHidden = !uiHidden;
    hideUiBtn.textContent = uiHidden ? "Show UI" : "Hide UI";
    setPageUiHidden(uiHidden);
  });

  const shuffleBtn = makeBtn("Shuffle", () => {
    callbacks.onShuffle();
  });

  const warpAutoBtn = makeBtn("Warp: Auto", () => {
    if (warpLocked) {
      warpLocked = false;
      warpOverride = 0;
      callbacks.onWarpChange(null);
      sliderSyncs.forEach((s) => s());
    } else {
      warpLocked = true;
      warpOverride = 1;
      callbacks.onWarpChange(1);
      sliderSyncs.forEach((s) => s());
    }
    warpAutoBtn.textContent = warpLocked ? "Release Warp" : "Test Warp";
  });
  warpAutoBtn.textContent = "Test Warp";

  const resetBtn = makeBtn("Reset", () => {
    warpLocked = false;
    warpOverride = 0;
    warpAutoBtn.textContent = "Test Warp";
    callbacks.onReset();
    sliderSyncs.forEach((s) => s());
    colorSyncs.forEach((s) => s());
  });

  const copyBtn = makeBtn("Copy Palette", async () => {
    const hex = (c: THREE.Color) => `#${c.getHexString()}`;
    const paletteLine = `{ deep: "${hex(targetColors.deep)}", fog: "${hex(targetColors.fog)}", base: "${hex(targetColors.base)}", warp: "${hex(targetColors.warp)}", accent: "${hex(targetColors.accent)}" }`;
    const uniformsBlock = `uSpeed: ${uniforms.uSpeed.value}, uSwirl: ${uniforms.uSwirl.value}, uDensity: ${uniforms.uDensity.value}`;
    await navigator.clipboard.writeText(`${paletteLine}\n// ${uniformsBlock}`);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy Palette";
    }, 1200);
  });

  const btnGrid = document.createElement("div");
  btnGrid.style.cssText = css`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 2px;
  `;
  btnGrid.append(pauseBtn, starsBtn, hideUiBtn, shuffleBtn, warpAutoBtn, resetBtn, copyBtn);

  body.append(
    warpRow,
    makeSlider("Speed", 0, 2, 0.05, () => uniforms.uSpeed.value, (v) => {
      uniforms.uSpeed.value = v;
    }),
    makeSlider("Swirl", -3, 3, 0.05, () => uniforms.uSwirl.value, (v) => {
      uniforms.uSwirl.value = v;
    }),
    makeSlider("Density", 0.4, 1.8, 0.02, () => uniforms.uDensity.value, (v) => {
      uniforms.uDensity.value = v;
    }),
    makeSlider("A/B Split", 0, 1, 0.01, () => uniforms.uSplit.value, (v) => {
      uniforms.uSplit.value = v;
    }),
    makeColor("Deep Sky", targetColors.deep, uniforms.uColorDeep.value),
    makeColor("Mist Fog", targetColors.fog, uniforms.uColorFog.value),
    makeColor("Base", targetColors.base, uniforms.uColorBase.value),
    makeColor("Warp", targetColors.warp, uniforms.uColorWarp.value),
    makeColor("Accent", targetColors.accent, uniforms.uColorAccent.value),
    btnGrid,
  );

  panel.append(header, body);
  document.body.append(panel);

  applyCollapsed(state.collapsed);
  clampPosition();

  return {
    syncFromTargets: () => {
      colorSyncs.forEach((s) => s());
    },
    updateFps: (fps: number) => {
      fpsBadge.textContent = `${fps} fps`;
    },
    dispose: () => {
      if (uiHidden) setPageUiHidden(false);
      controller.abort();
      panel.remove();
    },
  };
}