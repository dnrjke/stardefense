import type { TowerDef } from '@/shared/data/TowerData';

/** Visual category for role badge coloring */
export type TowerRoleCategory =
  | 'balance'
  | 'rapid'
  | 'sniper'
  | 'burst'
  | 'splash'
  | 'support'
  | 'utility'
  | 'trap';

export interface TowerRoleTag {
  label: string;
  category: TowerRoleCategory;
}

const CATEGORY_STYLE: Record<TowerRoleCategory, { bg: string; border: string; color: string }> = {
  balance: { bg: 'rgba(90,130,190,0.2)', border: 'rgba(120,160,210,0.55)', color: '#b8d4ff' },
  rapid: { bg: 'rgba(255,150,60,0.18)', border: 'rgba(255,170,90,0.5)', color: '#ffc48a' },
  sniper: { bg: 'rgba(60,170,255,0.18)', border: 'rgba(90,190,255,0.5)', color: '#9ee0ff' },
  burst: { bg: 'rgba(255,90,90,0.18)', border: 'rgba(255,120,120,0.5)', color: '#ffaaaa' },
  splash: { bg: 'rgba(255,190,70,0.18)', border: 'rgba(255,210,100,0.5)', color: '#ffe08a' },
  support: { bg: 'rgba(80,210,130,0.18)', border: 'rgba(100,230,150,0.5)', color: '#9ef0b8' },
  utility: { bg: 'rgba(170,120,255,0.18)', border: 'rgba(190,150,255,0.5)', color: '#d4b8ff' },
  trap: { bg: 'rgba(200,80,180,0.18)', border: 'rgba(220,110,200,0.5)', color: '#f0a8e8' },
};

/** Player-facing role labels — one short phrase per tower */
export const TOWER_ROLE_TAGS: Record<string, TowerRoleTag> = {
  // Lv1
  sol: { label: '올라운더', category: 'balance' },
  proxima: { label: '속사', category: 'rapid' },
  sirius: { label: '메인 딜러', category: 'balance' },
  rigel: { label: '스나이퍼', category: 'sniper' },
  betelgeuse: { label: '초신성 순환', category: 'burst' },
  wolf_rayet: { label: '스플래시', category: 'splash' },
  magnetar: { label: '스텔스 감지', category: 'utility' },

  // Sol Lv2
  subgiant: { label: '원거리 딜러', category: 'balance' },
  white_dwarf: { label: '고화력', category: 'sniper' },

  // Proxima Lv2
  flare_star: { label: '속사·범위', category: 'rapid' },
  binary_system: { label: '2연발', category: 'rapid' },

  // Sirius Lv2
  sirius_b: { label: '장갑 관통', category: 'utility' },
  a_supergiant: { label: '버프 오라', category: 'support' },

  // Rigel Lv2
  blue_supergiant: { label: '원샷', category: 'sniper' },
  red_supergiant: { label: '스플래시', category: 'splash' },

  // Betelgeuse Lv2
  pre_supernova: { label: '임박 초신성', category: 'burst' },
  pulsating_variable: { label: '범위 펄스', category: 'splash' },

  // Wolf-Rayet Lv2
  wc_type: { label: '광역 스플래시', category: 'splash' },
  wn_type: { label: '고속 딜러', category: 'rapid' },

  // Magnetar Lv2
  sgr_repeater: { label: '관통 버스트', category: 'utility' },
  millisecond_pulsar: { label: '극속 연사', category: 'rapid' },

  // Lv3 / final
  supernova_remnant: { label: 'DoT 장판', category: 'trap' },
  planetary_nebula: { label: '디버프 오라', category: 'support' },
  ohir_star: { label: '먼지 디버프', category: 'support' },
  black_hole: { label: '즉사 존', category: 'trap' },
  pulsar: { label: '넉백·기절', category: 'utility' },

  // Legacy v1 evolutions
  red_giant: { label: '장거리 거인', category: 'balance' },
  blue_giant: { label: '고화력', category: 'sniper' },
};

const SPECIAL_TYPE_FALLBACK: Record<string, TowerRoleTag> = {
  betelgeuse: { label: '초신성 순환', category: 'burst' },
  magnetar: { label: '스텔스 감지', category: 'utility' },
  flare_star: { label: '속사·범위', category: 'rapid' },
  binary_system: { label: '2연발', category: 'rapid' },
  a_supergiant: { label: '버프 오라', category: 'support' },
  pulsating_variable: { label: '범위 펄스', category: 'splash' },
  sgr_repeater: { label: '관통 버스트', category: 'utility' },
  supernova_remnant: { label: 'DoT 장판', category: 'trap' },
  planetary_nebula: { label: '디버프 오라', category: 'support' },
  black_hole: { label: '즉사 존', category: 'trap' },
  pulsar: { label: '넉백·기절', category: 'utility' },
};

export function getTowerRoleTag(towerId: string, def?: TowerDef): TowerRoleTag | null {
  const direct = TOWER_ROLE_TAGS[towerId];
  if (direct) return direct;

  if (def?.specialType && SPECIAL_TYPE_FALLBACK[def.specialType]) {
    return SPECIAL_TYPE_FALLBACK[def.specialType];
  }

  if (def?.splashRadius && def.splashRadius > 0) {
    return { label: '스플래시', category: 'splash' };
  }

  if (def?.noAttack) {
    return { label: '특수 장판', category: 'trap' };
  }

  return null;
}

export function getRoleTagStyle(category: TowerRoleCategory) {
  return CATEGORY_STYLE[category];
}
