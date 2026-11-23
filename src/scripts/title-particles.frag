precision highp float;

uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;

varying vec2 vUv;
varying float vShimmer;

void main() {
  float d = distance(vUv, vec2(0.5)) * 2.0;
  if (d > 1.0) discard;

  float core = exp(-d * d * 10.0);
  float halo = exp(-d * 1.0) * 2.0;
  float alpha = (core + halo) * smoothstep(1.0, 0.35, d) * vShimmer;
  if (alpha < 0.015) discard;

  vec3 themeTint = mix(uColorPrimary, uColorSecondary, 0.28 + 0.5 * (1.0 - vShimmer));
  vec3 tint = mix(themeTint, vec3(0.5), clamp(core * 0.9, 0.0, 1.0));
  gl_FragColor = vec4(tint * alpha, alpha);
}