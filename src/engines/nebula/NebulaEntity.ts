import * as BABYLON from '@babylonjs/core';
import type { NebulaDef } from '@/shared/data/NebulaData';

// ── Nebula Disc Shader ───────────────────────────────────────────────────
// Flat disc with FBM noise, per-type visual style, semi-transparent

const _NEBULA_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 worldViewProjection;
varying vec2 vUV;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vUV = uv;
}
`;

const _NEBULA_EMISSION_FRAG = /* glsl */`
precision highp float;
varying vec2 vUV;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
    return v;
}
void main() {
    vec2 c = vUV * 2.0 - 1.0;
    float dist = length(c);
    if (dist > 1.0) discard;

    float f1 = fbm(c * 3.0 + uTime * 0.08);
    float f2 = fbm(c * 5.0 - uTime * 0.05 + vec2(5.0, 3.0));
    float glow = f1 * 0.6 + f2 * 0.4;
    glow *= smoothstep(1.0, 0.3, dist);

    float brightCore = exp(-dist * 2.5) * 0.4;
    vec3 col = uColor * (glow * 1.5 + brightCore);
    col += vec3(1.0, 0.8, 0.6) * brightCore * 0.5;

    float alpha = glow * smoothstep(1.0, 0.6, dist) * 0.55 + brightCore;
    gl_FragColor = vec4(col, alpha);
}
`;

const _NEBULA_REFLECTION_FRAG = /* glsl */`
precision highp float;
varying vec2 vUV;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
    return v;
}
void main() {
    vec2 c = vUV * 2.0 - 1.0;
    float dist = length(c);
    if (dist > 1.0) discard;

    float f = fbm(c * 4.0 + uTime * 0.06);
    float glow = f * smoothstep(1.0, 0.2, dist);

    float sparkle = pow(noise(c * 20.0 + uTime * 0.3), 8.0) * 2.0;
    sparkle *= smoothstep(1.0, 0.4, dist);

    vec3 col = uColor * glow * 1.3 + vec3(0.6, 0.8, 1.0) * sparkle;
    float alpha = glow * 0.45 + sparkle * 0.3;
    gl_FragColor = vec4(col, alpha);
}
`;

const _NEBULA_DARK_FRAG = /* glsl */`
precision highp float;
varying vec2 vUV;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
    return v;
}
void main() {
    vec2 c = vUV * 2.0 - 1.0;
    float dist = length(c);
    if (dist > 1.0) discard;

    float f = fbm(c * 3.5 + uTime * 0.03);
    float darkness = f * smoothstep(1.0, 0.2, dist);

    vec3 col = uColor * darkness * 0.6;
    vec3 edgeGlow = vec3(0.3, 0.15, 0.08) * smoothstep(0.5, 0.9, dist) * (1.0 - smoothstep(0.9, 1.0, dist)) * 0.4;
    col += edgeGlow;

    float alpha = darkness * 0.5 * smoothstep(1.0, 0.7, dist);
    alpha = max(alpha, length(edgeGlow) * 0.8);
    gl_FragColor = vec4(col, alpha);
}
`;

const _NEBULA_PLANETARY_FRAG = /* glsl */`
precision highp float;
varying vec2 vUV;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
    return v;
}
void main() {
    vec2 c = vUV * 2.0 - 1.0;
    float dist = length(c);
    if (dist > 1.0) discard;

    float ringDist = abs(dist - 0.6);
    float ring = smoothstep(0.2, 0.05, ringDist);

    float f = fbm(c * 5.0 + uTime * 0.07);
    ring *= (0.7 + 0.3 * f);

    float core = exp(-dist * 8.0) * 0.6;
    vec3 col = uColor * ring * 1.4 + vec3(0.8, 1.0, 0.9) * core;
    float alpha = ring * 0.55 + core;
    gl_FragColor = vec4(col, alpha);
}
`;

const _NEBULA_SUPERNOVA_FRAG = /* glsl */`
precision highp float;
varying vec2 vUV;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
    return v;
}
void main() {
    vec2 c = vUV * 2.0 - 1.0;
    float dist = length(c);
    if (dist > 1.0) discard;

    float angle = atan(c.y, c.x);
    float f1 = fbm(c * 4.0 + uTime * 0.06);
    float f2 = fbm(vec2(angle * 2.0, dist * 3.0) + uTime * 0.1);

    float filaments = pow(f1, 1.5) * 0.7 + pow(f2, 2.0) * 0.3;
    filaments *= smoothstep(1.0, 0.2, dist);

    float core = exp(-dist * 4.0) * 0.5;
    vec3 col = uColor * filaments * 1.6 + vec3(1.0, 0.9, 0.7) * core;
    float pulse = 0.9 + 0.1 * sin(uTime * 2.0);
    col *= pulse;

    float alpha = filaments * 0.5 + core;
    gl_FragColor = vec4(col, alpha);
}
`;

const SHADER_MAP: Record<string, string> = {
  emission_nebula: 'nebulaEmission',
  reflection_nebula: 'nebulaReflection',
  dark_nebula: 'nebulaDark',
  planetary_nebula: 'nebulaPlanetary',
  supernova_remnant: 'nebulaSupernova',
};

if (!BABYLON.Effect.ShadersStore['nebulaEmissionVertexShader']) {
  BABYLON.Effect.ShadersStore['nebulaEmissionVertexShader'] = _NEBULA_VERT;
  BABYLON.Effect.ShadersStore['nebulaEmissionFragmentShader'] = _NEBULA_EMISSION_FRAG;
  BABYLON.Effect.ShadersStore['nebulaReflectionVertexShader'] = _NEBULA_VERT;
  BABYLON.Effect.ShadersStore['nebulaReflectionFragmentShader'] = _NEBULA_REFLECTION_FRAG;
  BABYLON.Effect.ShadersStore['nebulaDarkVertexShader'] = _NEBULA_VERT;
  BABYLON.Effect.ShadersStore['nebulaDarkFragmentShader'] = _NEBULA_DARK_FRAG;
  BABYLON.Effect.ShadersStore['nebulaPlanetaryVertexShader'] = _NEBULA_VERT;
  BABYLON.Effect.ShadersStore['nebulaPlanetaryFragmentShader'] = _NEBULA_PLANETARY_FRAG;
  BABYLON.Effect.ShadersStore['nebulaSupernovaVertexShader'] = _NEBULA_VERT;
  BABYLON.Effect.ShadersStore['nebulaSupernovaFragmentShader'] = _NEBULA_SUPERNOVA_FRAG;
}

let _nebulaIdCounter = 0;

export class NebulaEntity {
  readonly def: NebulaDef;
  readonly row: number;
  readonly col: number;
  readonly mesh: BABYLON.Mesh;
  private shaderMat: BABYLON.ShaderMaterial;
  private timeAccum = 0;

  constructor(scene: BABYLON.Scene, def: NebulaDef, worldPos: BABYLON.Vector3, row: number, col: number) {
    this.def = def;
    this.row = row;
    this.col = col;

    const id = _nebulaIdCounter++;
    const shaderName = SHADER_MAP[def.messierType] ?? 'nebulaEmission';

    this.mesh = BABYLON.MeshBuilder.CreateDisc(`nebula_${def.id}_${id}`, {
      radius: def.range,
      tessellation: 48,
    }, scene);
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.copyFrom(worldPos);
    this.mesh.position.y = 0.01;
    this.mesh.isPickable = false;

    this.shaderMat = new BABYLON.ShaderMaterial(
      `nebulaMat_${def.id}_${id}`,
      scene,
      { vertex: shaderName, fragment: shaderName },
      {
        attributes: ['position', 'uv'],
        uniforms: ['worldViewProjection', 'uTime', 'uColor'],
        needAlphaBlending: true,
      },
    );
    this.shaderMat.setFloat('uTime', 0);
    this.shaderMat.setColor3('uColor', new BABYLON.Color3(def.shaderColor[0], def.shaderColor[1], def.shaderColor[2]));
    this.shaderMat.backFaceCulling = false;
    this.shaderMat.alphaMode = BABYLON.Constants.ALPHA_ADD;

    this.mesh.material = this.shaderMat;
  }

  get position(): BABYLON.Vector3 {
    return this.mesh.position;
  }

  getEffectType(): NebulaDef['effect'] {
    return this.def.effect;
  }

  getEffectValue(): number {
    return this.def.effectValue;
  }

  getRange(): number {
    return this.def.range;
  }

  updateVisuals(dt: number) {
    this.timeAccum += dt;
    this.shaderMat.setFloat('uTime', this.timeAccum);
  }

  dispose() {
    this.shaderMat.dispose();
    this.mesh.dispose();
  }
}
