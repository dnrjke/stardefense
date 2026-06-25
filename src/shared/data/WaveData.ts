export interface WaveSpawn {
  enemyId: string;
  count: number;
  interval: number;
  delay: number;
  pathIndex?: number;
}

export interface WaveDef {
  spawns: WaveSpawn[];
  reward: number;
}

export const MAP_1_1_WAVES: WaveDef[] = [
  {
    spawns: [{ enemyId: 'asteroid', count: 5, interval: 1.2, delay: 0 }],
    reward: 30,
  },
  {
    spawns: [{ enemyId: 'asteroid', count: 8, interval: 1.0, delay: 0 }],
    reward: 40,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 6, interval: 1.0, delay: 0 },
      { enemyId: 'comet', count: 2, interval: 0.8, delay: 3 },
    ],
    reward: 50,
  },
  {
    spawns: [{ enemyId: 'comet', count: 6, interval: 0.7, delay: 0 }],
    reward: 50,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 10, interval: 0.8, delay: 0 },
      { enemyId: 'comet', count: 4, interval: 0.6, delay: 2 },
    ],
    reward: 60,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 1, interval: 1, delay: 0 },
      { enemyId: 'asteroid', count: 8, interval: 0.8, delay: 2 },
    ],
    reward: 80,
  },
];

export const MAP_1_2_WAVES: WaveDef[] = [
  {
    spawns: [{ enemyId: 'asteroid', count: 6, interval: 1.1, delay: 0 }],
    reward: 30,
  },
  {
    spawns: [{ enemyId: 'asteroid', count: 8, interval: 0.9, delay: 0 }],
    reward: 35,
  },
  {
    spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.8, delay: 0 }],
    reward: 40,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 6, interval: 0.9, delay: 0 },
      { enemyId: 'comet', count: 4, interval: 0.7, delay: 2 },
    ],
    reward: 50,
  },
  {
    spawns: [
      { enemyId: 'comet', count: 6, interval: 0.6, delay: 0 },
      { enemyId: 'asteroid', count: 4, interval: 1.0, delay: 3 },
    ],
    reward: 60,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 2, interval: 3.0, delay: 0 },
      { enemyId: 'asteroid', count: 6, interval: 0.8, delay: 1 },
    ],
    reward: 70,
  },
  {
    spawns: [
      { enemyId: 'comet', count: 8, interval: 0.5, delay: 0 },
      { enemyId: 'rogue_planet', count: 1, interval: 1, delay: 4 },
      { enemyId: 'asteroid', count: 6, interval: 0.7, delay: 2 },
    ],
    reward: 85,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 3, interval: 2.5, delay: 0 },
      { enemyId: 'comet', count: 6, interval: 0.5, delay: 1 },
      { enemyId: 'asteroid', count: 8, interval: 0.6, delay: 3 },
    ],
    reward: 100,
  },
];

export const MAP_1_3_WAVES: WaveDef[] = [
  {
    spawns: [{ enemyId: 'asteroid', count: 6, interval: 1.0, delay: 0, pathIndex: 0 }],
    reward: 40,
  },
  {
    spawns: [{ enemyId: 'asteroid', count: 8, interval: 0.9, delay: 0, pathIndex: 0 }],
    reward: 45,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 6, interval: 0.9, delay: 0, pathIndex: 1 },
      { enemyId: 'comet', count: 3, interval: 0.7, delay: 2, pathIndex: 1 },
    ],
    reward: 50,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 5, interval: 0.9, delay: 0, pathIndex: 0 },
      { enemyId: 'asteroid', count: 5, interval: 0.9, delay: 0.5, pathIndex: 1 },
    ],
    reward: 60,
  },
  {
    spawns: [
      { enemyId: 'comet', count: 4, interval: 0.6, delay: 0, pathIndex: 0 },
      { enemyId: 'asteroid', count: 6, interval: 0.8, delay: 0, pathIndex: 1 },
      { enemyId: 'comet', count: 3, interval: 0.7, delay: 3, pathIndex: 1 },
    ],
    reward: 75,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 1, interval: 1, delay: 0, pathIndex: 0 },
      { enemyId: 'asteroid', count: 8, interval: 0.7, delay: 1, pathIndex: 1 },
      { enemyId: 'comet', count: 4, interval: 0.6, delay: 2, pathIndex: 0 },
    ],
    reward: 90,
  },
  {
    spawns: [
      { enemyId: 'comet', count: 6, interval: 0.5, delay: 0, pathIndex: 0 },
      { enemyId: 'rogue_planet', count: 2, interval: 3.0, delay: 0, pathIndex: 1 },
      { enemyId: 'asteroid', count: 8, interval: 0.6, delay: 2, pathIndex: 0 },
      { enemyId: 'comet', count: 4, interval: 0.5, delay: 3, pathIndex: 1 },
    ],
    reward: 105,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 2, interval: 2.5, delay: 0, pathIndex: 0 },
      { enemyId: 'rogue_planet', count: 2, interval: 2.5, delay: 0, pathIndex: 1 },
      { enemyId: 'comet', count: 8, interval: 0.4, delay: 2, pathIndex: 0 },
      { enemyId: 'asteroid', count: 10, interval: 0.5, delay: 1, pathIndex: 1 },
    ],
    reward: 120,
  },
];

export const MAP_1_B_WAVES: WaveDef[] = [
  {
    spawns: [
      { enemyId: 'asteroid', count: 8, interval: 0.8, delay: 0 },
      { enemyId: 'comet', count: 3, interval: 0.7, delay: 2 },
    ],
    reward: 50,
  },
  {
    spawns: [
      { enemyId: 'comet', count: 6, interval: 0.5, delay: 0 },
      { enemyId: 'rogue_planet', count: 1, interval: 1, delay: 3 },
    ],
    reward: 70,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 2, interval: 3.0, delay: 0 },
      { enemyId: 'asteroid', count: 10, interval: 0.6, delay: 1 },
      { enemyId: 'comet', count: 4, interval: 0.5, delay: 4 },
    ],
    reward: 100,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0 },
      { enemyId: 'comet', count: 8, interval: 0.4, delay: 1 },
      { enemyId: 'asteroid', count: 12, interval: 0.5, delay: 2 },
    ],
    reward: 120,
  },
  {
    spawns: [
      { enemyId: 'grb', count: 1, interval: 1, delay: 0 },
      { enemyId: 'asteroid', count: 6, interval: 0.8, delay: 2 },
      { enemyId: 'comet', count: 4, interval: 0.6, delay: 4 },
    ],
    reward: 150,
  },
];
