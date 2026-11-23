precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute float pindex;
attribute vec2 offset;
attribute float angle;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;

varying vec2 vPUv;
varying vec2 vUv;
varying float vShimmer;

float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vUv = uv;
  vec2 puv = offset / uTextureSize;
  vPUv = puv;

  vec4 color = texture2D(uTexture, puv);
  float grey = color.r * 0.33 + color.g * 0.33 + color.b * 0.33;
  
  vec3 displaced = vec3(offset, 0.0);
  float r1 = hash1(pindex);
  float r2 = hash1(offset.x + pindex * 1.37);

  displaced.xy += vec2(r1 - 0.5, r2 - 0.5) * uRandom;

  float wave = sin(pindex * 0.37 + uTime * 1.4) * 0.5 + 0.5;
  float rndz = r1 + wave * 0.65;
  displaced.z += rndz * (r1 * 2.0 * uDepth);

  float touch = texture2D(uTouch, puv).r;
  displaced.x += cos(angle) * touch * 22.0 * rndz;
  displaced.y += sin(angle) * touch * 22.0 * rndz;
  displaced.z += touch * 22.0 * rndz;

  vShimmer = 0.78 + 0.22 * sin(uTime * 2.2 + pindex * 0.73);
  float particleSize = (1.0 + wave * 0.65) * max(grey, 0.75) * uSize;
  displaced.xy += position.xy * particleSize;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}