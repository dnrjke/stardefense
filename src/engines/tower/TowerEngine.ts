import * as BABYLON from '@babylonjs/core';
import { TowerEntity } from './TowerEntity';
import { Projectile } from './Projectile';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import type { MapEngine } from '@/engines/map/MapEngine';
import type { WaveEngine } from '@/engines/wave/WaveEngine';

export class TowerEngine {
  private scene: BABYLON.Scene;
  private mapEngine: MapEngine;
  private towers: TowerEntity[] = [];
  private projectiles: Projectile[] = [];

  onEnemyHit: ((enemy: EnemyEntity, damage: number) => void) | null = null;

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

      const proj = tower.fixedUpdate(dt, enemies);
      if (proj) this.projectiles.push(proj);
    }

    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      const hit = proj.fixedUpdate(dt);
      if (hit) {
        this.onEnemyHit?.(proj.target, proj.damage);
      }
    }

    this.projectiles = this.projectiles.filter(p => p.alive);
  }

  findTowerAt(row: number, col: number): TowerEntity | null {
    return this.towers.find(t => t.row === row && t.col === col) ?? null;
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
    this.towers = [];
    this.projectiles = [];
  }
}
