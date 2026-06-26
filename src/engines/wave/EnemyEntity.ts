import * as BABYLON from '@babylonjs/core';
import type { EnemyDef } from '@/shared/data/EnemyData';

// ── Enemy Shaders ─────────────────────────────────────────────────────────

const _ASTEROID_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _ASTEROID_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;
uniform float uSeed;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    float f = fbm(n * 6.0 + uSeed);
    vec3 rockColor = mix(vec3(0.50, 0.38, 0.25), vec3(0.65, 0.55, 0.40), f);
    float crater = smoothstep(0.38, 0.42, f);
    rockColor *= mix(0.6, 1.0, crater);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    float limb = mix(0.4, 1.0, NdotV);
    vec3 emissive = vec3(0.18, 0.12, 0.06);
    gl_FragColor = vec4(rockColor * limb + emissive, 1.0);
}
`;

const _COMET_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _COMET_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
void main() {
    vec3 n = normalize(vLocalPos);
    float f = noise(n * 4.0 + uTime * 0.3);
    vec3 iceColor = mix(vec3(0.3, 0.7, 0.95), vec3(0.6, 0.92, 1.0), f);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.5);
    vec3 rimColor = vec3(0.5, 0.85, 1.0) * fresnel * 0.8;
    float pulse = 0.9 + 0.1 * sin(uTime * 3.0);
    vec3 emissive = vec3(0.15, 0.4, 0.6) * pulse;
    float limb = mix(0.5, 1.0, NdotV);
    gl_FragColor = vec4(iceColor * limb + rimColor + emissive, 1.0);
}
`;

const _ROGUE_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _ROGUE_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;
uniform float uSeed;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    float f = fbm(n * 5.0 + uSeed);
    vec3 darkRock = mix(vec3(0.08, 0.05, 0.03), vec3(0.18, 0.12, 0.08), f * 0.5);
    float lavaF = fbm(n * 7.0 + vec3(uSeed * 1.3, uTime * 0.05, uSeed * 0.7));
    float crack = 1.0 - smoothstep(0.0, 0.04, abs(fract(lavaF * 4.0) - 0.5) * 2.0);
    float lavaMask = max(0.0, crack - 0.5) / 0.5;
    vec3 lavaColor = vec3(1.0, 0.3, 0.05) * lavaMask * 0.9;
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    float limb = mix(0.3, 1.0, NdotV);
    float fresnel = pow(1.0 - NdotV, 3.0);
    vec3 rimCol = vec3(0.5, 0.1, 0.02) * fresnel * 0.4;
    vec3 emissive = vec3(0.08, 0.04, 0.02);
    gl_FragColor = vec4(darkRock * limb + lavaColor + rimCol + emissive, 1.0);
}
`;

const _GRB_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _GRB_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);

    float energyPulse = 0.6 + 0.4 * sin(uTime * 5.0);
    float fastPulse = 0.8 + 0.2 * sin(uTime * 12.0);

    float f1 = fbm(n * 4.0 + uTime * 0.8);
    float f2 = fbm(n * 8.0 - uTime * 0.5 + vec3(5.0));
    float energyLines = smoothstep(0.4, 0.5, f1) * 0.7 + smoothstep(0.45, 0.55, f2) * 0.3;

    vec3 coreColor = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 1.0, 1.0), energyPulse * 0.5);
    vec3 jetColor = vec3(0.2, 0.95, 1.0);

    float jetAxis = abs(n.y);
    float jetMask = smoothstep(0.3, 0.8, jetAxis) * fastPulse;
    float jetNoise = fbm(n * 6.0 + vec3(0.0, uTime * 2.0, 0.0));
    jetMask *= (0.6 + 0.4 * jetNoise);

    float fresnel = pow(1.0 - NdotV, 2.5);
    vec3 rimGlow = vec3(0.3, 0.9, 1.0) * fresnel * 1.2 * energyPulse;

    float limb = mix(0.5, 1.0, NdotV);
    vec3 base = coreColor * limb * fastPulse;
    vec3 energy = jetColor * energyLines * 0.8;
    vec3 jets = vec3(0.5, 1.0, 1.0) * jetMask * 1.5;
    vec3 emissive = vec3(0.1, 0.5, 0.6) * energyPulse;

    gl_FragColor = vec4(base + energy + jets + rimGlow + emissive, 1.0);
}
`;

const _DARK_MATTER_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _DARK_MATTER_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    float distort = fbm(n * 5.0 + uTime * 0.4);
    vec3 warpedN = normalize(n + vec3(distort * 0.3, distort * 0.2, distort * 0.3));
    float f2 = fbm(warpedN * 8.0 - uTime * 0.3);
    vec3 darkColor = mix(vec3(0.05, 0.02, 0.12), vec3(0.15, 0.05, 0.25), f2);
    float fresnel = pow(1.0 - NdotV, 3.0);
    vec3 rimGlow = vec3(0.3, 0.1, 0.6) * fresnel * 0.8;
    float shimmer = 0.4 + 0.2 * sin(uTime * 3.0 + distort * 6.0);
    float limb = mix(0.3, 1.0, NdotV);
    vec3 emissive = vec3(0.08, 0.03, 0.15) * (0.8 + 0.2 * sin(uTime * 2.0));
    gl_FragColor = vec4(darkColor * limb + rimGlow + emissive, shimmer);
}
`;

const _ANTIMATTER_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _ANTIMATTER_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    float pulse1 = 0.6 + 0.4 * sin(uTime * 4.0);
    float pulse2 = 0.7 + 0.3 * sin(uTime * 7.0 + 1.5);
    float f1 = fbm(n * 6.0 + uTime * 1.2);
    float f2 = fbm(n * 10.0 - uTime * 0.8 + vec3(7.0, 3.0, 5.0));
    float f3 = fbm(n * 4.0 + vec3(uTime * 0.6, -uTime * 0.9, uTime * 0.3));
    float swirl = smoothstep(0.35, 0.55, f1) * 0.6 + smoothstep(0.4, 0.6, f2) * 0.4;
    vec3 purple = vec3(0.6, 0.1, 0.8);
    vec3 magenta = vec3(0.9, 0.2, 0.5);
    vec3 dark = vec3(0.1, 0.0, 0.15);
    vec3 stormColor = mix(dark, mix(purple, magenta, f3), swirl * pulse1);
    float fresnel = pow(1.0 - NdotV, 2.5);
    vec3 rimGlow = vec3(0.7, 0.2, 0.9) * fresnel * 1.0 * pulse2;
    float energyLines = smoothstep(0.45, 0.55, fbm(n * 12.0 + uTime * 2.0)) * 0.5;
    vec3 energy = vec3(1.0, 0.4, 1.0) * energyLines;
    float limb = mix(0.4, 1.0, NdotV);
    vec3 emissive = vec3(0.2, 0.05, 0.3) * pulse1;
    gl_FragColor = vec4(stormColor * limb + rimGlow + energy + emissive, 1.0);
}
`;

const _QUASAR_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _QUASAR_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);

    float pulse = 0.7 + 0.3 * sin(uTime * 6.0);
    float fastPulse = 0.8 + 0.2 * sin(uTime * 15.0);

    // Bright white-blue core
    float coreGlow = pow(NdotV, 3.0);
    vec3 coreColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 1.0, 1.0), coreGlow) * (1.5 + 0.5 * pulse);

    // Orange accretion disk at equator
    float equator = 1.0 - abs(n.y);
    float diskMask = smoothstep(0.3, 0.8, equator);
    float diskNoise = fbm(n * 8.0 + vec3(uTime * 1.5, 0.0, uTime * 0.8));
    vec3 diskColor = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.8, 0.3), diskNoise) * diskMask * 1.2;

    // Jet beams along Y axis
    float jetAxis = abs(n.y);
    float jetMask = smoothstep(0.6, 0.95, jetAxis) * fastPulse;
    float jetNoise = fbm(n * 6.0 + vec3(0.0, uTime * 3.0, 0.0));
    jetMask *= (0.5 + 0.5 * jetNoise);
    vec3 jetColor = vec3(0.6, 0.8, 1.0) * jetMask * 2.0;

    float fresnel = pow(1.0 - NdotV, 2.0);
    vec3 rimGlow = vec3(1.0, 0.7, 0.3) * fresnel * 0.8 * pulse;

    float limb = mix(0.6, 1.0, NdotV);
    vec3 emissive = vec3(0.3, 0.2, 0.1) * pulse;

    gl_FragColor = vec4(coreColor * limb + diskColor + jetColor + rimGlow + emissive, 1.0);
}
`;

const _ENTROPY_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vLocalPos   = position;
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _ENTROPY_FRAG = /* glsl */`
precision highp float;
varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform float uTime;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.3))) * 43758.5453123); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
            mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
            mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec3(3.7, 6.8, 1.3); a *= 0.5; }
    return v;
}
void main() {
    vec3 n = normalize(vLocalPos);
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);

    float darkPulse = 0.5 + 0.5 * sin(uTime * 1.5);
    float chaosPulse = 0.6 + 0.4 * sin(uTime * 4.0 + 2.0);

    // Dark void core — inverse glow: darker at center
    float inverseLimb = mix(1.0, 0.05, NdotV);

    // Chaotic energy absorption at edges
    float f1 = fbm(n * 5.0 + uTime * 0.6);
    float f2 = fbm(n * 8.0 - uTime * 0.4 + vec3(5.0, 3.0, 7.0));
    float f3 = fbm(n * 12.0 + vec3(uTime * 0.8, -uTime * 0.5, uTime * 0.3));

    // Multicolored chaotic absorption
    float edgeMask = pow(1.0 - NdotV, 2.0);
    vec3 chaos1 = vec3(0.8, 0.1, 0.2) * smoothstep(0.4, 0.6, f1);
    vec3 chaos2 = vec3(0.1, 0.3, 0.9) * smoothstep(0.35, 0.55, f2);
    vec3 chaos3 = vec3(0.9, 0.6, 0.1) * smoothstep(0.45, 0.65, f3);
    vec3 chaosColor = (chaos1 + chaos2 + chaos3) * edgeMask * chaosPulse;

    // Pulsing dark energy waves
    float wavePattern = sin(n.x * 10.0 + uTime * 2.0) * sin(n.y * 10.0 - uTime * 1.5) * sin(n.z * 10.0 + uTime);
    float darkWave = smoothstep(0.3, 0.8, wavePattern * 0.5 + 0.5) * edgeMask * 0.3;

    // Bright distorted rim
    float fresnel = pow(1.0 - NdotV, 3.5);
    vec3 rimGlow = mix(vec3(0.9, 0.3, 0.1), vec3(0.3, 0.1, 0.9), sin(uTime * 2.0 + f1 * 6.0) * 0.5 + 0.5) * fresnel * 1.5;

    // Black core
    vec3 coreColor = vec3(0.02, 0.01, 0.03) * inverseLimb;

    vec3 emissive = vec3(0.05, 0.02, 0.08) * darkPulse;

    gl_FragColor = vec4(coreColor + chaosColor + rimGlow + darkWave * vec3(0.5, 0.2, 0.8) + emissive, 1.0);
}
`;

// ── Register enemy shaders ──
if (!BABYLON.Effect.ShadersStore['asteroidVertexShader']) {
  BABYLON.Effect.ShadersStore['asteroidVertexShader']   = _ASTEROID_VERT;
  BABYLON.Effect.ShadersStore['asteroidFragmentShader'] = _ASTEROID_FRAG;
  BABYLON.Effect.ShadersStore['cometVertexShader']      = _COMET_VERT;
  BABYLON.Effect.ShadersStore['cometFragmentShader']    = _COMET_FRAG;
  BABYLON.Effect.ShadersStore['rogueVertexShader']      = _ROGUE_VERT;
  BABYLON.Effect.ShadersStore['rogueFragmentShader']    = _ROGUE_FRAG;
  BABYLON.Effect.ShadersStore['grbVertexShader']        = _GRB_VERT;
  BABYLON.Effect.ShadersStore['grbFragmentShader']      = _GRB_FRAG;
  BABYLON.Effect.ShadersStore['darkMatterVertexShader']   = _DARK_MATTER_VERT;
  BABYLON.Effect.ShadersStore['darkMatterFragmentShader'] = _DARK_MATTER_FRAG;
  BABYLON.Effect.ShadersStore['antimatterVertexShader']   = _ANTIMATTER_VERT;
  BABYLON.Effect.ShadersStore['antimatterFragmentShader'] = _ANTIMATTER_FRAG;
  BABYLON.Effect.ShadersStore['quasarVertexShader']       = _QUASAR_VERT;
  BABYLON.Effect.ShadersStore['quasarFragmentShader']     = _QUASAR_FRAG;
  BABYLON.Effect.ShadersStore['entropyVertexShader']      = _ENTROPY_VERT;
  BABYLON.Effect.ShadersStore['entropyFragmentShader']    = _ENTROPY_FRAG;
}

let _enemySeedCounter = 0;

export class EnemyEntity {
  readonly def: EnemyDef;
  hp: number;
  alive = true;
  mesh: BABYLON.Mesh;
  hasSplit = false;

  private waypoints: BABYLON.Vector3[];
  private waypointIndex = 0;
  private readonly speed: number;
  private prevPos: BABYLON.Vector3;
  private nextPos: BABYLON.Vector3;
  private hpBar: BABYLON.Mesh | null = null;
  private hpBarBg: BABYLON.Mesh | null = null;
  private readonly hpBarWidth = 0.6;
  private shaderMat: BABYLON.ShaderMaterial | null = null;
  private timeAccum = 0;
  private cometTail: BABYLON.Mesh | null = null;
  private cometTailMat: BABYLON.StandardMaterial | null = null;
  slowMultiplier = 1.0;
  slowTimer = 0;

  constructor(scene: BABYLON.Scene, def: EnemyDef, waypoints: BABYLON.Vector3[], startWaypoint = 0) {
    this.def = def;
    this.hp = def.hp;
    this.speed = def.speed;
    this.waypoints = waypoints;
    const seed = (_enemySeedCounter++) * 0.53;

    this.mesh = BABYLON.MeshBuilder.CreateSphere(`enemy_${def.id}_${Math.random().toString(36).slice(2, 6)}`, {
      diameter: def.radius * 2,
      segments: 16,
    }, scene);
    this.mesh.position.copyFrom(waypoints[startWaypoint] ?? waypoints[0]);
    this.mesh.position.y = 0.3;

    if (def.id === 'asteroid') {
      this.shaderMat = new BABYLON.ShaderMaterial(`asteroidMat_${this.mesh.name}`, scene,
        { vertex: 'asteroid', fragment: 'asteroid' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime', 'uSeed'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.shaderMat.setFloat('uSeed', seed);
      this.mesh.material = this.shaderMat;
    } else if (def.id === 'comet') {
      this.shaderMat = new BABYLON.ShaderMaterial(`cometMat_${this.mesh.name}`, scene,
        { vertex: 'comet', fragment: 'comet' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.mesh.material = this.shaderMat;
      this.cometTail = BABYLON.MeshBuilder.CreateCylinder(`cometTail_${this.mesh.name}`, {
        diameterTop: def.radius * 1.2,
        diameterBottom: 0.02,
        height: 1.2,
        tessellation: 8,
      }, scene);
      this.cometTail.parent = this.mesh;
      this.cometTail.position.y = 0;
      this.cometTail.rotation.x = Math.PI / 2;
      this.cometTail.position.z = 0.7;
      this.cometTailMat = new BABYLON.StandardMaterial(`cometTailMat_${this.mesh.name}`, scene);
      this.cometTailMat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.9);
      this.cometTailMat.emissiveColor = new BABYLON.Color3(0.15, 0.35, 0.55);
      this.cometTailMat.alpha = 0.35;
      this.cometTailMat.specularColor = BABYLON.Color3.Black();
      this.cometTailMat.disableLighting = true;
      this.cometTail.material = this.cometTailMat;
      this.cometTail.isPickable = false;
    } else if (def.id === 'rogue_planet') {
      this.shaderMat = new BABYLON.ShaderMaterial(`rogueMat_${this.mesh.name}`, scene,
        { vertex: 'rogue', fragment: 'rogue' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime', 'uSeed'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.shaderMat.setFloat('uSeed', seed);
      this.mesh.material = this.shaderMat;
    } else if (def.id === 'grb') {
      this.shaderMat = new BABYLON.ShaderMaterial(`grbMat_${this.mesh.name}`, scene,
        { vertex: 'grb', fragment: 'grb' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.mesh.material = this.shaderMat;
    } else if (def.id === 'dark_matter') {
      this.shaderMat = new BABYLON.ShaderMaterial(`darkMatterMat_${this.mesh.name}`, scene,
        { vertex: 'darkMatter', fragment: 'darkMatter' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.shaderMat.alpha = 0.4;
      this.shaderMat.backFaceCulling = false;
      this.mesh.material = this.shaderMat;
      this.mesh.hasVertexAlpha = true;
    } else if (def.id === 'quasar') {
      this.shaderMat = new BABYLON.ShaderMaterial(`quasarMat_${this.mesh.name}`, scene,
        { vertex: 'quasar', fragment: 'quasar' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.mesh.material = this.shaderMat;
    } else if (def.id === 'entropy') {
      this.shaderMat = new BABYLON.ShaderMaterial(`entropyMat_${this.mesh.name}`, scene,
        { vertex: 'entropy', fragment: 'entropy' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.mesh.material = this.shaderMat;
    } else if (def.id === 'antimatter_storm' || def.id === 'antimatter_storm_split') {
      this.shaderMat = new BABYLON.ShaderMaterial(`antimatterMat_${this.mesh.name}`, scene,
        { vertex: 'antimatter', fragment: 'antimatter' },
        { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uTime'] },
      );
      this.shaderMat.setFloat('uTime', 0);
      this.mesh.material = this.shaderMat;
    }
    this.mesh.isPickable = false;

    this.hpBarBg = BABYLON.MeshBuilder.CreatePlane(`hpBg_${this.mesh.name}`, {
      width: this.hpBarWidth,
      height: 0.08,
    }, scene);
    this.hpBarBg.rotation.x = Math.PI / 2;
    this.hpBarBg.position.y = 0.02;
    this.hpBarBg.parent = this.mesh;
    this.hpBarBg.position.z = -(def.radius + 0.12);
    const bgMat = new BABYLON.StandardMaterial(`hpBgMat_${this.mesh.name}`, scene);
    bgMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    bgMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    bgMat.specularColor = BABYLON.Color3.Black();
    this.hpBarBg.material = bgMat;
    this.hpBarBg.isPickable = false;

    this.hpBar = BABYLON.MeshBuilder.CreatePlane(`hpFg_${this.mesh.name}`, {
      width: this.hpBarWidth,
      height: 0.06,
    }, scene);
    this.hpBar.rotation.x = Math.PI / 2;
    this.hpBar.position.y = 0.025;
    this.hpBar.parent = this.mesh;
    this.hpBar.position.z = -(def.radius + 0.12);
    const fgMat = new BABYLON.StandardMaterial(`hpFgMat_${this.mesh.name}`, scene);
    fgMat.diffuseColor = new BABYLON.Color3(0.2, 0.9, 0.3);
    fgMat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
    fgMat.specularColor = BABYLON.Color3.Black();
    this.hpBar.material = fgMat;
    this.hpBar.isPickable = false;

    const startIdx = startWaypoint || 0;
    this.prevPos = (waypoints[startIdx] ?? waypoints[0]).clone();
    this.nextPos = (waypoints[startIdx] ?? waypoints[0]).clone();
    this.waypointIndex = Math.max(startIdx + 1, 1);
  }

  get position(): BABYLON.Vector3 { return this.mesh.position; }

  isStealth(): boolean { return this.def.stealth === true; }

  getWaypointIndex(): number { return this.waypointIndex; }

  getWaypoints(): BABYLON.Vector3[] { return this.waypoints; }

  getDisableRadius(): number | null {
    return this.def.id === 'grb' ? 2.5 : null;
  }

  getDisableDuration(): number | null {
    return this.def.id === 'grb' ? 3.0 : null;
  }

  applySlow(mult: number, duration: number) {
    this.slowMultiplier = mult;
    this.slowTimer = duration;
  }

  shouldSplit(): boolean {
    return this.def.splits === true && !this.hasSplit && this.hp <= this.def.hp * 0.5 && this.hp > 0;
  }

  updateVisuals(dt: number) {
    this.timeAccum += dt;
    if (this.shaderMat) {
      this.shaderMat.setFloat('uTime', this.timeAccum);
    }
    if (this.cometTail && this.waypointIndex < this.waypoints.length) {
      const target = this.waypoints[this.waypointIndex];
      const dx = target.x - this.mesh.position.x;
      const dz = target.z - this.mesh.position.z;
      const angle = Math.atan2(dx, dz);
      this.mesh.rotation.y = angle;
    }
  }

  fixedUpdate(dt: number): boolean {
    if (!this.alive) return false;
    if (this.waypointIndex >= this.waypoints.length) {
      return true;
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1.0;
      }
    }

    this.prevPos.copyFrom(this.mesh.position);

    const target = this.waypoints[this.waypointIndex];
    const dir = target.subtract(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    const step = this.speed * this.slowMultiplier * dt;

    if (dist <= step) {
      this.mesh.position.x = target.x;
      this.mesh.position.z = target.z;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        return true;
      }
    } else {
      dir.normalize();
      this.mesh.position.x += dir.x * step;
      this.mesh.position.z += dir.z * step;
    }

    this.nextPos.copyFrom(this.mesh.position);
    return false;
  }

  interpolate(alpha: number) {
    if (!this.alive) return;
    this.mesh.position.x = this.prevPos.x + (this.nextPos.x - this.prevPos.x) * alpha;
    this.mesh.position.z = this.prevPos.z + (this.nextPos.z - this.prevPos.z) * alpha;
  }

  takeDamage(amount: number): boolean {
    const effective = Math.max(1, amount - this.def.armor);
    this.hp -= effective;

    const ratio = Math.max(0, this.hp / this.def.hp);
    if (this.hpBar) {
      this.hpBar.scaling.x = ratio;
      this.hpBar.position.x = -(this.hpBarWidth * (1 - ratio)) / 2;
      const mat = this.hpBar.material as BABYLON.StandardMaterial;
      mat.diffuseColor.r = ratio < 0.5 ? 0.9 : 0.2 + (1 - ratio) * 1.4;
      mat.diffuseColor.g = ratio > 0.5 ? 0.9 : ratio * 1.8;
      mat.emissiveColor.r = mat.diffuseColor.r * 0.4;
      mat.emissiveColor.g = mat.diffuseColor.g * 0.4;
    }

    if (this.shouldSplit()) {
      this.hasSplit = true;
      this.alive = false;
      this.dispose();
      return true;
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.dispose();
      return true;
    }
    return false;
  }

  dispose() {
    this.hpBar?.dispose();
    this.hpBarBg?.dispose();
    this.cometTailMat?.dispose();
    this.cometTail?.dispose();
    this.shaderMat?.dispose();
    this.mesh.dispose();
  }
}
