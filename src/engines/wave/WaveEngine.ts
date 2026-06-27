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
  pathIndex: number;
}

export class WaveEngine {
  private scene: BABYLON.Scene;
  private paths: BABYLON.Vector3[][];
  private enemies: EnemyEntity[] = [];
  private spawnStates: SpawnState[] = [];
  private active = false;
  private allSpawned = false;
  speedMultiplier = 1;

  onEnemyKilled: ((enemy: EnemyEntity) => void) | null = null;
  onEnemyReachedEnd: ((enemy: EnemyEntity) => void) | null = null;
  onWaveCleared: (() => void) | null = null;

  constructor(scene: BABYLON.Scene, paths: BABYLON.Vector3[][]) {
    this.scene = scene;
    this.paths = paths;
  }

  startWave(waveDef: WaveDef) {
    this.spawnStates = waveDef.spawns.map(s => ({
      enemyId: s.enemyId,
      remaining: s.count,
      interval: s.interval,
      delay: s.delay,
      timer: 0,
      started: false,
      pathIndex: s.pathIndex ?? 0,
    }));
    this.allSpawned = false;
    this.active = true;
  }

  fixedUpdate(dt: number) {
    if (!this.active) return;

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
          const waypoints = this.paths[ss.pathIndex] ?? this.paths[0];
          const enemy = new EnemyEntity(this.scene, def, waypoints);
          if (this.speedMultiplier !== 1) {
            enemy.speed *= this.speedMultiplier;
          }
          this.enemies.push(enemy);
          this._aliveDirty = true;
        }
        ss.remaining--;
      }
    }
    if (allDone) this.allSpawned = true;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const reachedEnd = enemy.fixedUpdate(dt);
      if (reachedEnd) {
        enemy.alive = false;
        enemy.dispose();
        this._aliveDirty = true;
        this.onEnemyReachedEnd?.(enemy);
      }
    }

    // Prune dead enemies periodically to prevent array growth
    if (this.enemies.length > 50) {
      this.enemies = this.enemies.filter(e => e.alive);
      this._aliveDirty = true;
    }

    if (this.allSpawned && this.enemies.every(e => !e.alive)) {
      this.active = false;
      this.onWaveCleared?.();
    }
  }

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

  private _aliveCache: EnemyEntity[] = [];
  private _aliveDirty = true;

  markAliveDirty() { this._aliveDirty = true; }

  getAliveEnemies(): EnemyEntity[] {
    if (this._aliveDirty) {
      this._aliveCache = this.enemies.filter(e => e.alive);
      this._aliveDirty = false;
    }
    return this._aliveCache;
  }

  killEnemy(enemy: EnemyEntity, damage: number): boolean {
    const wasSplitter = enemy.def.splits === true && !enemy.hasSplit;
    const deathPos = enemy.position.clone();
    const killed = enemy.takeDamage(damage);
    if (killed) {
      this._aliveDirty = true;
      if (wasSplitter && enemy.hasSplit) {
        this.spawnSplitCopies(enemy);
      }
      this.spawnDeathEffect(deathPos);
      this.onEnemyKilled?.(enemy);
    }
    return killed;
  }

  private spawnDeathEffect(pos: BABYLON.Vector3) {
    const sphere = BABYLON.MeshBuilder.CreateSphere('deathFx', { diameter: 0.3, segments: 6 }, this.scene);
    sphere.position.copyFrom(pos);
    sphere.position.y = 0.3;
    const mat = new BABYLON.StandardMaterial('deathFxMat', this.scene);
    mat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.2);
    mat.disableLighting = true;
    mat.alpha = 0.8;
    sphere.material = mat;
    sphere.isPickable = false;

    const scaleAnim = new BABYLON.Animation('deathScale', 'scaling', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    scaleAnim.setKeys([
      { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
      { frame: 8, value: new BABYLON.Vector3(3, 3, 3) },
    ]);
    const alphaAnim = new BABYLON.Animation('deathAlpha', 'material.alpha', 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    alphaAnim.setKeys([
      { frame: 0, value: 0.8 },
      { frame: 8, value: 0 },
    ]);
    sphere.animations = [scaleAnim, alphaAnim];
    this.scene.beginAnimation(sphere, 0, 8, false, 1, () => {
      mat.dispose();
      sphere.dispose();
    });
  }

  private spawnSplitCopies(parent: EnemyEntity) {
    const splitDef = ENEMY_DEFS['antimatter_storm_split'];
    if (!splitDef) return;
    const waypoints = parent.getWaypoints();
    const wpIndex = parent.getWaypointIndex();
    const pos = parent.position.clone();
    for (let i = 0; i < 2; i++) {
      const offset = (i === 0 ? -0.3 : 0.3);
      const child = new EnemyEntity(this.scene, splitDef, waypoints, wpIndex);
      child.mesh.position.set(pos.x + offset, pos.y, pos.z + offset);
      this.enemies.push(child);
    }
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
