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
  },
};
