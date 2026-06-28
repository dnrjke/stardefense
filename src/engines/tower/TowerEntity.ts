import * as BABYLON from '@babylonjs/core';
import type { TowerDef } from '@/shared/data/TowerData';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import { Projectile } from './Projectile';
import { ciToRgb } from '@/shared/data/ColorUtil';

// ── Tower Star Shader ─────────────────────────────────────────────────────
// FBM noise contour lines + Fresnel rim glow + NdotV limb darkening
// Inspired by ArcanaCoreShader DNA, simplified for 60fps tower defense

const _TOWER_VERT = /* glsl */`
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
    vLocalPos   = normalize(position);
    vWorldNorm  = normalize((world * vec4(normal, 0.0)).xyz);
    vec3 wPos   = (world * vec4(position, 1.0)).xyz;
    vViewDir    = normalize(cameraPosition - wPos);
}
`;

const _TOWER_FRAG = /* glsl */`
precision highp float;

varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;

uniform float uTime;
uniform vec3  uBaseColor;
uniform float uSeed;

// ── Value noise + FBM (4 octaves) ──
float _h(float n) { return fract(sin(n) * 43758.5453123); }
float _h3(vec3 p) { return _h(dot(p, vec3(127.1, 311.7, 74.3))); }
float _vn(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(_h3(i),              _h3(i+vec3(1,0,0)), f.x),
            mix(_h3(i+vec3(0,1,0)), _h3(i+vec3(1,1,0)), f.x), f.y),
        mix(mix(_h3(i+vec3(0,0,1)), _h3(i+vec3(1,0,1)), f.x),
            mix(_h3(i+vec3(0,1,1)), _h3(i+vec3(1,1,1)), f.x), f.y),
        f.z);
}
float _fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * _vn(p);
        p  = p * 2.1 + vec3(3.71, 6.83, 1.27);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 n = vLocalPos;

    // ── Two FBM layers with per-tower seed ──
    float tSpeed = 0.12;
    vec3  fp1 = n * 3.5 + vec3(uSeed, 0.0, uTime * tSpeed);
    vec3  fp2 = n * 5.0 + vec3(uSeed * 0.7, uTime * tSpeed * 0.6, uTime * tSpeed * 0.4 + uSeed * 1.3);
    float f1  = _fbm(fp1);
    float f2  = _fbm(fp2);

    // ── Contour lines (level-crossing bands) ──
    float density = 4.0;
    float lw1 = 0.06;
    float lw2 = 0.08;
    float c1 = 1.0 - smoothstep(0.0, lw1, abs(fract(f1 * density) - 0.5) * 2.0);
    float c2 = 1.0 - smoothstep(0.0, lw2, abs(fract(f2 * density * 0.7) - 0.5) * 2.0);

    // ── Threshold sparsification ──
    float thresh1 = 0.55;
    float thresh2 = 0.45;
    float w1 = max(0.0, c1 - thresh1) / max(1.0 - thresh1, 0.001);
    float w2 = max(0.0, c2 - thresh2) / max(1.0 - thresh2, 0.001);
    float lines = w1 * 0.65 + w2 * 0.35;

    // ── NdotV limb darkening (CoreStarShader DNA) ──
    vec3  N     = normalize(vWorldNorm);
    vec3  V     = normalize(vViewDir);
    float NdotV = max(dot(N, V), 0.0);
    float limb  = mix(0.45, 1.0, NdotV);

    // ── Fresnel rim glow ──
    float fresnel = pow(1.0 - NdotV, 3.0);

    // ── Pulsing emissive (subtle sine oscillation) ──
    float pulse = 0.85 + 0.15 * sin(uTime * 2.0 + uSeed * 10.0);

    // ── Compose color ──
    // Base: star color with limb darkening
    vec3 baseCol = uBaseColor * limb * pulse;
    // Lines add bright highlights in star color
    vec3 lineCol = uBaseColor * 1.4 * lines;
    // Fresnel rim in slightly brightened star color
    vec3 rimCol  = (uBaseColor * 0.5 + vec3(0.5)) * fresnel * 0.6;

    vec3 finalCol = baseCol + lineCol + rimCol;

    gl_FragColor = vec4(finalCol, 1.0);
}
`;

// Register shaders in Effect.ShadersStore for WebGPU GLSL->WGSL transpilation
if (!BABYLON.Effect.ShadersStore['towerStarVertexShader']) {
  BABYLON.Effect.ShadersStore['towerStarVertexShader']   = _TOWER_VERT;
  BABYLON.Effect.ShadersStore['towerStarFragmentShader'] = _TOWER_FRAG;
}

/** Global tower seed counter for visual variety */
let _towerSeedCounter = 0;

export interface TowerBaseStats {
  attackRate: number;
  damage: number;
  range: number;
  armorDebuff: number;
}

export class TowerEntity {
  def: TowerDef;
  readonly row: number;
  readonly col: number;
  mesh: BABYLON.Mesh;
  level = 1;
  evolvedFrom?: string;
  wavesAlive = 0;
  readyToExplode = false;
  baseStats: TowerBaseStats;

  private scene: BABYLON.Scene;
  private attackCooldown = 0;
  private color: BABYLON.Color3;
  private rangeSq: number;
  private rangeDisc: BABYLON.Mesh;
  private shaderMat: BABYLON.ShaderMaterial;
  private seed: number;
  private timeAccum = 0;
  private disabledUntil = 0;
  private disabled = false;
  private pulsarTimer = 0;

  constructor(scene: BABYLON.Scene, def: TowerDef, worldPos: BABYLON.Vector3, row: number, col: number) {
    this.scene = scene;
    this.def = { ...def };
    this.baseStats = {
      attackRate: def.attackRate,
      damage: def.damage,
      range: def.range,
      armorDebuff: def.armorDebuff ?? 0,
    };
    this.row = row;
    this.col = col;
    this.rangeSq = def.range * def.range;
    this.seed = (_towerSeedCounter++) * 0.37;

    const [r, g, b] = ciToRgb(def.ci);
    this.color = new BABYLON.Color3(r, g, b);

    const diameter = 0.6;
    this.mesh = BABYLON.MeshBuilder.CreateSphere(`tower_${def.id}_${row}_${col}`, {
      diameter,
      segments: 24,
    }, scene);
    this.mesh.position.copyFrom(worldPos);
    this.mesh.position.y = 0.35;

    // Custom ShaderMaterial with FBM noise + Fresnel rim + limb darkening
    this.shaderMat = new BABYLON.ShaderMaterial(
      `towerStarMat_${this.mesh.name}`,
      scene,
      { vertex: 'towerStar', fragment: 'towerStar' },
      {
        attributes: ['position', 'normal'],
        uniforms: [
          'worldViewProjection', 'world', 'cameraPosition',
          'uTime', 'uBaseColor', 'uSeed',
        ],
        needAlphaBlending: false,
      },
    );
    this.shaderMat.setFloat('uTime', 0);
    this.shaderMat.setColor3('uBaseColor', this.color);
    this.shaderMat.setFloat('uSeed', this.seed);
    this.shaderMat.backFaceCulling = true;

    this.mesh.material = this.shaderMat;
    this.mesh.isPickable = true;
    this.mesh.metadata = { type: 'tower', row, col };

    // Range indicator
    this.rangeDisc = BABYLON.MeshBuilder.CreateDisc(`range_${this.mesh.name}`, {
      radius: def.range,
      tessellation: 48,
    }, scene);
    this.rangeDisc.rotation.x = Math.PI / 2;
    this.rangeDisc.position.copyFrom(worldPos);
    this.rangeDisc.position.y = 0.005;
    const rangeMat = new BABYLON.StandardMaterial(`rangeMat_${this.mesh.name}`, scene);
    rangeMat.diffuseColor = this.color.scale(0.15);
    rangeMat.emissiveColor = this.color.scale(0.05);
    rangeMat.alpha = 0.3;
    rangeMat.specularColor = BABYLON.Color3.Black();
    this.rangeDisc.material = rangeMat;
    this.rangeDisc.isPickable = false;
  }

  get sellValue(): number {
    return Math.floor(this.def.cost * 0.5);
  }

  get totalInvested(): number {
    return this.def.cost;
  }

  onWaveCompleted() {
    if (this.def.specialType !== 'betelgeuse') return;
    this.wavesAlive++;
    if (this.def.wavesUntilExplosion && this.wavesAlive >= this.def.wavesUntilExplosion) {
      this.readyToExplode = true;
    }
  }

  resetCombatStats() {
    this.def.attackRate = this.baseStats.attackRate;
    this.def.damage = this.baseStats.damage;
    this.def.range = this.baseStats.range;
    this.def.armorDebuff = this.baseStats.armorDebuff;
    this.syncRangeSq();
  }

  syncRangeSq() {
    this.rangeSq = this.def.range * this.def.range;
  }

  evolve(newDef: TowerDef, newLevel: number) {
    this.evolvedFrom = this.def.id;
    this.def = { ...newDef };
    this.baseStats = {
      attackRate: newDef.attackRate,
      damage: newDef.damage,
      range: newDef.range,
      armorDebuff: newDef.armorDebuff ?? 0,
    };
    this.level = newLevel;
    this.rangeSq = newDef.range * newDef.range;

    const [r, g, b] = ciToRgb(newDef.ci);
    this.color = new BABYLON.Color3(r, g, b);
    this.shaderMat.setColor3('uBaseColor', this.color);

    const newDiameter = newLevel === 2 ? 0.7 : newLevel >= 3 ? 0.8 : 0.6;
    this.mesh.dispose();
    this.mesh = BABYLON.MeshBuilder.CreateSphere(`tower_${newDef.id}_${this.row}_${this.col}`, {
      diameter: newDiameter,
      segments: 24,
    }, this.scene);
    this.mesh.position.copyFrom(this.rangeDisc.position);
    this.mesh.position.y = 0.35;
    this.mesh.material = this.shaderMat;
    this.mesh.isPickable = true;
    this.mesh.metadata = { type: 'tower', row: this.row, col: this.col };

    this.rangeDisc.dispose();
    this.rangeDisc = BABYLON.MeshBuilder.CreateDisc(`range_${this.mesh.name}`, {
      radius: newDef.range,
      tessellation: 48,
    }, this.scene);
    this.rangeDisc.rotation.x = Math.PI / 2;
    this.rangeDisc.position.copyFrom(this.mesh.position);
    this.rangeDisc.position.y = 0.005;
    const rangeMat = new BABYLON.StandardMaterial(`rangeMat_${this.mesh.name}`, this.scene);
    rangeMat.diffuseColor = this.color.scale(0.15);
    rangeMat.emissiveColor = this.color.scale(0.05);
    rangeMat.alpha = 0.3;
    rangeMat.specularColor = BABYLON.Color3.Black();
    this.rangeDisc.material = rangeMat;
    this.rangeDisc.isPickable = false;

    if (newDef.specialType === 'black_hole') {
      this.shaderMat.setColor3('uBaseColor', new BABYLON.Color3(0.1, 0.02, 0.15));
    }

    this.wavesAlive = 0;
    this.readyToExplode = false;
    this.pulsarTimer = 0;
    this.attackCooldown = 0;

    const self = this as any;
    self._orionPiercing = false;
    self._trinaryMultiTarget = false;
  }

  disable(duration: number) {
    this.disabledUntil = duration;
    this.disabled = true;
    this.shaderMat.setColor3('uBaseColor', this.color.scale(0.3));
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  updateVisuals(dt: number) {
    this.timeAccum += dt;
    this.shaderMat.setFloat('uTime', this.timeAccum);
  }

  canDetectStealth(): boolean {
    return this.def.specialType === 'magnetar' || this.def.specialType === 'pulsar';
  }

  getColor(): BABYLON.Color3 {
    return this.color;
  }

  advancePulsarTimer(dt: number): boolean {
    if (this.def.specialType !== 'pulsar') return false;
    this.pulsarTimer += dt;
    if (this.pulsarTimer >= (this.def.pulsarInterval ?? 2.0)) {
      this.pulsarTimer = 0;
      return true;
    }
    return false;
  }

  fixedUpdate(dt: number, enemies: EnemyEntity[]): Projectile | null {
    if (this.disabled) {
      this.disabledUntil -= dt;
      if (this.disabledUntil <= 0) {
        this.disabled = false;
        this.shaderMat.setColor3('uBaseColor', this.color);
      }
      return null;
    }

    if (this.def.noAttack) return null;

    this.attackCooldown -= dt;
    if (this.attackCooldown > 0) return null;

    if (this.def.attackRate <= 0) return null;

    let closest: EnemyEntity | null = null;
    let closestDistSq = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (enemy.isStealth() && !this.canDetectStealth()) continue;
      const dx = enemy.position.x - this.mesh.position.x;
      const dz = enemy.position.z - this.mesh.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq <= this.rangeSq && distSq < closestDistSq) {
        closest = enemy;
        closestDistSq = distSq;
      }
    }

    if (!closest) return null;

    this.attackCooldown = 1 / this.def.attackRate;
    const proj = new Projectile(
      this.scene,
      this.mesh.position,
      closest,
      this.def.damage,
      this.def.projectileSpeed,
      this.color,
    );
    if (this.def.splashRadius) proj.splashRadius = this.def.splashRadius;
    return proj;
  }

  dispose() {
    this.rangeDisc.dispose();
    this.shaderMat.dispose();
    this.mesh.dispose();
  }
}
