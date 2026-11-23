precision highp float;

uniform float uTime;
uniform float uWarp;
uniform float uSpeed;
uniform float uSwirl;
uniform float uDensity;
uniform float uSplit;
uniform vec2 uPointer;
uniform vec2 uResolution;

uniform vec3 uColorDeep;
uniform vec3 uColorFog;
uniform vec3 uColorBase;
uniform vec3 uColorWarp;
uniform vec3 uColorAccent;

varying vec2 vUv;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash3(i + vec3(0.0, 0.0, 0.0)), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm3(vec3 p, float detailWeight) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= 2 && detailWeight <= 0.01) break;
    float weight = (i >= 2) ? detailWeight : 1.0;
    value += amp * weight * noise3(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return value;
}

vec2 rotate2D(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

vec3 renderWormhole(vec2 uv, float swirlStrength) {
  // 1. Comfy drifting ambient sky layer behind the wormhole
  vec2 ambUv = uv * 0.55 + vec2(uTime * 0.032, -uTime * 0.022);
  float ambA = fbm3(vec3(ambUv, uTime * 0.045), 0.75);
  float ambB = fbm3(vec3(ambUv * 1.65 - 2.3, -uTime * 0.035), 0.65);
  vec3 ambientSky = mix(uColorDeep * 1.15 + uColorFog * 0.2, uColorFog * 0.78, ambA * 0.85);
  ambientSky += mix(uColorBase, uColorWarp, ambB) * smoothstep(0.4, 0.88, ambA * ambB) * 0.24;

  // 2. Gentle corkscrew wobble so the tunnel moves like a coiled spring
  float rawDist = max(length(uv), 0.0005);
  float radialBase = 1.25 / rawDist;
  vec2 springWobble = vec2(
    cos(radialBase * 0.85 - uTime * 0.5),
    sin(radialBase * 0.85 - uTime * 0.5)
  ) * 0.085 * smoothstep(0.05, 0.75, rawDist);

  vec2 p = uv + springWobble;
  float dist = max(length(p), 0.0005);
  float outerMask = smoothstep(2.7, 0.3, dist);
  if (outerMask < 0.002) {
    return ambientSky;
  }

  vec2 dir = p / dist;
  vec2 swirled = rotate2D(dir, swirlStrength / (dist + 0.34));

  float travel = uTime * uSpeed + uWarp * 2.2;
  float radial = 1.25 / dist + travel;
  float detailFade = smoothstep(0.06, 0.65, dist);

  // 3. Seamless helical spring-arm modulation (breaks uniform ring symmetry)
  float coilAngle = radial * 1.7 - travel * 0.95;
  vec2 coilVec = vec2(cos(coilAngle), sin(coilAngle));
  float springArm = 0.5 + 0.5 * dot(swirled, coilVec);
  float springMask = smoothstep(0.16, 0.9, springArm);

  float n1 = fbm3(vec3(swirled * 1.45, radial * 0.42 - travel * 0.2), detailFade);
  float n2 = fbm3(vec3(swirled * 2.8 + n1 * 0.85, radial * 0.78 - travel * 0.45), detailFade * 0.9);

  // Organic pockets + coiled spring ribbon
  float clump = smoothstep(0.24, 0.78, n1 * 0.7 + springMask * 0.45);
  float ribbon = 1.0 - abs(n2 * 2.0 - 1.0);
  ribbon = pow(clamp(ribbon, 0.0, 1.0), 2.35) * uDensity * (0.45 + 0.85 * clump);

  float rays = fbm3(vec3(swirled * 6.2, radial * 0.18 - travel * 0.12), detailFade);
  float curtain = ribbon * (0.55 + 0.78 * rays);

  // Smooth cyclic 3-color blend
  float bandShift = fract(n1 * 1.35 + radial * 0.06 + uWarp * 0.25);
  vec3 auroraHue = mix(uColorBase, uColorWarp, smoothstep(0.0, 0.33, bandShift));
  auroraHue = mix(auroraHue, uColorAccent, smoothstep(0.33, 0.66, bandShift));
  auroraHue = mix(auroraHue, uColorBase, smoothstep(0.66, 1.0, bandShift));

  vec3 secondaryHue = mix(uColorWarp, uColorAccent, smoothstep(0.2, 0.8, n2));
  vec3 col = mix(ambientSky, auroraHue, clamp(curtain * 0.95, 0.0, 1.0));
  col += secondaryHue * pow(clamp(curtain, 0.0, 1.5), 1.9) * (0.55 + uWarp * 0.75);

  // Mysterious polar distance fog
  float distanceFog = smoothstep(0.82, 0.04, dist);
  float deepMist = exp(-dist * 2.4);
  col = mix(col, uColorFog, clamp(distanceFog * 0.82 + deepMist * 0.3, 0.0, 0.96));

  float veil = smoothstep(0.58, 0.08, dist) * smoothstep(0.0, 0.26, dist);
  col += mix(uColorBase, uColorAccent, 0.45 + uWarp * 0.4) * veil * (0.16 + uWarp * 0.42);

  // Blend smoothly into the cozy ambient sky at the far outer edges
  return mix(ambientSky, col, outerMask);
}

void main() {
  float minDim = max(min(uResolution.x, uResolution.y), 1.0);
  vec2 uv = (vUv - 0.5) * 2.0 * (uResolution / minDim);
  uv -= uPointer * 0.08;

  vec3 col = (vUv.x < uSplit)
    ? renderWormhole(uv, 0.0)
    : renderWormhole(uv, uSwirl);

  if (uSplit > 0.01 && uSplit < 0.99 && abs(vUv.x - uSplit) < 0.002) {
    col = vec3(1.0, 0.85, 0.4);
  }

  gl_FragColor = vec4(col, 1.0);
}