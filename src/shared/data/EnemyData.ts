export interface EnemyDef {
  id: string;
  name: string;
  nameKo: string;
  hp: number;
  speed: number;       // tiles per second
  armor: number;       // flat damage reduction
  reward: number;      // ISM on kill
  radius: number;      // visual/collision radius
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
};
