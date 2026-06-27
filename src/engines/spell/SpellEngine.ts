import * as BABYLON from '@babylonjs/core';
import { SPELL_DEFS } from '@/shared/data/SpellData';
import { playSupernovaFlare, playGravityWave } from './SpellEffects';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import type { GameStore } from '@/app/store/GameStore';

export class SpellEngine {
  private scene: BABYLON.Scene;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  castSpell(spellId: string, enemies: EnemyEntity[], store: GameStore): boolean {
    const def = SPELL_DEFS[spellId];
    if (!def) return false;

    const state = store.getState();
    const cd = state.spellCooldowns[spellId];
    if (cd && cd > 0) return false;
    if (!state.spendSpellGauge(def.gaugeCost)) return false;

    if (spellId === 'supernova_flare') {
      const positions = enemies
        .filter(e => e.alive)
        .map(e => ({ x: e.position.x, y: e.position.y, z: e.position.z }));
      for (const e of enemies) {
        if (e.alive) e.takeDamage(100);
      }
      playSupernovaFlare(this.scene, positions);
    } else if (spellId === 'gravity_wave') {
      const positions = enemies
        .filter(e => e.alive)
        .map(e => ({ x: e.position.x, y: e.position.y, z: e.position.z }));
      for (const e of enemies) {
        if (e.alive) e.applySlow(0.5, 3.0);
      }
      playGravityWave(this.scene, positions);
    }

    store.getState().startCooldown(spellId, def.cooldown);
    return true;
  }
}
