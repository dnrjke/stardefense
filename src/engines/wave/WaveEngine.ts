import * as BABYLON from '@babylonjs/core';
import { EnemyEntity } from './EnemyEntity';
import { ENEMY_DEFS } from '@/shared/data/EnemyData';
import type { WaveDef } from '@/shared/data/WaveData';

interface SpawnState {
  enemyId: string;
  remaining: number;
  interval: number;
  delay: number;
  timer: number;
  started: boolean;
}

export class WaveEngine {
  private scene: BABYLON.Scene;
  private waypoints: BABYLON.Vector3[];
  private enemies: EnemyEntity[] = [];
  private spawnStates: SpawnState[] = [];
  private active = false;
  private allSpawned = false;

  onEnemyKilled: ((enemy: EnemyEntity) => void) | null = null;
  onEnemyReachedEnd: ((enemy: EnemyEntity) => void) | null = null;
  onWaveCleared: (() => void) | null = null;

  constructor(scene: BABYLON.Scene, waypoints: BABYLON.Vector3[]) {
    this.scene = scene;
    this.waypoints = waypoints;
  }

  startWave(waveDef: WaveDef) {
    this.spawnStates = waveDef.spawns.map(s => ({
      enemyId: s.enemyId,
      remaining: s.count,
      interval: s.interval,
      delay: s.delay,
      timer: 0,
      started: false,
    }));
    this.allSpawned = false;
    this.active = true;
  }

  fixedUpdate(dt: number) {
    if (!this.active) return;

    // Spawn logic
    let allDone = true;
    for (const ss of this.spawnStates) {
      if (ss.remaining <= 0) continue;
      allDone = false;

      if (!ss.started) {
        ss.delay -= dt;
        if (ss.delay <= 0) ss.started = true;
        continue;
      }

      ss.timer += dt;
      if (ss.timer >= ss.interval) {
        ss.timer -= ss.interval;
        const def = ENEMY_DEFS[ss.enemyId];
        if (def) {
          const enemy = new EnemyEntity(this.scene, def, this.waypoints);
          this.enemies.push(enemy);
        }
        ss.remaining--;
      }
    }
    if (allDone) this.allSpawned = true;

    // Update enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const reachedEnd = enemy.fixedUpdate(dt);
      if (reachedEnd) {
        enemy.alive = false;
        enemy.dispose();
        this.onEnemyReachedEnd?.(enemy);
      }
    }

    // Check wave cleared
    if (this.allSpawned && this.enemies.every(e => !e.alive)) {
      this.active = false;
      this.onWaveCleared?.();
    }
  }

  /** Update enemy shader visuals each render frame */
  updateVisuals(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.updateVisuals(dt);
    }
  }

  interpolate(alpha: number) {
    for (const enemy of this.enemies) {
      enemy.interpolate(alpha);
    }
  }

  getAliveEnemies(): EnemyEntity[] {
    return this.enemies.filter(e => e.alive);
  }

  killEnemy(enemy: EnemyEntity, damage: number): boolean {
    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.onEnemyKilled?.(enemy);
    }
    return killed;
  }

  isActive(): boolean { return this.active; }

  clear() {
    for (const e of this.enemies) {
      if (e.alive) e.dispose();
    }
    this.enemies = [];
    this.spawnStates = [];
    this.active = false;
  }
}
