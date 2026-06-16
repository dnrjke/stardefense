import * as BABYLON from '@babylonjs/core';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';

// ── Projectile Glow Shader ────────────────────────────────────────────────
const _PROJ_VERT = /* glsl */`
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform vec3 cameraPosition;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _PROJ_FRAG = /* glsl */`
precision highp float;
varying vec3 vWorldNorm;
varying vec3 vViewDir;
uniform vec3 uColor;
uniform float uTime;
void main() {
    vec3 N = normalize(vWorldNorm);
    vec3 V = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    // Radial gradient: bright core, soft edge
    float core = pow(NdotV, 0.8);
    // Fresnel rim glow
    float fresnel = pow(1.0 - NdotV, 2.0);
    // Pulsing
    float pulse = 0.9 + 0.1 * sin(uTime * 12.0);
    vec3 col = uColor * (core * 1.2 + fresnel * 0.5) * pulse;
    gl_FragColor = vec4(col, 1.0);
}
`;

if (!BABYLON.Effect.ShadersStore['projGlowVertexShader']) {
  BABYLON.Effect.ShadersStore['projGlowVertexShader']   = _PROJ_VERT;
  BABYLON.Effect.ShadersStore['projGlowFragmentShader'] = _PROJ_FRAG;
}

/** Max trail segments per projectile */
const TRAIL_LENGTH = 6;

export class Projectile {
  mesh: BABYLON.Mesh;
  target: EnemyEntity;
  damage: number;
  speed: number;
  alive = true;
  private prevPos: BABYLON.Vector3;
  private nextPos: BABYLON.Vector3;
  private shaderMat: BABYLON.ShaderMaterial;
  private timeAccum = 0;
  private trail: BABYLON.Mesh[];
  private trailMats: BABYLON.StandardMaterial[];
  private trailPositions: BABYLON.Vector3[];
  private scene: BABYLON.Scene;

  constructor(scene: BABYLON.Scene, origin: BABYLON.Vector3, target: EnemyEntity, damage: number, speed: number, color: BABYLON.Color3) {
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.scene = scene;

    this.mesh = BABYLON.MeshBuilder.CreateSphere(`proj_${Math.random().toString(36).slice(2, 6)}`, {
      diameter: 0.18,
      segments: 8,
    }, scene);
    this.mesh.position.copyFrom(origin);
    this.mesh.position.y = 0.3;

    // Custom glow shader
    this.shaderMat = new BABYLON.ShaderMaterial(`projGlowMat_${this.mesh.name}`, scene,
      { vertex: 'projGlow', fragment: 'projGlow' },
      { attributes: ['position', 'normal'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'uColor', 'uTime'] },
    );
    this.shaderMat.setColor3('uColor', color);
    this.shaderMat.setFloat('uTime', 0);
    this.mesh.material = this.shaderMat;
    this.mesh.isPickable = false;

    // Trail: fading smaller spheres
    this.trail = [];
    this.trailMats = [];
    this.trailPositions = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const t = (i + 1) / TRAIL_LENGTH;
      const trailMesh = BABYLON.MeshBuilder.CreateSphere(`trail_${this.mesh.name}_${i}`, {
        diameter: 0.18 * (1 - t * 0.7),
        segments: 4,
      }, scene);
      trailMesh.position.copyFrom(origin);
      trailMesh.position.y = 0.3;
      const trailMat = new BABYLON.StandardMaterial(`trailMat_${this.mesh.name}_${i}`, scene);
      trailMat.emissiveColor = color.scale(1 - t * 0.6);
      trailMat.disableLighting = true;
      trailMat.alpha = (1 - t) * 0.6;
      trailMesh.material = trailMat;
      trailMesh.isPickable = false;
      this.trail.push(trailMesh);
      this.trailMats.push(trailMat);
      this.trailPositions.push(origin.clone());
    }

    this.prevPos = this.mesh.position.clone();
    this.nextPos = this.mesh.position.clone();
  }

  /** Update shader time */
  updateVisuals(dt: number) {
    this.timeAccum += dt;
    this.shaderMat.setFloat('uTime', this.timeAccum);
  }

  fixedUpdate(dt: number): boolean {
    if (!this.alive) return false;

    if (!this.target.alive) {
      this.alive = false;
      this.disposeAll();
      return false;
    }

    this.prevPos.copyFrom(this.mesh.position);

    // Shift trail positions (cascade previous positions)
    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i].copyFrom(this.trailPositions[i - 1]);
    }
    if (this.trailPositions.length > 0) {
      this.trailPositions[0].copyFrom(this.mesh.position);
    }

    const dir = this.target.position.subtract(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    const step = this.speed * dt;

    if (dist <= step + this.target.def.radius) {
      this.alive = false;
      this.disposeAll();
      return true; // hit
    }

    dir.normalize();
    this.mesh.position.x += dir.x * step;
    this.mesh.position.z += dir.z * step;

    // Update trail mesh positions
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].position.copyFrom(this.trailPositions[i]);
    }

    this.nextPos.copyFrom(this.mesh.position);
    return false;
  }

  interpolate(alpha: number) {
    if (!this.alive) return;
    this.mesh.position.x = this.prevPos.x + (this.nextPos.x - this.prevPos.x) * alpha;
    this.mesh.position.z = this.prevPos.z + (this.nextPos.z - this.prevPos.z) * alpha;
  }

  private disposeAll() {
    for (let i = 0; i < this.trail.length; i++) {
      this.trailMats[i].dispose();
      this.trail[i].dispose();
    }
    this.shaderMat.dispose();
    this.mesh.dispose();
  }

  dispose() {
    if (this.alive) {
      this.alive = false;
      this.disposeAll();
    }
  }
}
