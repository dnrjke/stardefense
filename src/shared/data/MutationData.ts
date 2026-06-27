export interface MutationDef {
  id: string;
  nameKo: string;
  description: string;
  category: 'enemy_buff' | 'tower_nerf' | 'economy' | 'nebula_nerf' | 'reward' | 'mixed';
  enemyHpMult?: number;
  enemySpeedMult?: number;
  enemyArmorAdd?: number;
  towerDamageMult?: number;
  towerRangeMult?: number;
  towerAttackRateMult?: number;
  projectileSpeedMult?: number;
  waveRewardMult?: number;
  killRewardMult?: number;
  nebulaMult?: number;
  spellGaugeMult?: number;
  towerCostMult?: number;
  stealthFreqMult?: number;
  critChance?: number;
  critMultiplier?: number;
  betelgeuseExplosionMult?: number;
  betelgeuseTimerOverride?: number;
  quantumTunneling?: boolean;
  temporaryWaves?: number;
}

export const MUTATION_DEFS: Record<string, MutationDef> = {
  thermal_expansion: {
    id: 'thermal_expansion',
    nameKo: '열팽창',
    description: '적 체력 30% 증가',
    category: 'enemy_buff',
    enemyHpMult: 1.3,
  },
  redshift: {
    id: 'redshift',
    nameKo: '적색편이',
    description: '적 이동속도 20% 증가',
    category: 'enemy_buff',
    enemySpeedMult: 1.2,
  },
  dark_energy: {
    id: 'dark_energy',
    nameKo: '암흑에너지',
    description: '암흑물질 출현 빈도 2배',
    category: 'enemy_buff',
    stealthFreqMult: 2,
  },
  quantum_tunneling: {
    id: 'quantum_tunneling',
    nameKo: '양자 터널링',
    description: '적 10%가 성운 효과 무시',
    category: 'nebula_nerf',
    quantumTunneling: true,
  },
  interstellar_erosion: {
    id: 'interstellar_erosion',
    nameKo: '성간 풍화',
    description: '타워 사거리 15% 감소',
    category: 'tower_nerf',
    towerRangeMult: 0.85,
  },
  neutron_decay: {
    id: 'neutron_decay',
    nameKo: '중성자 감쇠',
    description: '타워 공격력 10% 감소',
    category: 'tower_nerf',
    towerDamageMult: 0.9,
  },
  resource_depletion: {
    id: 'resource_depletion',
    nameKo: '자원 고갈',
    description: '웨이브 보상 30% 감소, 킬 보상 20% 증가',
    category: 'economy',
    waveRewardMult: 0.7,
    killRewardMult: 1.2,
  },
  nebula_collapse: {
    id: 'nebula_collapse',
    nameKo: '성운 붕괴',
    description: '성운 효과 25% 감소',
    category: 'nebula_nerf',
    nebulaMult: 0.75,
  },
  supernova_afterglow: {
    id: 'supernova_afterglow',
    nameKo: '초신성 잔광',
    description: '베텔게우스 폭발 피해 2배, 타이머 3초로 단축',
    category: 'mixed',
    betelgeuseExplosionMult: 2,
    betelgeuseTimerOverride: 3,
  },
  stellar_cradle: {
    id: 'stellar_cradle',
    nameKo: '별의 요람',
    description: '5웨이브 동안 타워 비용 40% 감소',
    category: 'economy',
    towerCostMult: 0.6,
    temporaryWaves: 5,
  },
  gravitational_resonance: {
    id: 'gravitational_resonance',
    nameKo: '중력파 공명',
    description: '스펠 게이지 충전 30% 증가',
    category: 'reward',
    spellGaugeMult: 1.3,
  },
  spacetime_warp: {
    id: 'spacetime_warp',
    nameKo: '시공간 왜곡',
    description: '타워 공격력 25% 증가, 적 장갑 +5',
    category: 'mixed',
    towerDamageMult: 1.25,
    enemyArmorAdd: 5,
  },
  stellar_wind: {
    id: 'stellar_wind',
    nameKo: '항성풍 가속',
    description: '투사체 속도 2배, 공격속도 20% 감소',
    category: 'mixed',
    projectileSpeedMult: 2,
    towerAttackRateMult: 0.8,
  },
  photon_burst: {
    id: 'photon_burst',
    nameKo: '광자 폭주',
    description: '치명타 확률 20%, 치명타 피해 3배, 기본 피해 15% 감소',
    category: 'mixed',
    critChance: 0.2,
    critMultiplier: 3,
    towerDamageMult: 0.85,
  },
  cosmic_inflation: {
    id: 'cosmic_inflation',
    nameKo: '우주 팽창',
    description: '적 장갑 +3, 이동속도 10% 증가',
    category: 'enemy_buff',
    enemyArmorAdd: 3,
    enemySpeedMult: 1.1,
  },
};

export interface MutationModifiers {
  enemyHpMult: number;
  enemySpeedMult: number;
  enemyArmorAdd: number;
  towerDamageMult: number;
  towerRangeMult: number;
  towerAttackRateMult: number;
  projectileSpeedMult: number;
  waveRewardMult: number;
  killRewardMult: number;
  nebulaMult: number;
  spellGaugeMult: number;
  towerCostMult: number;
  stealthFreqMult: number;
  critChance: number;
  critMultiplier: number;
}

export function computeMutationModifiers(activeMutations: string[]): MutationModifiers {
  const mods: MutationModifiers = {
    enemyHpMult: 1,
    enemySpeedMult: 1,
    enemyArmorAdd: 0,
    towerDamageMult: 1,
    towerRangeMult: 1,
    towerAttackRateMult: 1,
    projectileSpeedMult: 1,
    waveRewardMult: 1,
    killRewardMult: 1,
    nebulaMult: 1,
    spellGaugeMult: 1,
    towerCostMult: 1,
    stealthFreqMult: 1,
    critChance: 0,
    critMultiplier: 1,
  };

  for (const id of activeMutations) {
    const def = MUTATION_DEFS[id];
    if (!def) continue;
    if (def.enemyHpMult != null) mods.enemyHpMult *= def.enemyHpMult;
    if (def.enemySpeedMult != null) mods.enemySpeedMult *= def.enemySpeedMult;
    if (def.enemyArmorAdd != null) mods.enemyArmorAdd += def.enemyArmorAdd;
    if (def.towerDamageMult != null) mods.towerDamageMult *= def.towerDamageMult;
    if (def.towerRangeMult != null) mods.towerRangeMult *= def.towerRangeMult;
    if (def.towerAttackRateMult != null) mods.towerAttackRateMult *= def.towerAttackRateMult;
    if (def.projectileSpeedMult != null) mods.projectileSpeedMult *= def.projectileSpeedMult;
    if (def.waveRewardMult != null) mods.waveRewardMult *= def.waveRewardMult;
    if (def.killRewardMult != null) mods.killRewardMult *= def.killRewardMult;
    if (def.nebulaMult != null) mods.nebulaMult *= def.nebulaMult;
    if (def.spellGaugeMult != null) mods.spellGaugeMult *= def.spellGaugeMult;
    if (def.towerCostMult != null) mods.towerCostMult *= def.towerCostMult;
    if (def.stealthFreqMult != null) mods.stealthFreqMult *= def.stealthFreqMult;
    if (def.critChance != null) mods.critChance += def.critChance;
    if (def.critMultiplier != null && def.critMultiplier > mods.critMultiplier) {
      mods.critMultiplier = def.critMultiplier;
    }
  }

  return mods;
}

export function pickRandomMutations(activeMutations: string[], count: number): MutationDef[] {
  const allIds = Object.keys(MUTATION_DEFS);
  const available = allIds.filter((id) => !activeMutations.includes(id));
  const picked: MutationDef[] = [];

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    picked.push(MUTATION_DEFS[available[idx]]);
    available.splice(idx, 1);
  }

  return picked;
}
