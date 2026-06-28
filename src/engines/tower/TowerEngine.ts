import * as BABYLON from '@babylonjs/core';
import { TowerEntity } from './TowerEntity';
import { Projectile } from './Projectile';
import { TOWER_DEFS } from '@/shared/data/TowerData';
import { computeEvolvedDef, getEvolutions } from './EvolutionSystem';
import { SynergyEngine, type ActiveSynergy } from '@/engines/synergy/SynergyEngine';
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
  private specialTimers = new Map<TowerEntity, number>();
  private synergyEngine = new SynergyEngine();
  private activeSynergies: ActiveSynergy[] = [];
  private _synergyDirty = true;

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
    this._synergyDirty = true;
    return tower;
  }

  resetBuffs() {
    for (const tower of this.towers) {
      tower.resetCombatStats();
      (tower as any)._orionPiercing = false;
      (tower as any)._trinaryMultiTarget = false;
    }
  }

  fixedUpdate(dt: number, waveEngine: WaveEngine) {
    const enemies = waveEngine.getAliveEnemies();

    // Reset aura/synergy buffs from previous frame
    this.resetBuffs();

    // Evaluate synergies (only when tower layout changes)
    if (this._synergyDirty) {
      this.activeSynergies = this.synergyEngine.evaluate(this.towers);
      this._synergyDirty = false;
    }

    // Apply synergy buffs (always from base stats — avoids per-frame compounding)
    for (const syn of this.activeSynergies) {
      if (syn.id === 'winter_triangle') {
        for (const t of syn.affectedTowers) {
          t.def.attackRate *= 1.2;
        }
      }
      if (syn.id === 'main_sequence') {
        for (const t of syn.affectedTowers) {
          t.def.damage = Math.round(t.def.damage * 1.1);
        }
      }
      if (syn.id === 'binary_star') {
        for (const t of syn.affectedTowers) {
          t.def.attackRate *= 1.15;
        }
      }
      // Sword of Orion: Rigel-based range+1, Betelgeuse-based explosion damage+30%
      if (syn.id === 'sword_of_orion') {
        for (const t of syn.affectedTowers) {
          const base = t.evolvedFrom ?? t.def.id;
          if (base.startsWith('rigel')) {
            t.def.range += 1;
            t.syncRangeSq();
          }
          if (base.startsWith('betelgeuse')) {
            t.def.damage = Math.round(t.def.damage * 1.3);
          }
        }
      }
      // Nucleosynthesis: Wolf-Rayet + Betelgeuse armor ignore (+10 armor debuff)
      if (syn.id === 'nucleosynthesis') {
        for (const t of syn.affectedTowers) {
          t.def.armorDebuff = (t.def.armorDebuff ?? 0) + 10;
        }
      }
      // Extreme Magnetosphere: Magnetar detection range → map-wide (range=50)
      if (syn.id === 'extreme_magnetosphere') {
        for (const t of syn.affectedTowers) {
          t.def.range = 50;
          t.syncRangeSq();
        }
      }
      // Orion Belt: piercing shots (flag on tower, applied during projectile hit)
      if (syn.id === 'orion_belt') {
        for (const t of syn.affectedTowers) {
          (t as any)._orionPiercing = true;
        }
      }
      // Trinary Star: 25% chance to fire at a second target
      if (syn.id === 'trinary_star') {
        for (const t of syn.affectedTowers) {
          (t as any)._trinaryMultiTarget = true;
        }
      }
    }

    const towersToRemove: TowerEntity[] = [];
    const auraBuffed = new Set<TowerEntity>();

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

      // ── Flare Star: periodic AoE burst every 5s ──
      if (tower.def.specialType === 'flare_star') {
        const t = (this.specialTimers.get(tower) ?? 0) + dt;
        if (t >= 5.0) {
          this.specialTimers.set(tower, 0);
          const flareDmg = tower.def.damage * 2;
          const rSq = tower.def.range * tower.def.range;
          for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const dx = enemy.position.x - tower.mesh.position.x;
            const dz = enemy.position.z - tower.mesh.position.z;
            if (dx * dx + dz * dz <= rSq) {
              this.onEnemyHit?.(enemy, flareDmg);
            }
          }
        } else {
          this.specialTimers.set(tower, t);
        }
      }

      // ── Pulsating Variable: periodic AoE pulse every 3s ──
      if (tower.def.specialType === 'pulsating_variable') {
        const t = (this.specialTimers.get(tower) ?? 0) + dt;
        if (t >= 3.0) {
          this.specialTimers.set(tower, 0);
          const rSq = tower.def.range * tower.def.range;
          for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const dx = enemy.position.x - tower.mesh.position.x;
            const dz = enemy.position.z - tower.mesh.position.z;
            if (dx * dx + dz * dz <= rSq) {
              this.onEnemyHit?.(enemy, tower.def.damage);
            }
          }
        } else {
          this.specialTimers.set(tower, t);
        }
      }

      // ── SGR Repeater: periodic piercing line burst every 10s ──
      if (tower.def.specialType === 'sgr_repeater') {
        const t = (this.specialTimers.get(tower) ?? 0) + dt;
        if (t >= 10.0) {
          this.specialTimers.set(tower, 0);
          let target: EnemyEntity | null = null;
          let minDist = Infinity;
          const rSq = tower.def.range * tower.def.range;
          for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const dx = enemy.position.x - tower.mesh.position.x;
            const dz = enemy.position.z - tower.mesh.position.z;
            const d = dx * dx + dz * dz;
            if (d <= rSq && d < minDist) { minDist = d; target = enemy; }
          }
          if (target) {
            const dx = target.position.x - tower.mesh.position.x;
            const dz = target.position.z - tower.mesh.position.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len > 0) {
              const nx = dx / len;
              const nz = dz / len;
              const burstDmg = tower.def.damage * 3;
              const lineWidth = 0.5;
              const lineWSq = lineWidth * lineWidth;
              for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const ex = enemy.position.x - tower.mesh.position.x;
                const ez = enemy.position.z - tower.mesh.position.z;
                const proj = ex * nx + ez * nz;
                if (proj < 0 || proj > tower.def.range) continue;
                const perpX = ex - proj * nx;
                const perpZ = ez - proj * nz;
                if (perpX * perpX + perpZ * perpZ <= lineWSq) {
                  this.onEnemyHit?.(enemy, burstDmg);
                }
              }
            }
          }
        } else {
          this.specialTimers.set(tower, t);
        }
      }

      // ── A-Supergiant buff aura: +15% damage to towers within 2.5 tiles ──
      if (tower.def.specialType === 'a_supergiant') {
        const buffRange = 2.5;
        const buffRangeSq = buffRange * buffRange;
        for (const other of this.towers) {
          if (other === tower) continue;
          const dx = other.mesh.position.x - tower.mesh.position.x;
          const dz = other.mesh.position.z - tower.mesh.position.z;
          if (dx * dx + dz * dz <= buffRangeSq && !auraBuffed.has(other)) {
            other.def.damage = Math.round(other.def.damage * 1.15);
            auraBuffed.add(other);
          }
        }
      }

      const proj = tower.fixedUpdate(dt, enemies);
      if (proj) {
        if ((tower as any)._orionPiercing && Math.random() < 0.5) {
          proj.piercing = true;
        }
        this.projectiles.push(proj);
        // ── Binary System: fire second projectile ──
        if (tower.def.specialType === 'binary_system' && proj.target.alive) {
          const proj2 = new Projectile(
            this.scene,
            tower.mesh.position,
            proj.target,
            proj.damage,
            proj.speed,
            tower.getColor(),
          );
          if (tower.def.splashRadius) proj2.splashRadius = tower.def.splashRadius;
          this.projectiles.push(proj2);
        }
        // ── Trinary Star: 25% chance to fire at second target ──
        if ((tower as any)._trinaryMultiTarget && Math.random() < 0.25) {
          const rSq = tower.def.range * tower.def.range;
          let secondTarget: EnemyEntity | null = null;
          let minD = Infinity;
          for (const e of enemies) {
            if (!e.alive || e === proj.target) continue;
            const dx = e.position.x - tower.mesh.position.x;
            const dz = e.position.z - tower.mesh.position.z;
            const d = dx * dx + dz * dz;
            if (d <= rSq && d < minD) { minD = d; secondTarget = e; }
          }
          if (secondTarget) {
            const p2 = new Projectile(this.scene, tower.mesh.position, secondTarget, proj.damage, proj.speed, tower.getColor());
            if (tower.def.splashRadius) p2.splashRadius = tower.def.splashRadius;
            this.projectiles.push(p2);
          }
        }
      }
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
      // Piercing projectile lost its target — retarget or die
      if (proj.piercing && !proj.target.alive) {
        let newTarget: EnemyEntity | null = null;
        let minD = Infinity;
        for (const e of enemies) {
          if (!e.alive) continue;
          const dx = e.position.x - proj.mesh.position.x;
          const dz = e.position.z - proj.mesh.position.z;
          const d = dx * dx + dz * dz;
          if (d < minD) { minD = d; newTarget = e; }
        }
        if (newTarget && minD < 25) {
          proj.target = newTarget;
        } else {
          proj.alive = false;
          proj.dispose();
          continue;
        }
      }
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
    this._synergyDirty = true;
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
    this._synergyDirty = true;
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

  getActiveSynergies(): ActiveSynergy[] {
    return this.activeSynergies;
  }

  evaluateSynergiesOnly(): ActiveSynergy[] {
    this.activeSynergies = this.synergyEngine.evaluate(this.towers);
    return this.activeSynergies;
  }

  previewSynergies(ghostDef: import('@/shared/data/TowerData').TowerDef, row: number, col: number): ActiveSynergy[] {
    const ghost = { def: ghostDef, row, col, level: 1, evolvedFrom: undefined,
      mesh: { position: this.mapEngine.tileToWorld(row, col) } } as any;
    return this.synergyEngine.evaluate([...this.towers, ghost]);
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

  clearProjectiles() {
    for (const p of this.projectiles) p.dispose();
    this.projectiles = [];
    this.resetBuffs();
  }

  clear() {
    for (const t of this.towers) t.dispose();
    this.clearProjectiles();
    for (const r of this.nebulaRemnants) {
      r.mat.dispose();
      r.mesh.dispose();
    }
    this.towers = [];
    this.nebulaRemnants = [];
    this.nebulaDebuffs = [];
    this.specialTimers.clear();
  }
}
