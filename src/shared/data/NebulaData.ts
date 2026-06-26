export interface NebulaDef {
  id: string;
  name: string;
  nameKo: string;
  messierType: string;
  cost: number;
  range: number;
  effect: 'attack_buff' | 'homing' | 'slow' | 'armor_debuff' | 'dot';
  effectValue: number;
  shaderColor: [number, number, number];
}

export const NEBULA_DEFS: Record<string, NebulaDef> = {
  orion: {
    id: 'orion',
    name: 'Orion Nebula',
    nameKo: '오리온 대성운',
    messierType: 'emission_nebula',
    cost: 60,
    range: 2.5,
    effect: 'attack_buff',
    effectValue: 0.3,
    shaderColor: [0.9, 0.2, 0.1],
  },
  pleiades: {
    id: 'pleiades',
    name: 'Pleiades Nebula',
    nameKo: '플레이아데스 성운',
    messierType: 'reflection_nebula',
    cost: 70,
    range: 2.0,
    effect: 'homing',
    effectValue: 1,
    shaderColor: [0.2, 0.4, 0.9],
  },
  horsehead: {
    id: 'horsehead',
    name: 'Horsehead Nebula',
    nameKo: '말머리 성운',
    messierType: 'dark_nebula',
    cost: 50,
    range: 2.0,
    effect: 'slow',
    effectValue: 0.4,
    shaderColor: [0.15, 0.08, 0.05],
  },
  ring: {
    id: 'ring',
    name: 'Ring Nebula',
    nameKo: '고리 성운',
    messierType: 'planetary_nebula',
    cost: 80,
    range: 2.0,
    effect: 'armor_debuff',
    effectValue: 5,
    shaderColor: [0.3, 0.8, 0.4],
  },
  crab: {
    id: 'crab',
    name: 'Crab Nebula',
    nameKo: '게 성운',
    messierType: 'supernova_remnant',
    cost: 70,
    range: 2.0,
    effect: 'dot',
    effectValue: 10,
    shaderColor: [0.8, 0.5, 0.1],
  },
};
