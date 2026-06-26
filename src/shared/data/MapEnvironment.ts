export interface MapEnvironment {
  speedMultiplier?: number;
  ismMultiplier?: number;
  towerCostMultiplier?: number;
  name: string;
  nameKo: string;
}

export const MAP_ENVIRONMENTS: Record<string, MapEnvironment> = {
  normal: { name: 'Normal', nameKo: '표준', speedMultiplier: 1, ismMultiplier: 1, towerCostMultiplier: 1 },
  nebula_rich: { name: 'Nebula Rich', nameKo: '성운 풍부', ismMultiplier: 1.5, towerCostMultiplier: 1.2 },
  dark_sector: { name: 'Dark Sector', nameKo: '암흑 구역', speedMultiplier: 1.3 },
  gravity_well: { name: 'Gravity Well', nameKo: '중력 우물', speedMultiplier: 0.8, towerCostMultiplier: 0.8 },
};
