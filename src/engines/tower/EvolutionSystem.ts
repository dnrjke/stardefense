import { TOWER_DEFS, type TowerDef } from '@/shared/data/TowerData';

export interface EvolutionPath {
  targetId: string;
  nameKo: string;
  cost: number;
  description: string;
}

export interface EvolutionDef {
  level: number;
  paths: EvolutionPath[];
}

export const EVOLUTION_TREE: Record<string, EvolutionDef> = {
  sol: { level: 1, paths: [
    { targetId: 'subgiant', nameKo: '준거성', cost: 80, description: '사거리↑ 데미지 소폭↑' },
    { targetId: 'white_dwarf', nameKo: '백색왜성', cost: 100, description: '사거리↓ 데미지×3 관통' },
  ]},
  proxima: { level: 1, paths: [
    { targetId: 'flare_star', nameKo: '플레어 성', cost: 70, description: '속사 + 주기적 범위 폭발' },
    { targetId: 'binary_system', nameKo: '연성계', cost: 60, description: '2연발 (각 70% 데미지)' },
  ]},
  sirius: { level: 1, paths: [
    { targetId: 'sirius_b', nameKo: '시리우스 B', cost: 100, description: '장갑 관통+5 데미지↑' },
    { targetId: 'a_supergiant', nameKo: 'A형 초거성', cost: 120, description: '사거리↑ 주변 타워 버프' },
  ]},
  rigel: { level: 1, paths: [
    { targetId: 'blue_supergiant', nameKo: '청색 초거성', cost: 130, description: '데미지×1.8 사거리+1' },
    { targetId: 'red_supergiant', nameKo: '적색 초거성', cost: 100, description: '스플래시 반경 1.0 추가' },
  ]},
  betelgeuse: { level: 1, paths: [
    { targetId: 'pre_supernova', nameKo: '초신성 전조', cost: 80, description: '3웨이브 폭발 반경·데미지↑ 잔해 강화' },
    { targetId: 'pulsating_variable', nameKo: '맥동 변광성', cost: 90, description: '폭발 무기한 연기, 지속 범위 펄스' },
  ]},
  wolf_rayet: { level: 1, paths: [
    { targetId: 'wc_type', nameKo: 'WC형', cost: 100, description: '스플래시↑ 범위 피해↑ 공속↓' },
    { targetId: 'wn_type', nameKo: 'WN형', cost: 110, description: '직격↑ 공속↑ 스플래시↓' },
  ]},
  magnetar: { level: 1, paths: [
    { targetId: 'sgr_repeater', nameKo: 'SGR 반복체', cost: 120, description: '주기적 관통 감마선 버스트' },
    { targetId: 'millisecond_pulsar', nameKo: '밀리초 펄서', cost: 100, description: '공속×3 데미지×0.4' },
  ]},
  // Lv2 → Lv3 paths (only select Lv2 towers can evolve further)
  subgiant: { level: 2, paths: [
    { targetId: 'planetary_nebula', nameKo: '행성상 성운', cost: 80, description: '적 방어력-5 디버프 오라' },
  ]},
  white_dwarf: { level: 2, paths: [
    { targetId: 'supernova_remnant', nameKo: '초신성 잔해', cost: 60, description: 'Ia형 초신성 → DoT 영역' },
  ]},
  blue_supergiant: { level: 2, paths: [
    { targetId: 'black_hole', nameKo: '블랙홀', cost: 150, description: '근접 즉사' },
  ]},
  red_supergiant: { level: 2, paths: [
    { targetId: 'supernova_remnant', nameKo: '초신성 잔해', cost: 60, description: '폭발 후 DoT 영역' },
  ]},
  pulsating_variable: { level: 2, paths: [
    { targetId: 'ohir_star', nameKo: 'OH/IR 성', cost: 80, description: '먼지 껍질 — 적 방어력-5 오라' },
  ]},
  millisecond_pulsar: { level: 2, paths: [
    { targetId: 'pulsar', nameKo: '펄서', cost: 100, description: '360° 넉백+기절' },
  ]},
  sgr_repeater: { level: 2, paths: [
    { targetId: 'black_hole', nameKo: '블랙홀', cost: 150, description: '근접 즉사' },
  ]},
};

export function getEvolutionCost(baseDef: TowerDef, path: EvolutionPath): number {
  const costRatio = baseDef.cost / 50;
  return Math.round(path.cost * costRatio);
}

export function computeEvolvedDef(baseDef: TowerDef, targetId: string): TowerDef {
  const target = TOWER_DEFS[targetId];
  if (!target) return baseDef;

  switch (targetId) {
    // Sol → Subgiant: range+1, damage+30%, attackRate same
    case 'subgiant':
      return {
        ...target, id: `${baseDef.id}_subgiant`,
        nameKo: `${baseDef.nameKo} 준거성`,
        ci: target.ci, damage: Math.round(baseDef.damage * 1.3),
        attackRate: baseDef.attackRate, range: baseDef.range + 1,
        projectileSpeed: baseDef.projectileSpeed,
      };

    // Sol → White Dwarf: range=2, damage×3
    case 'white_dwarf':
      return {
        ...target, id: `${baseDef.id}_white_dwarf`,
        nameKo: `${baseDef.nameKo} 백색왜성`,
        ci: target.ci, damage: baseDef.damage * 3,
        attackRate: baseDef.attackRate, range: 2,
        projectileSpeed: target.projectileSpeed,
      };

    // Proxima → Flare Star: keep base stats + periodic flare (handled by specialType)
    case 'flare_star':
      return {
        ...target, id: `${baseDef.id}_flare_star`,
        nameKo: `${baseDef.nameKo} 플레어`,
        ci: target.ci, damage: baseDef.damage,
        attackRate: baseDef.attackRate, range: baseDef.range + 0.5,
        projectileSpeed: baseDef.projectileSpeed,
      };

    // Proxima → Binary: dual shot at 70% each (handled by specialType)
    case 'binary_system':
      return {
        ...target, id: `${baseDef.id}_binary`,
        nameKo: `${baseDef.nameKo} 연성계`,
        ci: target.ci, damage: Math.round(baseDef.damage * 0.7),
        attackRate: baseDef.attackRate * 1.1, range: baseDef.range,
        projectileSpeed: baseDef.projectileSpeed,
      };

    // Sirius → Sirius B: damage+40%, armor penetration (via armorDebuff on def)
    case 'sirius_b':
      return {
        ...target, id: `${baseDef.id}_sirius_b`,
        nameKo: `${baseDef.nameKo} B`,
        ci: target.ci, damage: Math.round(baseDef.damage * 1.4),
        attackRate: baseDef.attackRate, range: baseDef.range,
        projectileSpeed: target.projectileSpeed, armorDebuff: 5,
      };

    // Sirius → A-Supergiant: range+1.5, attackRate×0.7 (buff aura handled by specialType)
    case 'a_supergiant':
      return {
        ...target, id: `${baseDef.id}_a_supergiant`,
        nameKo: `${baseDef.nameKo} 초거성`,
        ci: target.ci, damage: baseDef.damage,
        attackRate: baseDef.attackRate * 0.7, range: baseDef.range + 1.5,
        projectileSpeed: baseDef.projectileSpeed,
      };

    // Rigel → Blue Supergiant: damage×1.8, range+1, attackRate×0.6
    case 'blue_supergiant':
      return {
        ...target, id: `${baseDef.id}_blue_supergiant`,
        nameKo: `${baseDef.nameKo} 청색초거성`,
        ci: target.ci, damage: Math.round(baseDef.damage * 1.8),
        attackRate: baseDef.attackRate * 0.6, range: baseDef.range + 1,
        projectileSpeed: baseDef.projectileSpeed,
      };

    // Rigel → Red Supergiant: keep damage, add splash
    case 'red_supergiant':
      return {
        ...target, id: `${baseDef.id}_red_supergiant`,
        nameKo: `${baseDef.nameKo} 적색초거성`,
        ci: target.ci, damage: baseDef.damage,
        attackRate: baseDef.attackRate, range: baseDef.range,
        projectileSpeed: baseDef.projectileSpeed,
        splashRadius: target.splashRadius,
      };

    // Betelgeuse → Pre-Supernova: shorter fuse (3 waves), keep base attack, bigger explosion
    case 'pre_supernova':
      return {
        ...target, id: `${baseDef.id}_pre_supernova`,
        nameKo: `${baseDef.nameKo} 전조`,
        ci: target.ci, damage: Math.round(baseDef.damage * 1.5),
        attackRate: baseDef.attackRate, range: baseDef.range + 0.5,
        projectileSpeed: baseDef.projectileSpeed,
        wavesUntilExplosion: 3,
      };

    // Betelgeuse → Pulsating Variable: no explosion, periodic AoE (handled by specialType)
    case 'pulsating_variable':
      return {
        ...target, id: `${baseDef.id}_pulsating_variable`,
        nameKo: `${baseDef.nameKo} 변광성`,
        ci: target.ci, damage: 30, attackRate: 0, range: 2,
        projectileSpeed: 0, noAttack: true,
      };

    // WR → WC: bigger splash, slower
    case 'wc_type':
      return {
        ...target, id: `${baseDef.id}_wc`,
        nameKo: `${baseDef.nameKo} WC`,
        ci: target.ci, damage: baseDef.damage,
        attackRate: baseDef.attackRate * 0.7, range: baseDef.range,
        projectileSpeed: baseDef.projectileSpeed,
        splashRadius: 2.0,
      };

    // WR → WN: smaller splash, higher damage, faster
    case 'wn_type':
      return {
        ...target, id: `${baseDef.id}_wn`,
        nameKo: `${baseDef.nameKo} WN`,
        ci: target.ci, damage: Math.round(baseDef.damage * 1.5),
        attackRate: baseDef.attackRate * 1.4, range: baseDef.range,
        projectileSpeed: baseDef.projectileSpeed,
        splashRadius: 1.0,
      };

    // Magnetar → SGR Repeater: periodic burst (handled by specialType)
    case 'sgr_repeater':
      return {
        ...target, id: `${baseDef.id}_sgr`,
        nameKo: `${baseDef.nameKo} SGR`,
        ci: target.ci, damage: baseDef.damage,
        attackRate: baseDef.attackRate, range: baseDef.range,
        projectileSpeed: baseDef.projectileSpeed,
      };

    // Magnetar → Millisecond Pulsar: attackRate×3, damage×0.4
    case 'millisecond_pulsar':
      return {
        ...target, id: `${baseDef.id}_ms_pulsar`,
        nameKo: `${baseDef.nameKo} 밀리초`,
        ci: target.ci, damage: Math.round(baseDef.damage * 0.4),
        attackRate: baseDef.attackRate * 3, range: baseDef.range,
        projectileSpeed: target.projectileSpeed,
      };

    // Lv3 evolutions
    case 'supernova_remnant':
    case 'planetary_nebula':
    case 'ohir_star':
      return {
        ...target, ci: (baseDef.ci + target.ci) / 2,
        range: Math.max(target.range, baseDef.range * 0.8),
      };
    case 'black_hole':
      return { ...target };
    case 'pulsar':
      return {
        ...target, range: Math.max(target.range, baseDef.range * 0.7),
      };

    default:
      return target;
  }
}

export function getEvolutions(towerId: string): EvolutionDef | null {
  if (EVOLUTION_TREE[towerId]) return EVOLUTION_TREE[towerId];
  // Evolved towers have composite IDs like "sol_subgiant" — try matching the suffix
  for (const key of Object.keys(EVOLUTION_TREE)) {
    if (towerId.endsWith(`_${key}`) || towerId === key) {
      return EVOLUTION_TREE[key];
    }
  }
  return null;
}
