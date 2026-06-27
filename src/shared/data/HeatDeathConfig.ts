export interface HeatDeathScaling {
  hpMultiplier: number;
  speedMultiplier: number;
  armorBonus: number;
  countMultiplier: number;
  intervalMultiplier: number;
}

export function getHeatDeathScaling(wave: number): HeatDeathScaling {
  return {
    hpMultiplier: 1 + wave * 0.15 + Math.floor(wave / 10) * 0.5,
    speedMultiplier: Math.min(2.5, 1 + wave * 0.02),
    armorBonus: Math.floor(wave / 5) * 2,
    countMultiplier: 1 + wave * 0.1,
    intervalMultiplier: Math.max(0.3, 1 - wave * 0.01),
  };
}

export const HEAT_DEATH_CONFIG = {
  startingIsm: 200,
  baseHp: 1,
  waveRewardBase: 20,
  waveRewardPerWave: 3,
  killRewardMultiplier: 0.5,
  spellGaugeMultiplier: 1.5,
  availableTowers: ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'magnetar'],
  availableNebulae: ['orion', 'horsehead', 'pleiades', 'ring', 'crab'],
};

export function getEnemyPool(wave: number): string[] {
  const pool = ['asteroid', 'comet'];
  if (wave >= 6) pool.push('rogue_planet');
  if (wave >= 11) pool.push('dark_matter');
  if (wave >= 16) pool.push('quasar');
  if (wave >= 21) pool.push('antimatter_storm');
  if (wave >= 25) pool.push('entropy');
  return pool;
}

export interface ExtinctionBossDef {
  nameKo: string;
  baseEnemyId: string;
  hpMultiplier: number;
  specialType: 'tower_destroyer' | 'projectile_absorber' | 'tower_disabler';
  specialRadius: number;
}

export const EXTINCTION_BOSSES: ExtinctionBossDef[] = [
  { nameKo: '빅 크런치', baseEnemyId: 'entropy', hpMultiplier: 5, specialType: 'tower_destroyer', specialRadius: 1.5 },
  { nameKo: '거대 인력', baseEnemyId: 'entropy', hpMultiplier: 8, specialType: 'projectile_absorber', specialRadius: 2 },
  { nameKo: '열사의 사자', baseEnemyId: 'entropy', hpMultiplier: 12, specialType: 'tower_disabler', specialRadius: 2.5 },
];
