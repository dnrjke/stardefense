import { SPELL_DEFS } from '@/shared/data/SpellData';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import type { GameStore } from '@/app/store/GameStore';

export class SpellEngine {
  castSpell(spellId: string, enemies: EnemyEntity[], store: GameStore): boolean {
    const def = SPELL_DEFS[spellId];
    if (!def) return false;

    const state = store.getState();
    const cd = state.spellCooldowns[spellId];
    if (cd && cd > 0) return false;
    if (!state.spendSpellGauge(def.gaugeCost)) return false;

    if (spellId === 'supernova_flare') {
      for (const e of enemies) {
        if (e.alive) e.takeDamage(100);
      }
    } else if (spellId === 'gravity_wave') {
      for (const e of enemies) {
        if (e.alive) e.applySlow(0.5, 3.0);
      }
    }

    store.getState().startCooldown(spellId, def.cooldown);
    return true;
  }
}
