import * as BABYLON from '@babylonjs/core';
import { TowerEntity } from './TowerEntity';
import { Projectile } from './Projectile';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import { computeEvolvedDef, getEvolutions } from './EvolutionSystem';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import type { MapEngine } from '@/engines/map/MapEngine';
import type { WaveEngine } from '@/engines/wave/WaveEngine';

interface NebulaRemnant {
  position: BABYLON.Vector3;
  damage: number;
  range: number;
  rangeSq: number;
  mesh: BABYLON.Mesh;
  mat: BABYLON.StandardMaterial;
}

interface NebulaDebuff {
  position: BABYLON.Vector3;
  range: number;
  rangeSq: number;
  armorDebuff: number;
}

export class TowerEngine {
  private scene: BABYLON.Scene;
  private mapEngine: MapEngine;
  private towers: TowerEntity[] = [];
  private projectiles: Projectile[] = [];
  private nebulaRemnants: NebulaRemnant[] = [];
  private nebulaDebuffs: NebulaDebuff[] = [];

  onEnemyHit: ((enemy: EnemyEntity, damage: number) => void) | null = null;
  onBetelgeuseExplode: ((tower: TowerEntity) => void) | null = null;

  constructor(scene: BABYLON.Scene, mapEngine: MapEngine) {
    this.scene = scene;
    this.mapEngine = mapEngine;
  }

  placeTower(towerId: string, row: number, col: number): TowerEntity | null {
    const def = TOWER_DEFS[towerId];
    if (!def) return null;
    if (!this.mapEngine.isBuildable(row, col)) return null;
    if (this.towers.some(t => t.row === row && t.col === col)) return null;

    const worldPos = this.mapEngine.tileToWorld(row, col);
    const tower = new TowerEntity(this.scene, def, worldPos, row, col);
    this.towers.push(tower);
    this.mapEngine.markOccupied(row, col);
    return tower;
  }

  fixedUpdate(dt: number, waveEngine: WaveEngine) {
    const enemies = waveEngine.getAliveEnemies();

    const towersToRemove: TowerEntity[] = [];

    for (const tower of this.towers) {
      if (!tower.isDisabled()) {
        for (const enemy of enemies) {
          const disableRadius = enemy.getDisableRadius();
          if (disableRadius === null) continue;
          const dx = enemy.position.x - tower.mesh.position.x;
          const dz = enemy.position.z - tower.mesh.position.z;
          if (dx * dx + dz * dz <= disableRadius * disableRadius) {
            tower.disable(enemy.getDisableDuration()!);
            break;
          }
        }
      }

      if (tower.readyToExplode) {
        this.onBetelgeuseExplode?.(tower);
        towersToRemove.push(tower);
        continue;
      }

      if (tower.def.specialType === 'black_hole') {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.position.x - tower.mesh.position.x;
          const dz = enemy.position.z - tower.mesh.position.z;
          if (dx * dx + dz * dz <= tower.def.range * tower.def.range) {
            this.onEnemyHit?.(enemy, 9999);
          }
        }
      }

      if (tower.advancePulsarTimer(dt)) {
        const pulsarRange = tower.def.range;
        const knockback = tower.def.pulsarKnockback ?? 0.5;
        const stunDur = tower.def.pulsarStunDuration ?? 0.5;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.position.x - tower.mesh.position.x;
          const dz = enemy.position.z - tower.mesh.position.z;
          const distSq = dx * dx + dz * dz;
          if (distSq <= pulsarRange * pulsarRange && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const nz = dz / dist;
            enemy.position.x += nx * knockback;
            enemy.position.z += nz * knockback;
            void stunDur;
            this.onEnemyHit?.(enemy, tower.def.damage);
          }
        }
      }

      const proj = tower.fixedUpdate(dt, enemies);
      if (proj) this.projectiles.push(proj);
    }

    for (const t of towersToRemove) {
      this.removeTowerInternal(t);
    }

    for (const remnant of this.nebulaRemnants) {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.position.x - remnant.position.x;
        const dz = enemy.position.z - remnant.position.z;
        if (dx * dx + dz * dz <= remnant.rangeSq) {
          this.onEnemyHit?.(enemy, remnant.damage * dt);
        }
      }
    }

    for (const debuff of this.nebulaDebuffs) {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.position.x - debuff.position.x;
        const dz = enemy.position.z - debuff.position.z;
        if (dx * dx + dz * dz <= debuff.rangeSq) {
          this.onEnemyHit?.(enemy, debuff.armorDebuff * dt);
        }
      }
    }

    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      const hit = proj.fixedUpdate(dt);
      if (hit) {
        this.onEnemyHit?.(proj.target, proj.damage);
        if (proj.splashRadius > 0) {
          const splashSq = proj.splashRadius * proj.splashRadius;
          const impactX = proj.target.position.x;
          const impactZ = proj.target.position.z;
          const splashDmg = Math.round(proj.damage * 0.5);
          for (const enemy of enemies) {
            if (!enemy.alive || enemy === proj.target) continue;
            const dx = enemy.position.x - impactX;
            const dz = enemy.position.z - impactZ;
            if (dx * dx + dz * dz <= splashSq) {
              this.onEnemyHit?.(enemy, splashDmg);
            }
          }
        }
      }
    }

    this.projectiles = this.projectiles.filter(p => p.alive);
  }

  findTowerAt(row: number, col: number): TowerEntity | null {
    return this.towers.find(t => t.row === row && t.col === col) ?? null;
  }

  evolveTower(tower: TowerEntity, evolutionId: string): boolean {
    const idx = this.towers.indexOf(tower);
    if (idx === -1) return false;

    if (evolutionId === 'supernova_remnant') {
      const pos = tower.mesh.position.clone();
      const def = TOWER_DEFS[evolutionId];
      this.removeTowerInternal(tower);
      const remnantMesh = BABYLON.MeshBuilder.CreateDisc(`nebula_remnant_${pos.x}_${pos.z}`, {
        radius: def.range,
        tessellation: 32,
      }, this.scene);
      remnantMesh.rotation.x = Math.PI / 2;
      remnantMesh.position.copyFrom(pos);
      remnantMesh.position.y = 0.01;
      const mat = new BABYLON.StandardMaterial(`nebulaMat_${pos.x}_${pos.z}`, this.scene);
      mat.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.1);
      mat.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0.05);
      mat.alpha = 0.4;
      mat.specularColor = BABYLON.Color3.Black();
      remnantMesh.material = mat;
      remnantMesh.isPickable = false;
      this.nebulaRemnants.push({
        position: pos,
        damage: def.damage,
        range: def.range,
        rangeSq: def.range * def.range,
        mesh: remnantMesh,
        mat,
      });
      return true;
    }

    if (evolutionId === 'planetary_nebula') {
      const pos = tower.mesh.position.clone();
      const def = TOWER_DEFS[evolutionId];
      const newDef = computeEvolvedDef(tower.def, evolutionId);
      tower.evolve(newDef, 3);
      this.nebulaDebuffs.push({
        position: pos,
        range: def.range,
        rangeSq: def.range * def.range,
        armorDebuff: def.armorDebuff ?? 5,
      });
      return true;
    }

    const evolutions = getEvolutions(tower.def.id);
    if (!evolutions) return false;

    const newDef = computeEvolvedDef(tower.def, evolutionId);
    const newLevel = (evolutions.level ?? tower.level) + 1;
    tower.evolve(newDef, newLevel);
    return true;
  }

  removeTower(tower: TowerEntity) {
    this.removeTowerInternal(tower);
  }

  private removeTowerInternal(tower: TowerEntity) {
    const idx = this.towers.indexOf(tower);
    if (idx === -1) return;
    this.mapEngine.markBuildable(tower.row, tower.col);
    tower.dispose();
    this.towers.splice(idx, 1);
  }

  sellTower(tower: TowerEntity): number {
    const idx = this.towers.indexOf(tower);
    if (idx === -1) return 0;
    const refund = tower.sellValue;
    this.mapEngine.markBuildable(tower.row, tower.col);
    tower.dispose();
    this.towers.splice(idx, 1);
    return refund;
  }

  getTowers(): TowerEntity[] {
    return this.towers;
  }

  /** Update tower + projectile shader visuals each render frame */
  updateVisuals(dt: number) {
    for (const tower of this.towers) {
      tower.updateVisuals(dt);
    }
    for (const proj of this.projectiles) {
      if (proj.alive) proj.updateVisuals(dt);
    }
  }

  interpolate(alpha: number) {
    for (const proj of this.projectiles) {
      proj.interpolate(alpha);
    }
  }

  clear() {
    for (const t of this.towers) t.dispose();
    for (const p of this.projectiles) p.dispose();
    for (const r of this.nebulaRemnants) {
      r.mat.dispose();
      r.mesh.dispose();
    }
    this.towers = [];
    this.projectiles = [];
    this.nebulaRemnants = [];
    this.nebulaDebuffs = [];
  }
}
