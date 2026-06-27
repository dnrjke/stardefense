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
  descriptionKo?: string;
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
    descriptionKo: '오리온의 칼집에 숨겨진 별의 요람. 수천 개의 신생 별이 이곳에서 태어나며, 그 에너지가 아군의 화력을 끌어올린다.',
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
    descriptionKo: '10만 년 전부터 인류가 \'일곱 자매\'로 불러온 밤하늘의 보석함. 코발트빛 반사 성운이 투사체의 궤적을 인도한다.',
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
    shaderColor: [0.45, 0.22, 0.15],
    descriptionKo: '오리온 알니타크 남쪽의 거대한 먼지 기둥. 배경의 빛을 삼키는 실루엣이 적의 발을 묶는다.',
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
    descriptionKo: '죽어가는 별이 남긴 마지막 숨결 — 빛의 고리. 토러스 구조의 이온화 가스가 적의 방어를 부식시킨다.',
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
    descriptionKo: '1054년 초신성의 잔해. 천 년이 지나도 팽창을 멈추지 않는 필라멘트가 적을 침식한다.',
  },
};
