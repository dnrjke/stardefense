export interface EnemyDef {
  id: string;
  name: string;
  nameKo: string;
  hp: number;
  speed: number;       // tiles per second
  armor: number;       // flat damage reduction
  reward: number;      // ISM on kill
  radius: number;      // visual/collision radius
  stealth?: boolean;
  splits?: boolean;
  ignoresNebula?: boolean;
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  asteroid: {
    id: 'asteroid',
    name: 'Asteroid',
    nameKo: '소행성',
    hp: 30,
    speed: 1.5,
    armor: 0,
    reward: 10,
    radius: 0.3,
  },
  comet: {
    id: 'comet',
    name: 'Comet',
    nameKo: '혜성',
    hp: 20,
    speed: 3.0,
    armor: 0,
    reward: 15,
    radius: 0.25,
  },
  rogue_planet: {
    id: 'rogue_planet',
    name: 'Rogue Planet',
    nameKo: '떠돌이 행성',
    hp: 120,
    speed: 0.8,
    armor: 3,
    reward: 30,
    radius: 0.45,
  },
  grb: {
    id: 'grb',
    name: 'GRB',
    nameKo: '감마선 폭발',
    hp: 500,
    speed: 0.6,
    armor: 5,
    reward: 100,
    radius: 0.55,
  },
  dark_matter: {
    id: 'dark_matter',
    name: 'Dark Matter',
    nameKo: '암흑물질',
    hp: 60,
    speed: 1.5,
    armor: 0,
    reward: 25,
    radius: 0.3,
    stealth: true,
  },
  antimatter_storm: {
    id: 'antimatter_storm',
    name: 'Antimatter Storm',
    nameKo: '반물질 폭풍',
    hp: 800,
    speed: 0.5,
    armor: 8,
    reward: 200,
    radius: 0.6,
    splits: true,
    ignoresNebula: true,
  },
  antimatter_storm_split: {
    id: 'antimatter_storm_split',
    name: 'Antimatter Storm Fragment',
    nameKo: '반물질 파편',
    hp: 200,
    speed: 0.7,
    armor: 4,
    reward: 50,
    radius: 0.4,
    ignoresNebula: true,
  },
};
