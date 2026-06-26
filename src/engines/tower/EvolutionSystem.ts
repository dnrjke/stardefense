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

export function getEvolutionCost(baseDef: TowerDef, path: EvolutionPath): number {
  const costRatio = baseDef.cost / 50;
  return Math.round(path.cost * costRatio);
}

export function computeEvolvedDef(baseDef: TowerDef, targetId: string): TowerDef {
  const target = TOWER_DEFS[targetId];
  if (!target) return baseDef;

  const blendCi = (baseDef.ci + target.ci) / 2;

  if (targetId === 'red_giant') {
    return {
      ...target,
      id: `${baseDef.id}_red_giant`,
      name: `${baseDef.name} (Red Giant)`,
      nameKo: `${baseDef.nameKo} 적색거성`,
      ci: baseDef.ci * 0.3 + target.ci * 0.7,
      damage: baseDef.damage,
      attackRate: baseDef.attackRate * 0.6,
      range: baseDef.range * 1.5,
      projectileSpeed: baseDef.projectileSpeed,
    };
  }
  if (targetId === 'blue_giant') {
    return {
      ...target,
      id: `${baseDef.id}_blue_giant`,
      name: `${baseDef.name} (Blue Giant)`,
      nameKo: `${baseDef.nameKo} 청색거성`,
      ci: baseDef.ci * 0.3 + target.ci * 0.7,
      damage: baseDef.damage * 2,
      attackRate: baseDef.attackRate,
      range: baseDef.range,
      projectileSpeed: baseDef.projectileSpeed,
    };
  }
  if (targetId === 'supernova_remnant' || targetId === 'planetary_nebula') {
    return {
      ...target,
      ci: blendCi,
      range: Math.max(target.range, baseDef.range * 0.8),
    };
  }
  if (targetId === 'black_hole') {
    return { ...target };
  }
  if (targetId === 'pulsar') {
    return {
      ...target,
      range: Math.max(target.range, baseDef.range * 0.7),
    };
  }
  return target;
}

export function getEvolutions(towerId: string): EvolutionDef | null {
  return EVOLUTION_TREE[towerId] ?? null;
}
