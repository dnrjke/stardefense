/**
 * Renders shader-based previews for towers and nebulae onto small <canvas> elements.
 * Uses raw WebGL2 to avoid creating a second Babylon engine.
 * Tower preview: sphere with FBM + NdotV limb darkening (same as in-game towerStar shader)
 * Nebula preview: disc with per-type GLSL (same as in-game NebulaEntity shaders)
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// ── Shared noise functions ──

const COMMON_HEADER = `#version 300 es
precision highp float;
in vec2 vUV;
uniform float uTime;
uniform vec3 uColor;
uniform float uSeed;
out vec4 fragColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

const FBM5 = `
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
  return v;
}
`;

const FBM4 = `
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.1 + vec2(1.7, 3.2); a *= 0.5; }
  return v;
}
`;

// ── Tower star shader (sphere projection with FBM + NdotV + Fresnel) ──

const FRAG_TOWER = COMMON_HEADER + `
float _h(float n) { return fract(sin(n) * 43758.5453123); }
float _h3(vec3 p) { return _h(dot(p, vec3(127.1, 311.7, 74.3))); }
float _vn(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(_h3(i), _h3(i+vec3(1,0,0)), f.x),
        mix(_h3(i+vec3(0,1,0)), _h3(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(_h3(i+vec3(0,0,1)), _h3(i+vec3(1,0,1)), f.x),
        mix(_h3(i+vec3(0,1,1)), _h3(i+vec3(1,1,1)), f.x), f.y),
    f.z);
}
float _fbm3(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * _vn(p); p = p * 2.1 + vec3(3.71, 6.83, 1.27); a *= 0.5; }
  return v;
}

void main() {
  vec2 c = vUV * 2.0 - 1.0;
  float dist = length(c);
  if (dist > 1.0) discard;

  // Project 2D UV onto sphere surface
  float z = sqrt(1.0 - dist * dist);
  vec3 n = vec3(c, z);

  // NdotV limb darkening (view dir = 0,0,1 for front-facing preview)
  float NdotV = z;
  float limb = mix(0.45, 1.0, NdotV);

  // FBM contour lines
  float tSpeed = 0.12;
  vec3 fp1 = n * 3.5 + vec3(uSeed, 0.0, uTime * tSpeed);
  vec3 fp2 = n * 5.0 + vec3(uSeed * 0.7, uTime * tSpeed * 0.6, uTime * tSpeed * 0.4 + uSeed * 1.3);
  float f1 = _fbm3(fp1);
  float f2 = _fbm3(fp2);

  float density = 4.0;
  float c1 = 1.0 - smoothstep(0.0, 0.06, abs(fract(f1 * density) - 0.5) * 2.0);
  float c2 = 1.0 - smoothstep(0.0, 0.08, abs(fract(f2 * density * 0.7) - 0.5) * 2.0);
  float w1 = max(0.0, c1 - 0.55) / 0.45;
  float w2 = max(0.0, c2 - 0.45) / 0.55;
  float lines = w1 * 0.65 + w2 * 0.35;

  // Fresnel rim glow
  float fresnel = pow(1.0 - NdotV, 3.0);

  // Pulse
  float pulse = 0.85 + 0.15 * sin(uTime * 2.0 + uSeed * 10.0);

  vec3 baseCol = uColor * limb * pulse;
  vec3 lineCol = uColor * 1.4 * lines;
  vec3 rimCol = (uColor * 0.5 + vec3(0.5)) * fresnel * 0.6;
  vec3 finalCol = baseCol + lineCol + rimCol;

  fragColor = vec4(finalCol, 1.0);
}
`;

// ── Nebula shaders (same GLSL as NebulaEntity.ts, boosted for preview visibility) ──

const FRAG_EMISSION = COMMON_HEADER + FBM5 + `
void main() {
  vec2 c = vUV * 2.0 - 1.0;
  float dist = length(c);
  if (dist > 1.0) discard;
  float f1 = fbm(c * 3.0 + uTime * 0.08);
  float f2 = fbm(c * 5.0 - uTime * 0.05 + vec2(5.0, 3.0));
  float glow = f1 * 0.6 + f2 * 0.4;
  glow *= smoothstep(1.0, 0.3, dist);
  float brightCore = exp(-dist * 2.5) * 0.4;
  vec3 col = uColor * (glow * 2.0 + brightCore * 1.5);
  col += vec3(1.0, 0.8, 0.6) * brightCore * 0.8;
  float alpha = glow * smoothstep(1.0, 0.6, dist) * 0.7 + brightCore * 1.2;
  fragColor = vec4(col, min(alpha, 1.0));
}
`;

const FRAG_REFLECTION = COMMON_HEADER + FBM4 + `
void main() {
  vec2 c = vUV * 2.0 - 1.0;
  float dist = length(c);
  if (dist > 1.0) discard;
  float f = fbm(c * 4.0 + uTime * 0.06);
  float glow = f * smoothstep(1.0, 0.2, dist);
  float sparkle = pow(noise(c * 20.0 + uTime * 0.3), 8.0) * 2.0;
  sparkle *= smoothstep(1.0, 0.4, dist);
  vec3 col = uColor * glow * 1.8 + vec3(0.6, 0.8, 1.0) * sparkle * 1.5;
  float alpha = glow * 0.6 + sparkle * 0.5;
  fragColor = vec4(col, min(alpha, 1.0));
}
`;

const FRAG_DARK = COMMON_HEADER + FBM5 + `
void main() {
  vec2 c = vUV * 2.0 - 1.0;
  float dist = length(c);
  if (dist > 1.0) discard;
  float f = fbm(c * 3.5 + uTime * 0.03);
  float darkness = f * smoothstep(1.0, 0.2, dist);
  vec3 col = uColor * darkness * 1.6;
  vec3 edgeGlow = vec3(0.6, 0.3, 0.15) * smoothstep(0.4, 0.85, dist) * (1.0 - smoothstep(0.85, 1.0, dist)) * 1.2;
  col += edgeGlow;
  float alpha = darkness * 0.85 * smoothstep(1.0, 0.5, dist);
  alpha = max(alpha, 0.2);
  alpha = max(alpha, length(edgeGlow) * 1.5);
  fragColor = vec4(col, min(alpha, 1.0));
}
`;

const FRAG_PLANETARY = COMMON_HEADER + FBM4 + `
void main() {
  vec2 c = vUV * 2.0 - 1.0;
  float dist = length(c);
  if (dist > 1.0) discard;
  float ringDist = abs(dist - 0.6);
  float ring = smoothstep(0.2, 0.05, ringDist);
  float f = fbm(c * 5.0 + uTime * 0.07);
  ring *= (0.7 + 0.3 * f);
  float core = exp(-dist * 8.0) * 0.6;
  vec3 col = uColor * ring * 1.8 + vec3(0.8, 1.0, 0.9) * core * 1.2;
  float alpha = ring * 0.7 + core * 1.2;
  fragColor = vec4(col, min(alpha, 1.0));
}
`;

const FRAG_SUPERNOVA = COMMON_HEADER + FBM5 + `
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
  vec3 col = uColor * filaments * 2.0 + vec3(1.0, 0.9, 0.7) * core * 1.3;
  float pulse = 0.9 + 0.1 * sin(uTime * 2.0);
  col *= pulse;
  float alpha = filaments * 0.65 + core * 1.2;
  fragColor = vec4(col, min(alpha, 1.0));
}
`;

const NEBULA_FRAG_MAP: Record<string, string> = {
  emission_nebula: FRAG_EMISSION,
  reflection_nebula: FRAG_REFLECTION,
  dark_nebula: FRAG_DARK,
  planetary_nebula: FRAG_PLANETARY,
  supernova_remnant: FRAG_SUPERNOVA,
};

// ── Preview rendering engine ──

interface PreviewState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uTimeLoc: WebGLUniformLocation;
  animId: number;
}

let currentPreview: PreviewState | null = null;

function compileShader(gl: WebGL2RenderingContext, src: string, type: number): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function createPreviewCanvas(
  fragSrc: string,
  color: [number, number, number],
  size: number,
  seed: number,
  darkBg: boolean,
): HTMLCanvasElement {
  disposePreview();

  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  canvas.style.cssText = `width:${size}px;height:${size}px;display:block;margin:0 auto 8px;border-radius:50%;`;

  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false })!;
  if (!gl) return canvas;

  gl.viewport(0, 0, canvas.width, canvas.height);
  if (darkBg) {
    gl.clearColor(0.02, 0.02, 0.05, 1.0);
  } else {
    gl.clearColor(0, 0, 0, 0);
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  const vs = compileShader(gl, VERT, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fragSrc, gl.FRAGMENT_SHADER);

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTimeLoc = gl.getUniformLocation(prog, 'uTime')!;
  const uColorLoc = gl.getUniformLocation(prog, 'uColor')!;
  const uSeedLoc = gl.getUniformLocation(prog, 'uSeed');
  gl.uniform3f(uColorLoc, color[0], color[1], color[2]);
  if (uSeedLoc) gl.uniform1f(uSeedLoc, seed);

  let t = seed * 3.7;
  const animate = () => {
    t += 0.016;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTimeLoc, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    currentPreview!.animId = requestAnimationFrame(animate);
  };

  currentPreview = { gl, program: prog, uTimeLoc, animId: 0 };
  currentPreview.animId = requestAnimationFrame(animate);

  return canvas;
}

export function createTowerPreview(
  color: [number, number, number],
  size: number,
): HTMLCanvasElement {
  return createPreviewCanvas(FRAG_TOWER, color, size, Math.random() * 10, false);
}

export function createNebulaPreview(
  messierType: string,
  color: [number, number, number],
  size: number,
): HTMLCanvasElement {
  const fragSrc = NEBULA_FRAG_MAP[messierType] ?? FRAG_EMISSION;
  return createPreviewCanvas(fragSrc, color, size, 0, true);
}

export function disposeNebulaPreview() {
  disposePreview();
}

function disposePreview() {
  if (currentPreview) {
    cancelAnimationFrame(currentPreview.animId);
    const ext = currentPreview.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    currentPreview = null;
  }
}
