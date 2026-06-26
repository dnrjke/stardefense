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
  sol:       { level: 1, paths: [
    { targetId: 'red_giant', nameKo: '적색거성', cost: 80, description: '사거리↑ 공속↓' },
    { targetId: 'blue_giant', nameKo: '청색거성', cost: 120, description: '공격력×2' },
  ]},
  proxima:   { level: 1, paths: [
    { targetId: 'red_giant', nameKo: '적색거성', cost: 80, description: '사거리↑ 공속↓' },
    { targetId: 'blue_giant', nameKo: '청색거성', cost: 120, description: '공격력×2' },
  ]},
  sirius:    { level: 1, paths: [
    { targetId: 'red_giant', nameKo: '적색거성', cost: 80, description: '사거리↑ 공속↓' },
    { targetId: 'blue_giant', nameKo: '청색거성', cost: 120, description: '공격력×2' },
  ]},
  rigel:     { level: 1, paths: [
    { targetId: 'red_giant', nameKo: '적색거성', cost: 80, description: '사거리↑ 공속↓' },
    { targetId: 'blue_giant', nameKo: '청색거성', cost: 120, description: '공격력×2' },
  ]},
  betelgeuse: { level: 1, paths: [
    { targetId: 'red_giant', nameKo: '적색거성', cost: 80, description: '사거리↑ 공속↓' },
    { targetId: 'blue_giant', nameKo: '청색거성', cost: 120, description: '공격력×2' },
  ]},
  magnetar: { level: 1, paths: [
    { targetId: 'red_giant', nameKo: '적색거성', cost: 80, description: '사거리↑ 공속↓' },
    { targetId: 'blue_giant', nameKo: '청색거성', cost: 120, description: '공격력×2' },
  ]},
  red_giant: { level: 2, paths: [
    { targetId: 'supernova_remnant', nameKo: '초신성 잔해', cost: 60, description: '폭발 후 DoT 영역' },
    { targetId: 'planetary_nebula', nameKo: '행성상 성운', cost: 80, description: '적 방어력-5 디버프' },
  ]},
  blue_giant: { level: 2, paths: [
    { targetId: 'black_hole', nameKo: '블랙홀', cost: 150, description: '근접 즉사' },
    { targetId: 'pulsar', nameKo: '펄서', cost: 100, description: '360° 넉백+기절' },
  ]},
};

export function computeEvolvedDef(baseDef: TowerDef, targetId: string): TowerDef {
  const target = TOWER_DEFS[targetId];
  if (!target) return baseDef;

  if (targetId === 'red_giant') {
    return {
      ...target,
      damage: baseDef.damage,
      attackRate: baseDef.attackRate * 0.6,
      range: baseDef.range * 1.5,
      projectileSpeed: baseDef.projectileSpeed,
    };
  }
  if (targetId === 'blue_giant') {
    return {
      ...target,
      damage: baseDef.damage * 2,
      attackRate: baseDef.attackRate,
      range: baseDef.range,
      projectileSpeed: baseDef.projectileSpeed,
    };
  }
  return target;
}

export function getEvolutions(towerId: string): EvolutionDef | null {
  return EVOLUTION_TREE[towerId] ?? null;
}
