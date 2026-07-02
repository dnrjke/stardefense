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
    // 상한 클램프 필수: 정규화 오차로 dot>1이면 pow(1.0-NdotV, k)가 NaN → 모바일 GPU에서 흰색 픽셀
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
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
  splashRadius = 0;
  /** 스플래시 피해 비율 (기본 50%, WC형 80%) */
  splashDamageRatio = 0.5;
  /** 장갑 관통량 — 명중 시 적 장갑을 상한으로 데미지에 가산 (시리우스 B, 핵합성 시너지) */
  armorPen = 0;
  /** 오리온 벨트/백색왜성 관통탄: 첫 명중 후 직선 비행하며 추가 관통 */
  piercing = false;
  alive = true;
  private hitTargets = new Set<EnemyEntity>();
  /** 관통 모드 진입 후 직선 비행 방향 (진입 전 null = 유도 비행) */
  private lineDir: BABYLON.Vector3 | null = null;
  private lineTravel = 0;
  /** 첫 명중 후 직선 비행 한도 (타일) */
  private readonly maxLineTravel = 4;
  /** 총 타격 가능 수 — 삼태성 고증 (첫 타겟 + 관통 2기) */
  private readonly maxPierceTargets = 3;
  /** 관통 1회당 데미지 감쇠 */
  private readonly pierceFalloff = 0.7;
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

  /**
   * @returns true = 이번 틱에 명중 (TowerEngine이 proj.target에 데미지 적용)
   * @param enemies 관통 모드 직선 비행 중 충돌 판정 대상 (관통탄에만 필요)
   */
  fixedUpdate(dt: number, enemies?: readonly EnemyEntity[]): boolean {
    if (!this.alive) return false;

    // 관통탄: 첫 명중 전에 타겟이 죽으면 그 방향 그대로 직선 전환
    if (!this.target.alive && !this.lineDir) {
      if (!this.piercing || !this.enterLineMode()) {
        this.alive = false;
        this.disposeAll();
        return false;
      }
    }

    this.prevPos.copyFrom(this.mesh.position);

    // Shift trail positions (cascade previous positions)
    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i].copyFrom(this.trailPositions[i - 1]);
    }
    if (this.trailPositions.length > 0) {
      this.trailPositions[0].copyFrom(this.mesh.position);
    }

    const step = this.speed * dt;

    // ── 관통 모드: 직선 비행, 경로상의 적을 각 1회씩 타격 ──
    if (this.lineDir) {
      this.mesh.position.x += this.lineDir.x * step;
      this.mesh.position.z += this.lineDir.z * step;
      this.lineTravel += step;

      for (let i = 0; i < this.trail.length; i++) {
        this.trail[i].position.copyFrom(this.trailPositions[i]);
      }
      this.nextPos.copyFrom(this.mesh.position);

      if (enemies) {
        for (const e of enemies) {
          if (!e.alive || this.hitTargets.has(e)) continue;
          const dx = e.position.x - this.mesh.position.x;
          const dz = e.position.z - this.mesh.position.z;
          const r = e.def.radius + 0.09;
          if (dx * dx + dz * dz <= r * r) {
            // 관통 타격 (첫 명중 이후)은 감쇠 적용
            if (this.hitTargets.size > 0) {
              this.damage = Math.max(1, Math.round(this.damage * this.pierceFalloff));
            }
            this.hitTargets.add(e);
            this.target = e;
            if (this.hitTargets.size >= this.maxPierceTargets) {
              this.alive = false;
              this.disposeAll();
            }
            return true;
          }
        }
      }

      if (this.lineTravel >= this.maxLineTravel) {
        this.alive = false;
        this.disposeAll();
      }
      return false;
    }

    // ── 유도 모드 ──
    const dir = this.target.position.subtract(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist <= step + this.target.def.radius) {
      if (this.piercing) {
        // 첫 명중: 이후 유도 종료, 진행 방향 직선 관통 비행
        this.hitTargets.add(this.target);
        if (!this.enterLineMode()) {
          this.alive = false;
          this.disposeAll();
        }
        return true;
      }
      this.alive = false;
      this.disposeAll();
      return true;
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

  /** 현재 타겟 방향으로 직선 비행 전환. 방향 산출 불가 시 false */
  private enterLineMode(): boolean {
    const dir = this.target.position.subtract(this.mesh.position);
    dir.y = 0;
    if (dir.lengthSquared() < 1e-8) return false;
    dir.normalize();
    this.lineDir = dir;
    return true;
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
