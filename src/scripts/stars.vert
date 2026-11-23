precision highp float;

attribute vec3 position;
attribute vec3 color;
attribute float aSize;
attribute float aSeed;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uPixelRatio;
uniform float uTime;
uniform float uWarp;
uniform float uStarOffset;

varying vec3 vColor;
varying float vSeed;
varying float vDepth;
varying float vTwinkle;

void main() {
  vColor = color;
  vSeed = aSeed;

  vec3 pos = position;
  pos.z = mod(pos.z + uStarOffset + 1400.0, 1500.0) - 1400.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float depth = max(-mvPosition.z, 1.0);
  vDepth = depth;
  vTwinkle = 0.65 + 0.35 * sin(uTime * (1.5 + fract(aSeed * 7.3) * 3.0) + aSeed * 6.2831);

  float size = aSize * (1.0 + uWarp * 1.15) * uPixelRatio * (440.0 / depth);
  gl_PointSize = clamp(size, 3.0, 54.0 * uPixelRatio);
  gl_Position = projectionMatrix * mvPosition;
}