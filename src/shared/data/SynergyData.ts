export type SynergyType = 'resonance' | 'formation';

export interface SynergyDef {
  id: string;
  nameKo: string;
  type: SynergyType;
  description: string;
}

// === Resonance (성좌 공명) — tower combo on field ===

export interface ResonanceDef extends SynergyDef {
  type: 'resonance';
  requiredTowers?: string[];
  condition?: 'main_sequence' | 'stellar_recycling' | 'extreme_magnetosphere';
}

export const RESONANCE_DEFS: ResonanceDef[] = [
  {
    id: 'winter_triangle',
    nameKo: '겨울 대삼각',
    type: 'resonance',
    description: 'Sol + Sirius + Proxima → 3타워 공속 +20%',
    requiredTowers: ['sol', 'sirius', 'proxima'],
  },
  {
    id: 'sword_of_orion',
    nameKo: '오리온의 검',
    type: 'resonance',
    description: 'Rigel + Betelgeuse → Rigel 사거리+1, Betelgeuse 폭발+30%',
    requiredTowers: ['rigel', 'betelgeuse'],
  },
  {
    id: 'main_sequence',
    nameKo: '주계열 완성',
    type: 'resonance',
    description: 'G+A+B+M형 각 1종 → 전체 데미지 +10%',
    condition: 'main_sequence',
  },
  {
    id: 'nucleosynthesis',
    nameKo: '중원소 합성',
    type: 'resonance',
    description: 'Wolf-Rayet + Betelgeuse → 둘 다 장갑 무시',
    requiredTowers: ['wolf_rayet', 'betelgeuse'],
  },
  {
    id: 'stellar_recycling',
    nameKo: '잔해 순환',
    type: 'resonance',
    description: '진화 Lv2+ 2종 이상 → 스펠 게이지 +25%',
    condition: 'stellar_recycling',
  },
  {
    id: 'extreme_magnetosphere',
    nameKo: '극한 자기장',
    type: 'resonance',
    description: 'Magnetar + Pulsar(진화) → Magnetar 감지 맵 전체',
    condition: 'extreme_magnetosphere',
  },
];

// === Formation (천체 진법) — geometric placement ===

export interface FormationDef extends SynergyDef {
  type: 'formation';
  formationType: 'binary' | 'trinary' | 'orion_belt';
}

export const FORMATION_DEFS: FormationDef[] = [
  {
    id: 'binary_star',
    nameKo: '쌍성계',
    type: 'formation',
    formationType: 'binary',
    description: '타워 2기 인접 (1타일) → 공속 +15%',
  },
  {
    id: 'trinary_star',
    nameKo: '삼중성계',
    type: 'formation',
    formationType: 'trinary',
    description: '타워 3기 삼각형 (1~2타일) → 동시 조준 +25%',
  },
  {
    id: 'orion_belt',
    nameKo: '오리온 벨트',
    type: 'formation',
    formationType: 'orion_belt',
    description: '동종 3기 일직선 → 50% 확률 직선 관통탄 (최대 3기, 관통마다 70% 감쇠)',
  },
];
