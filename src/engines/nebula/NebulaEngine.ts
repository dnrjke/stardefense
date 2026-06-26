import * as BABYLON from '@babylonjs/core';
import { NebulaEntity } from './NebulaEntity';
import { NEBULA_DEFS } from '@/shared/data/NebulaData';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import type { MapEngine } from '@/engines/map/MapEngine';

export class NebulaEngine {
  private scene: BABYLON.Scene;
  private mapEngine: MapEngine;
  private nebulae: NebulaEntity[] = [];
  private occupiedTiles = new Set<string>();

  constructor(scene: BABYLON.Scene, mapEngine: MapEngine) {
    this.scene = scene;
    this.mapEngine = mapEngine;
  }

  placeNebula(nebulaId: string, row: number, col: number): NebulaEntity | null {
    const def = NEBULA_DEFS[nebulaId];
    if (!def) return null;

    if (this.mapEngine.isBuildable(row, col)) return null;

    const key = `${row},${col}`;
    if (this.occupiedTiles.has(key)) return null;

    const worldPos = this.mapEngine.tileToWorld(row, col);
    const entity = new NebulaEntity(this.scene, def, worldPos, row, col);
    this.nebulae.push(entity);
    this.occupiedTiles.add(key);
    return entity;
  }

  getTowerDamageMultiplier(towerPos: BABYLON.Vector3): number {
    let mult = 1.0;
    for (const neb of this.nebulae) {
      if (neb.getEffectType() !== 'attack_buff') continue;
      const dx = towerPos.x - neb.position.x;
      const dz = towerPos.z - neb.position.z;
      const rangeSq = neb.getRange() * neb.getRange();
      if (dx * dx + dz * dz <= rangeSq) {
        mult += neb.getEffectValue();
      }
    }
    return mult;
  }

  getEnemySpeedMultiplier(enemyPos: BABYLON.Vector3): number {
    let mult = 1.0;
    for (const neb of this.nebulae) {
      if (neb.getEffectType() !== 'slow') continue;
      const dx = enemyPos.x - neb.position.x;
      const dz = enemyPos.z - neb.position.z;
      const rangeSq = neb.getRange() * neb.getRange();
      if (dx * dx + dz * dz <= rangeSq) {
        mult *= (1.0 - neb.getEffectValue());
      }
    }
    return mult;
  }

  getEnemyArmorReduction(enemyPos: BABYLON.Vector3): number {
    let reduction = 0;
    for (const neb of this.nebulae) {
      if (neb.getEffectType() !== 'armor_debuff') continue;
      const dx = enemyPos.x - neb.position.x;
      const dz = enemyPos.z - neb.position.z;
      const rangeSq = neb.getRange() * neb.getRange();
      if (dx * dx + dz * dz <= rangeSq) {
        reduction += neb.getEffectValue();
      }
    }
    return reduction;
  }

  isInHomingZone(pos: BABYLON.Vector3): boolean {
    for (const neb of this.nebulae) {
      if (neb.getEffectType() !== 'homing') continue;
      const dx = pos.x - neb.position.x;
      const dz = pos.z - neb.position.z;
      const rangeSq = neb.getRange() * neb.getRange();
      if (dx * dx + dz * dz <= rangeSq) return true;
    }
    return false;
  }

  applyDotDamage(enemies: EnemyEntity[], dt: number) {
    for (const neb of this.nebulae) {
      if (neb.getEffectType() !== 'dot') continue;
      const rangeSq = neb.getRange() * neb.getRange();
      const dmgThisTick = neb.getEffectValue() * dt;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.position.x - neb.position.x;
        const dz = enemy.position.z - neb.position.z;
        if (dx * dx + dz * dz <= rangeSq) {
          enemy.takeDamage(dmgThisTick);
        }
      }
    }
  }

  updateVisuals(dt: number) {
    for (const neb of this.nebulae) {
      neb.updateVisuals(dt);
    }
  }

  getNebulae(): NebulaEntity[] {
    return this.nebulae;
  }

  clear() {
    for (const neb of this.nebulae) neb.dispose();
    this.nebulae = [];
    this.occupiedTiles.clear();
  }

  dispose() {
    this.clear();
  }
}
