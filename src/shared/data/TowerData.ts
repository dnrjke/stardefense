export interface TowerDef {
  id: string;
  name: string;
  nameKo: string;
  spectralType: string;
  ci: number;
  damage: number;
  attackRate: number;   // attacks per second
  range: number;        // in tiles
  cost: number;         // ISM
  projectileSpeed: number;
  specialType?: 'betelgeuse' | 'supernova_remnant' | 'planetary_nebula' | 'black_hole' | 'pulsar' | 'magnetar' | 'flare_star' | 'binary_system' | 'a_supergiant' | 'pulsating_variable' | 'sgr_repeater';
  wavesUntilExplosion?: number;
  explosionRadius?: number;      // supernova blast radius in tiles (betelgeuse line)
  explosionDamageMult?: number;  // blast damage = damage × mult, so damage buffs scale the blast
  remnantDamage?: number;        // DoT dps of the supernova remnant left at the blast site
  remnantRange?: number;         // radius of that remnant zone
  noAttack?: boolean;
  armorDebuff?: number;
  pulsarInterval?: number;
  pulsarKnockback?: number;
  pulsarStunDuration?: number;
  splashRadius?: number;
  descriptionKo?: string;
}

export const TOWER_DEFS: Record<string, TowerDef> = {
  sol: {
    id: 'sol',
    name: 'Sol',
    nameKo: '태양',
    spectralType: 'G2V',
    ci: 0.65,
    damage: 10,
    attackRate: 1.2,
    range: 3,
    cost: 50,
    projectileSpeed: 8,
    descriptionKo: '태양계 질량의 99.86%를 홀로 지배하는 황색왜성. 평범하지만, 그 안정성이야말로 가장 강력한 무기다.',
  },
  proxima: {
    id: 'proxima',
    name: 'Proxima',
    nameKo: '프록시마',
    spectralType: 'M5V',
    ci: 1.82,
    damage: 4,
    attackRate: 3.0,
    range: 2,
    cost: 30,
    projectileSpeed: 10,
    descriptionKo: '가장 가까운 이웃 — 4.24광년 너머에서 붉게 깜빡이는 M형 왜성. 작고 어둡지만, 치명적인 플레어를 감추고 있다.',
  },
  sirius: {
    id: 'sirius',
    name: 'Sirius',
    nameKo: '시리우스',
    spectralType: 'A1V',
    ci: 0.0,
    damage: 15,
    attackRate: 1.5,
    range: 3.5,
    cost: 80,
    projectileSpeed: 9,
    descriptionKo: '밤하늘에서 가장 밝은 별. 차갑고 정확한 A형 주계열성의 빛은, 항로를 비추는 항해자의 등대.',
  },
  rigel: {
    id: 'rigel',
    name: 'Rigel',
    nameKo: '리겔',
    spectralType: 'B8Ia',
    ci: -0.15,
    damage: 35,
    attackRate: 0.5,
    range: 5,
    cost: 120,
    projectileSpeed: 7,
    descriptionKo: '오리온의 왼발 — 태양 12만 배의 광도를 860광년 너머로 보내는 청색 초거성. 느리지만, 한 발이면 충분하다.',
  },
  betelgeuse: {
    id: 'betelgeuse',
    name: 'Betelgeuse',
    nameKo: '베텔게우스',
    spectralType: 'M1Ia',
    ci: 1.85,
    damage: 8,
    attackRate: 1.0,
    range: 2.5,
    cost: 100,
    projectileSpeed: 8,
    specialType: 'betelgeuse',
    wavesUntilExplosion: 5,
    explosionRadius: 3,
    explosionDamageMult: 12.5,
    remnantDamage: 3,
    remnantRange: 1.5,
    descriptionKo: '2,000년 전에는 노란 별이었다. 초신성 전야를 사는 적색초거성 — 폭발은 끝이 아니라, 잔해 성운으로 이어지는 순환의 시작이다.',
  },
  red_giant: {
    id: 'red_giant',
    name: 'Red Giant',
    nameKo: '적색거성',
    spectralType: 'M2III',
    ci: 1.5,
    damage: 0,
    attackRate: 0,
    range: 0,
    cost: 80,
    projectileSpeed: 8,
    descriptionKo: '주계열을 떠난 별의 첫 번째 변신. 부풀어 오른 외피는 은은하지만, 품 안의 헬륨 핵은 뜨겁다.',
  },
  blue_giant: {
    id: 'blue_giant',
    name: 'Blue Giant',
    nameKo: '청색거성',
    spectralType: 'B1III',
    ci: -0.35,
    damage: 0,
    attackRate: 0,
    range: 0,
    cost: 120,
    projectileSpeed: 9,
    descriptionKo: '질량과 광도의 극한 — 수백만 년의 격렬한 삶을 택한 별. 짧지만 찬란하게.',
  },
  supernova_remnant: {
    id: 'supernova_remnant',
    name: 'Supernova Remnant',
    nameKo: '초신성 잔해',
    spectralType: 'SNR',
    ci: 0.8,
    damage: 5,
    attackRate: 2.0,
    range: 2.5,
    cost: 60,
    projectileSpeed: 0,
    specialType: 'supernova_remnant',
    noAttack: true,
    descriptionKo: '별의 죽음이 남긴 잔해. 팽창하는 충격파가 주변을 영원히 불태운다.',
  },
  planetary_nebula: {
    id: 'planetary_nebula',
    name: 'Planetary Nebula',
    nameKo: '행성상 성운',
    spectralType: 'PN',
    ci: 0.3,
    damage: 0,
    attackRate: 0,
    range: 3.0,
    cost: 80,
    projectileSpeed: 0,
    specialType: 'planetary_nebula',
    noAttack: true,
    armorDebuff: 5,
    descriptionKo: '별의 마지막 숨결이 빚은 빛의 고리. 50억 년 뒤 태양의 운명을 예고한다.',
  },
  ohir_star: {
    id: 'ohir_star',
    name: 'OH/IR Star',
    nameKo: 'OH/IR 성',
    spectralType: 'M5Ia OH/IR',
    ci: 2.2,
    damage: 0,
    attackRate: 0,
    range: 3.0,
    cost: 80,
    projectileSpeed: 0,
    specialType: 'planetary_nebula',
    noAttack: true,
    armorDebuff: 5,
    descriptionKo: '두꺼운 먼지 고치에 스스로를 파묻은 극대거성. 항성풍이 흩뿌린 먼지가 적의 장갑을 삭인다.',
  },
  black_hole: {
    id: 'black_hole',
    name: 'Black Hole',
    nameKo: '블랙홀',
    spectralType: 'BH',
    ci: -0.4,
    damage: 9999,
    attackRate: 10,
    range: 1.0,
    cost: 150,
    projectileSpeed: 0,
    specialType: 'black_hole',
    noAttack: true,
    descriptionKo: '빛조차 탈출할 수 없는 시공간의 특이점. 사건의 지평선 안에서는 어떤 존재도 예외 없다.',
  },
  pulsar: {
    id: 'pulsar',
    name: 'Neutron Star/Pulsar',
    nameKo: '펄서',
    spectralType: 'NS',
    ci: -0.1,
    damage: 5,
    attackRate: 0,
    range: 3.0,
    cost: 100,
    projectileSpeed: 0,
    specialType: 'pulsar',
    noAttack: true,
    pulsarInterval: 2.0,
    pulsarKnockback: 0.5,
    pulsarStunDuration: 0.5,
    descriptionKo: '초당 수백 회 자전하는 중성자별의 등대. 정밀한 중력파 펄스로 항로를 교란한다.',
  },
  wolf_rayet: {
    id: 'wolf_rayet',
    name: 'Wolf-Rayet',
    nameKo: '볼프-레이에',
    spectralType: 'WN8',
    ci: -0.3,
    damage: 40,
    attackRate: 0.35,
    range: 3.5,
    cost: 140,
    projectileSpeed: 6,
    splashRadius: 1.5,
    descriptionKo: '태양 질량의 수십 배를 지닌 극한 질량 별. 초속 2,000km의 항성풍이 주변 수 파섹을 깎아내며, 그 폭풍 속에서 별의 외피가 벗겨져 뜨거운 핵이 드러난다.',
  },
  magnetar: {
    id: 'magnetar',
    name: 'Magnetar',
    nameKo: '마그네타',
    spectralType: 'SGR',
    ci: -0.15,
    damage: 20,
    attackRate: 0.8,
    range: 4.0,
    cost: 150,
    projectileSpeed: 12,
    specialType: 'magnetar',
    descriptionKo: '우주에서 가장 강력한 자기장을 지닌 중성자별. 그 자기 펄스는 행성의 지각을 녹일 수 있다.',
  },

  // Sol Lv2 paths
  subgiant: {
    id: 'subgiant', name: 'Subgiant', nameKo: '준거성',
    spectralType: 'G-IV', ci: 0.8, damage: 0, attackRate: 0, range: 0,
    cost: 80, projectileSpeed: 8,
    descriptionKo: '주계열을 떠나 팽창을 시작한 태양형 별. 사거리가 넓어지고 위력이 소폭 증가한다.',
  },
  white_dwarf: {
    id: 'white_dwarf', name: 'White Dwarf', nameKo: '백색왜성',
    spectralType: 'DA', ci: -0.1, damage: 0, attackRate: 0, range: 0,
    cost: 100, projectileSpeed: 10,
    descriptionKo: '초고밀도로 압축된 별의 잔해. 작지만 관통력이 극한에 달한다.',
  },

  // Proxima Lv2 paths
  flare_star: {
    id: 'flare_star', name: 'Flare Star', nameKo: '플레어 성',
    spectralType: 'M5Ve', ci: 1.82, damage: 0, attackRate: 0, range: 0,
    cost: 70, projectileSpeed: 10,
    specialType: 'flare_star',
    descriptionKo: '격렬한 자기 활동이 주기적 플레어 폭발을 일으킨다.',
  },
  binary_system: {
    id: 'binary_system', name: 'Binary System', nameKo: '연성계',
    spectralType: 'M5V+M5V', ci: 1.82, damage: 0, attackRate: 0, range: 0,
    cost: 60, projectileSpeed: 10,
    specialType: 'binary_system',
    descriptionKo: '알파 센타우리 삼중성계처럼, 두 별이 서로를 돌며 이중 사격한다.',
  },

  // Sirius Lv2 paths
  sirius_b: {
    id: 'sirius_b', name: 'Sirius B', nameKo: '시리우스 B',
    spectralType: 'DA2', ci: -0.05, damage: 0, attackRate: 0, range: 0,
    cost: 100, projectileSpeed: 11,
    descriptionKo: '시리우스의 동반 백색왜성. 초고밀도 물질의 사격은 어떤 장갑도 관통한다.',
  },
  a_supergiant: {
    id: 'a_supergiant', name: 'A-Supergiant', nameKo: 'A형 초거성',
    spectralType: 'A1Ia', ci: 0.0, damage: 0, attackRate: 0, range: 0,
    cost: 120, projectileSpeed: 9,
    specialType: 'a_supergiant',
    descriptionKo: '밤하늘에서 가장 밝은 별이 초거성으로 팽창하며 주변 타워를 고무한다.',
  },

  // Rigel Lv2 paths
  blue_supergiant: {
    id: 'blue_supergiant', name: 'Blue Supergiant', nameKo: '청색 초거성',
    spectralType: 'B0Ia', ci: -0.25, damage: 0, attackRate: 0, range: 0,
    cost: 130, projectileSpeed: 7,
    descriptionKo: '태양의 40만 배 광도. 극한의 원샷 — 느리지만 한 발이면 충분하다.',
  },
  red_supergiant: {
    id: 'red_supergiant', name: 'Red Supergiant', nameKo: '적색 초거성',
    spectralType: 'M2Ia', ci: 1.6, damage: 0, attackRate: 0, range: 0,
    cost: 100, projectileSpeed: 6, splashRadius: 1.0,
    descriptionKo: '팽창한 외피가 적을 휩쓸며, 리겔의 화력에 범위 공격이 더해진다.',
  },

  // Betelgeuse Lv2 paths
  pre_supernova: {
    id: 'pre_supernova', name: 'Pre-Supernova', nameKo: '초신성 전조',
    spectralType: 'M0Ia', ci: 1.7, damage: 0, attackRate: 0, range: 0,
    cost: 80, projectileSpeed: 8,
    specialType: 'betelgeuse', wavesUntilExplosion: 3,
    explosionRadius: 4, explosionDamageMult: 12.5,
    remnantDamage: 5, remnantRange: 2.5,
    descriptionKo: '핵의 규소 연소가 시작되었다. 폭발이 임박했으며, 더 크게 터지고 더 짙은 잔해를 남긴다.',
  },
  pulsating_variable: {
    id: 'pulsating_variable', name: 'Pulsating Variable', nameKo: '맥동 변광성',
    spectralType: 'M2Ia-var', ci: 1.5, damage: 0, attackRate: 0, range: 0,
    cost: 90, projectileSpeed: 0,
    specialType: 'pulsating_variable', noAttack: true,
    descriptionKo: '폭발 대신 주기적 에너지 펄스를 선택한 변광성. 지속적인 범위 데미지.',
  },

  // Wolf-Rayet Lv2 paths
  wc_type: {
    id: 'wc_type', name: 'WC-Type', nameKo: 'WC형',
    spectralType: 'WC7', ci: -0.3, damage: 0, attackRate: 0, range: 0,
    cost: 100, projectileSpeed: 5, splashRadius: 2.0,
    descriptionKo: '탄소 풍부 항성풍의 광역 침식. 스플래시 반경이 확대되고 범위 피해가 증가한다.',
  },
  wn_type: {
    id: 'wn_type', name: 'WN-Type', nameKo: 'WN형',
    spectralType: 'WN4', ci: -0.35, damage: 0, attackRate: 0, range: 0,
    cost: 110, projectileSpeed: 7, splashRadius: 1.0,
    descriptionKo: '질소 방출선의 집중된 에너지. 직격 데미지가 크게 증가하고 공속이 빨라진다.',
  },

  // Magnetar Lv2 paths
  sgr_repeater: {
    id: 'sgr_repeater', name: 'SGR Repeater', nameKo: 'SGR 반복체',
    spectralType: 'SGR-R', ci: -0.15, damage: 0, attackRate: 0, range: 0,
    cost: 120, projectileSpeed: 15,
    specialType: 'sgr_repeater',
    descriptionKo: '주기적으로 감마선 버스트를 방출하는 소프트 감마선 반복체.',
  },
  millisecond_pulsar: {
    id: 'millisecond_pulsar', name: 'Millisecond Pulsar', nameKo: '밀리초 펄서',
    spectralType: 'MSP', ci: -0.1, damage: 0, attackRate: 0, range: 0,
    cost: 100, projectileSpeed: 14,
    descriptionKo: '초당 수백 회 자전하는 극한의 펄서. 약하지만 미친 속도로 사격한다.',
  },
};
