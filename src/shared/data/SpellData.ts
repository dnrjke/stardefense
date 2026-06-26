export interface SpellDef {
  id: string;
  name: string;
  nameKo: string;
  gaugeCost: number;
  description: string;
  cooldown: number;
}

export const SPELL_DEFS: Record<string, SpellDef> = {
  supernova_flare: {
    id: 'supernova_flare',
    name: 'Supernova Flare',
    nameKo: '초신성 플레어',
    gaugeCost: 50,
    description: '전체 맵에 100 데미지',
    cooldown: 30,
  },
  gravity_wave: {
    id: 'gravity_wave',
    name: 'Gravity Wave',
    nameKo: '중력파',
    gaugeCost: 30,
    description: '모든 적 3초 감속 50%',
    cooldown: 20,
  },
};
