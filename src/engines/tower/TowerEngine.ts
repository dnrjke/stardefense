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
