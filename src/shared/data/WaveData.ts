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

export const MAP_2_1_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 8, interval: 1.0, delay: 0 }], reward: 40 },
  { spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.9, delay: 0 }, { enemyId: 'comet', count: 3, interval: 0.7, delay: 2 }], reward: 50 },
  { spawns: [{ enemyId: 'comet', count: 6, interval: 0.6, delay: 0 }, { enemyId: 'asteroid', count: 6, interval: 0.8, delay: 1 }], reward: 55 },
  { spawns: [{ enemyId: 'rogue_planet', count: 2, interval: 2.5, delay: 0 }, { enemyId: 'asteroid', count: 8, interval: 0.7, delay: 1 }], reward: 70 },
  { spawns: [{ enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'comet', count: 6, interval: 0.5, delay: 2 }], reward: 80 },
  { spawns: [{ enemyId: 'comet', count: 10, interval: 0.4, delay: 0 }, { enemyId: 'rogue_planet', count: 2, interval: 3.0, delay: 3 }], reward: 90 },
  { spawns: [{ enemyId: 'asteroid', count: 12, interval: 0.6, delay: 0 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 1 }, { enemyId: 'rogue_planet', count: 2, interval: 2.0, delay: 4 }], reward: 100 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.8, delay: 0 }, { enemyId: 'comet', count: 10, interval: 0.4, delay: 1 }], reward: 110 },
  { spawns: [{ enemyId: 'asteroid', count: 15, interval: 0.5, delay: 0 }, { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 2 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 3 }], reward: 130 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 2 }, { enemyId: 'comet', count: 10, interval: 0.3, delay: 3 }], reward: 150 },
];

export const MAP_2_2_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.9, delay: 0 }], reward: 50 },
  { spawns: [{ enemyId: 'asteroid', count: 12, interval: 0.8, delay: 0 }, { enemyId: 'comet', count: 4, interval: 0.6, delay: 2 }], reward: 60 },
  { spawns: [{ enemyId: 'comet', count: 8, interval: 0.5, delay: 0 }, { enemyId: 'rogue_planet', count: 2, interval: 2.5, delay: 1 }], reward: 70 },
  { spawns: [{ enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'asteroid', count: 10, interval: 0.7, delay: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'asteroid', count: 15, interval: 0.5, delay: 0 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 1 }], reward: 100 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.8, delay: 0 }, { enemyId: 'asteroid', count: 12, interval: 0.5, delay: 2 }, { enemyId: 'comet', count: 6, interval: 0.4, delay: 3 }], reward: 120 },
  { spawns: [{ enemyId: 'asteroid', count: 20, interval: 0.4, delay: 0 }, { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 1 }], reward: 140 },
  { spawns: [{ enemyId: 'comet', count: 12, interval: 0.3, delay: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.5, delay: 2 }, { enemyId: 'asteroid', count: 15, interval: 0.4, delay: 1 }], reward: 160 },
  { spawns: [{ enemyId: 'asteroid', count: 25, interval: 0.35, delay: 0 }, { enemyId: 'comet', count: 10, interval: 0.3, delay: 1 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 3 }], reward: 180 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0 }, { enemyId: 'asteroid', count: 20, interval: 0.35, delay: 2 }, { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 3 }], reward: 200 },
];

export const MAP_2_3_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 8, interval: 0.9, delay: 0 }], reward: 60 },
  { spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.8, delay: 0 }, { enemyId: 'comet', count: 4, interval: 0.6, delay: 2 }], reward: 70 },
  { spawns: [{ enemyId: 'comet', count: 8, interval: 0.5, delay: 0 }, { enemyId: 'rogue_planet', count: 2, interval: 2.5, delay: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'dark_matter', count: 3, interval: 1.5, delay: 0 }, { enemyId: 'asteroid', count: 8, interval: 0.7, delay: 2 }], reward: 90 },
  { spawns: [{ enemyId: 'dark_matter', count: 5, interval: 1.2, delay: 0 }, { enemyId: 'comet', count: 6, interval: 0.5, delay: 1 }], reward: 100 },
  { spawns: [{ enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'dark_matter', count: 4, interval: 1.0, delay: 2 }, { enemyId: 'asteroid', count: 10, interval: 0.6, delay: 1 }], reward: 120 },
  { spawns: [{ enemyId: 'dark_matter', count: 6, interval: 1.0, delay: 0 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 2 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 3 }], reward: 130 },
  { spawns: [{ enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 0 }, { enemyId: 'dark_matter', count: 5, interval: 0.8, delay: 1 }, { enemyId: 'asteroid', count: 12, interval: 0.5, delay: 2 }], reward: 150 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.8, delay: 0 }, { enemyId: 'comet', count: 10, interval: 0.3, delay: 1 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 3 }], reward: 160 },
  { spawns: [{ enemyId: 'dark_matter', count: 12, interval: 0.6, delay: 0 }, { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 2 }], reward: 180 },
];

export const MAP_2_B_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.8, delay: 0, pathIndex: 0 }, { enemyId: 'comet', count: 6, interval: 0.6, delay: 0, pathIndex: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'rogue_planet', count: 2, interval: 2.5, delay: 0, pathIndex: 0 }, { enemyId: 'asteroid', count: 10, interval: 0.6, delay: 1, pathIndex: 1 }], reward: 100 },
  { spawns: [{ enemyId: 'comet', count: 8, interval: 0.4, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 3, interval: 1.2, delay: 2, pathIndex: 0 }], reward: 120 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 4, interval: 1.0, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 10, interval: 0.3, delay: 2, pathIndex: 0 }], reward: 150 },
  { spawns: [{ enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 0, pathIndex: 1 }, { enemyId: 'asteroid', count: 15, interval: 0.4, delay: 1, pathIndex: 0 }], reward: 180 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.7, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 12, interval: 0.3, delay: 2, pathIndex: 1 }], reward: 200 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 1, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 2, pathIndex: 0 }], reward: 220 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 2, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 3, pathIndex: 0 }], reward: 250 },
];

export const MAP_3_1_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 12, interval: 0.8, delay: 0 }], reward: 60 },
  { spawns: [{ enemyId: 'asteroid', count: 15, interval: 0.7, delay: 0 }, { enemyId: 'comet', count: 6, interval: 0.5, delay: 2 }], reward: 70 },
  { spawns: [{ enemyId: 'comet', count: 10, interval: 0.4, delay: 0 }, { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'dark_matter', count: 5, interval: 1.0, delay: 0 }, { enemyId: 'asteroid', count: 12, interval: 0.6, delay: 1 }], reward: 90 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 1 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 2 }], reward: 110 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.7, delay: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 1 }], reward: 130 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 2 }, { enemyId: 'asteroid', count: 15, interval: 0.5, delay: 1 }], reward: 150 },
  { spawns: [{ enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 1 }, { enemyId: 'comet', count: 12, interval: 0.3, delay: 2 }], reward: 170 },
  { spawns: [{ enemyId: 'dark_matter', count: 10, interval: 0.6, delay: 0 }, { enemyId: 'grb', count: 1, interval: 1, delay: 3 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 2 }], reward: 190 },
  { spawns: [{ enemyId: 'quasar', count: 1, interval: 1, delay: 0 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 2 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 1 }, { enemyId: 'comet', count: 15, interval: 0.3, delay: 3 }], reward: 220 },
];

export const MAP_3_2_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.7, delay: 0, pathIndex: 0 }, { enemyId: 'comet', count: 8, interval: 0.5, delay: 0, pathIndex: 1 }], reward: 70 },
  { spawns: [{ enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0, pathIndex: 0 }, { enemyId: 'asteroid', count: 12, interval: 0.6, delay: 0, pathIndex: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'dark_matter', count: 5, interval: 1.0, delay: 0, pathIndex: 0 }, { enemyId: 'comet', count: 10, interval: 0.4, delay: 0, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 2, interval: 2.0, delay: 2, pathIndex: 0 }], reward: 100 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 0, pathIndex: 1 }], reward: 120 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 12, interval: 0.3, delay: 1, pathIndex: 0 }], reward: 140 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 1, pathIndex: 1 }, { enemyId: 'asteroid', count: 15, interval: 0.4, delay: 2, pathIndex: 0 }], reward: 160 },
  { spawns: [{ enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 15, interval: 0.3, delay: 2, pathIndex: 1 }], reward: 180 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 2, pathIndex: 0 }], reward: 200 },
  { spawns: [{ enemyId: 'quasar', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 1, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 2, pathIndex: 0 }], reward: 220 },
  { spawns: [{ enemyId: 'quasar', count: 2, interval: 3.0, delay: 0, pathIndex: 0 }, { enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 1, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 2, pathIndex: 1 }], reward: 250 },
];

export const MAP_3_3_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 8, interval: 0.7, delay: 0, pathIndex: 0 }, { enemyId: 'comet', count: 6, interval: 0.5, delay: 0, pathIndex: 1 }, { enemyId: 'asteroid', count: 8, interval: 0.7, delay: 0, pathIndex: 2 }], reward: 80 },
  { spawns: [{ enemyId: 'rogue_planet', count: 2, interval: 2.0, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 4, interval: 1.0, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 0, pathIndex: 2 }], reward: 100 },
  { spawns: [{ enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 3, interval: 1.5, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 4, interval: 0.8, delay: 0, pathIndex: 2 }], reward: 120 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.2, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.7, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 12, interval: 0.3, delay: 0, pathIndex: 2 }], reward: 140 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 0, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 4, interval: 1.2, delay: 0, pathIndex: 2 }], reward: 160 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.5, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 15, interval: 0.25, delay: 0, pathIndex: 2 }], reward: 180 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 0, pathIndex: 1 }, { enemyId: 'grb', count: 1, interval: 1, delay: 0, pathIndex: 2 }], reward: 200 },
  { spawns: [{ enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 8, interval: 0.5, delay: 0, pathIndex: 2 }], reward: 220 },
  { spawns: [{ enemyId: 'quasar', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 1, pathIndex: 2 }], reward: 240 },
  { spawns: [{ enemyId: 'quasar', count: 2, interval: 3.0, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 0, pathIndex: 1 }, { enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 2 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 2, pathIndex: 0 }], reward: 270 },
];

export const MAP_3_B_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 15, interval: 0.6, delay: 0 }, { enemyId: 'comet', count: 10, interval: 0.4, delay: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 1 }], reward: 100 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 1 }, { enemyId: 'comet', count: 12, interval: 0.3, delay: 2 }], reward: 130 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 1 }, { enemyId: 'asteroid', count: 20, interval: 0.4, delay: 2 }], reward: 150 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 1 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 2 }], reward: 170 },
  { spawns: [{ enemyId: 'quasar', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 1 }, { enemyId: 'comet', count: 15, interval: 0.3, delay: 2 }], reward: 200 },
  { spawns: [{ enemyId: 'grb', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 2 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 1 }], reward: 220 },
  { spawns: [{ enemyId: 'quasar', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 1 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 2 }], reward: 250 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 1 }, { enemyId: 'grb', count: 2, interval: 2.5, delay: 2 }], reward: 280 },
  { spawns: [{ enemyId: 'quasar', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'antimatter_storm', count: 2, interval: 3.0, delay: 1 }, { enemyId: 'dark_matter', count: 15, interval: 0.4, delay: 2 }, { enemyId: 'rogue_planet', count: 8, interval: 0.8, delay: 3 }], reward: 300 },
  { spawns: [{ enemyId: 'grb', count: 2, interval: 2.0, delay: 0 }, { enemyId: 'quasar', count: 4, interval: 1.5, delay: 1 }, { enemyId: 'antimatter_storm', count: 2, interval: 2.5, delay: 2 }, { enemyId: 'dark_matter', count: 15, interval: 0.3, delay: 3 }], reward: 330 },
  { spawns: [{ enemyId: 'quasar', count: 4, interval: 1.5, delay: 0 }, { enemyId: 'antimatter_storm', count: 3, interval: 2.0, delay: 1 }, { enemyId: 'dark_matter', count: 20, interval: 0.3, delay: 2 }, { enemyId: 'rogue_planet', count: 8, interval: 0.7, delay: 3 }, { enemyId: 'comet', count: 20, interval: 0.2, delay: 4 }], reward: 380 },
];

export const MAP_4_1_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 15, interval: 0.5, delay: 0 }, { enemyId: 'comet', count: 8, interval: 0.4, delay: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'rogue_planet', count: 5, interval: 1.5, delay: 0 }, { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 1 }], reward: 100 },
  { spawns: [{ enemyId: 'comet', count: 15, interval: 0.3, delay: 0 }, { enemyId: 'quasar', count: 2, interval: 3.0, delay: 2 }], reward: 120 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.7, delay: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.2, delay: 1 }, { enemyId: 'asteroid', count: 20, interval: 0.3, delay: 2 }], reward: 140 },
  { spawns: [{ enemyId: 'grb', count: 2, interval: 4.0, delay: 0 }, { enemyId: 'dark_matter', count: 10, interval: 0.6, delay: 1 }], reward: 160 },
  { spawns: [{ enemyId: 'quasar', count: 3, interval: 2.5, delay: 0 }, { enemyId: 'comet', count: 20, interval: 0.25, delay: 1 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 3 }], reward: 180 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 2, interval: 5.0, delay: 0 }, { enemyId: 'dark_matter', count: 12, interval: 0.5, delay: 1 }], reward: 200 },
  { spawns: [{ enemyId: 'asteroid', count: 30, interval: 0.2, delay: 0 }, { enemyId: 'grb', count: 2, interval: 3.0, delay: 2 }, { enemyId: 'quasar', count: 3, interval: 2.0, delay: 3 }], reward: 220 },
  { spawns: [{ enemyId: 'rogue_planet', count: 8, interval: 1.0, delay: 0 }, { enemyId: 'antimatter_storm', count: 2, interval: 4.0, delay: 2 }, { enemyId: 'dark_matter', count: 15, interval: 0.4, delay: 1 }], reward: 250 },
  { spawns: [{ enemyId: 'quasar', count: 4, interval: 2.0, delay: 0 }, { enemyId: 'comet', count: 25, interval: 0.2, delay: 1 }, { enemyId: 'grb', count: 3, interval: 2.5, delay: 3 }], reward: 280 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 3, interval: 3.5, delay: 0 }, { enemyId: 'dark_matter', count: 15, interval: 0.4, delay: 1 }, { enemyId: 'rogue_planet', count: 8, interval: 0.8, delay: 2 }], reward: 300 },
  { spawns: [{ enemyId: 'grb', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'quasar', count: 5, interval: 1.5, delay: 1 }, { enemyId: 'antimatter_storm', count: 2, interval: 3.0, delay: 3 }, { enemyId: 'dark_matter', count: 20, interval: 0.3, delay: 2 }], reward: 350 },
];

export const MAP_4_2_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 10, interval: 0.5, delay: 0, pathIndex: 0 }, { enemyId: 'comet', count: 10, interval: 0.4, delay: 0, pathIndex: 1 }, { enemyId: 'asteroid', count: 10, interval: 0.5, delay: 0, pathIndex: 2 }], reward: 100 },
  { spawns: [{ enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 5, interval: 0.8, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 12, interval: 0.3, delay: 0, pathIndex: 2 }], reward: 120 },
  { spawns: [{ enemyId: 'quasar', count: 2, interval: 3.0, delay: 0, pathIndex: 0 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 0, pathIndex: 2 }], reward: 140 },
  { spawns: [{ enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 0, pathIndex: 0 }, { enemyId: 'grb', count: 1, interval: 1, delay: 0, pathIndex: 1 }, { enemyId: 'asteroid', count: 20, interval: 0.3, delay: 0, pathIndex: 2 }], reward: 160 },
  { spawns: [{ enemyId: 'comet', count: 15, interval: 0.25, delay: 0, pathIndex: 0 }, { enemyId: 'quasar', count: 3, interval: 2.0, delay: 0, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 0, pathIndex: 2 }], reward: 180 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 0, pathIndex: 1 }, { enemyId: 'grb', count: 2, interval: 3.0, delay: 0, pathIndex: 2 }], reward: 200 },
  { spawns: [{ enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 0, pathIndex: 0 }, { enemyId: 'antimatter_storm', count: 2, interval: 4.0, delay: 0, pathIndex: 1 }, { enemyId: 'quasar', count: 4, interval: 1.5, delay: 0, pathIndex: 2 }], reward: 240 },
  { spawns: [{ enemyId: 'grb', count: 2, interval: 2.5, delay: 0, pathIndex: 0 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 0, pathIndex: 1 }, { enemyId: 'comet', count: 20, interval: 0.2, delay: 0, pathIndex: 2 }], reward: 260 },
  { spawns: [{ enemyId: 'quasar', count: 4, interval: 1.5, delay: 0, pathIndex: 0 }, { enemyId: 'antimatter_storm', count: 2, interval: 3.0, delay: 0, pathIndex: 1 }, { enemyId: 'rogue_planet', count: 8, interval: 0.8, delay: 0, pathIndex: 2 }], reward: 280 },
  { spawns: [{ enemyId: 'dark_matter', count: 15, interval: 0.3, delay: 0, pathIndex: 0 }, { enemyId: 'grb', count: 3, interval: 2.0, delay: 0, pathIndex: 1 }, { enemyId: 'asteroid', count: 30, interval: 0.2, delay: 0, pathIndex: 2 }], reward: 300 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 3, interval: 3.0, delay: 0, pathIndex: 0 }, { enemyId: 'quasar', count: 5, interval: 1.2, delay: 0, pathIndex: 1 }, { enemyId: 'dark_matter', count: 15, interval: 0.3, delay: 0, pathIndex: 2 }], reward: 330 },
  { spawns: [{ enemyId: 'grb', count: 3, interval: 2.0, delay: 0, pathIndex: 0 }, { enemyId: 'antimatter_storm', count: 3, interval: 2.5, delay: 0, pathIndex: 1 }, { enemyId: 'quasar', count: 6, interval: 1.0, delay: 0, pathIndex: 2 }, { enemyId: 'rogue_planet', count: 10, interval: 0.6, delay: 1, pathIndex: 0 }], reward: 380 },
];

export const MAP_4_3_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 12, interval: 0.6, delay: 0 }, { enemyId: 'comet', count: 6, interval: 0.5, delay: 1 }], reward: 60 },
  { spawns: [{ enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'asteroid', count: 15, interval: 0.5, delay: 1 }], reward: 80 },
  { spawns: [{ enemyId: 'comet', count: 12, interval: 0.3, delay: 0 }, { enemyId: 'dark_matter', count: 4, interval: 1.0, delay: 1 }], reward: 90 },
  { spawns: [{ enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 0 }, { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 1 }, { enemyId: 'comet', count: 10, interval: 0.3, delay: 2 }], reward: 100 },
  { spawns: [{ enemyId: 'grb', count: 1, interval: 1, delay: 0 }, { enemyId: 'asteroid', count: 20, interval: 0.4, delay: 1 }, { enemyId: 'dark_matter', count: 5, interval: 0.8, delay: 2 }], reward: 120 },
  { spawns: [{ enemyId: 'quasar', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 1 }, { enemyId: 'comet', count: 15, interval: 0.25, delay: 2 }], reward: 140 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 1, interval: 1, delay: 0 }, { enemyId: 'dark_matter', count: 8, interval: 0.6, delay: 1 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 2 }], reward: 160 },
  { spawns: [{ enemyId: 'grb', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'quasar', count: 3, interval: 2.0, delay: 1 }, { enemyId: 'asteroid', count: 25, interval: 0.3, delay: 2 }], reward: 180 },
  { spawns: [{ enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 0 }, { enemyId: 'antimatter_storm', count: 2, interval: 4.0, delay: 1 }, { enemyId: 'comet', count: 20, interval: 0.2, delay: 2 }], reward: 200 },
  { spawns: [{ enemyId: 'quasar', count: 4, interval: 1.5, delay: 0 }, { enemyId: 'rogue_planet', count: 6, interval: 1.0, delay: 1 }, { enemyId: 'grb', count: 2, interval: 2.5, delay: 2 }], reward: 220 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 1 }, { enemyId: 'quasar', count: 4, interval: 1.5, delay: 2 }], reward: 240 },
  { spawns: [{ enemyId: 'asteroid', count: 30, interval: 0.2, delay: 0 }, { enemyId: 'comet', count: 20, interval: 0.2, delay: 1 }, { enemyId: 'rogue_planet', count: 8, interval: 0.8, delay: 2 }], reward: 260 },
  { spawns: [{ enemyId: 'grb', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'antimatter_storm', count: 2, interval: 3.5, delay: 1 }, { enemyId: 'dark_matter', count: 15, interval: 0.35, delay: 2 }], reward: 280 },
  { spawns: [{ enemyId: 'quasar', count: 5, interval: 1.2, delay: 0 }, { enemyId: 'rogue_planet', count: 8, interval: 0.8, delay: 1 }, { enemyId: 'comet', count: 25, interval: 0.2, delay: 2 }], reward: 300 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 3, interval: 2.5, delay: 0 }, { enemyId: 'grb', count: 3, interval: 2.0, delay: 1 }, { enemyId: 'dark_matter', count: 15, interval: 0.3, delay: 2 }], reward: 320 },
  { spawns: [{ enemyId: 'quasar', count: 5, interval: 1.0, delay: 0 }, { enemyId: 'antimatter_storm', count: 3, interval: 2.0, delay: 1 }, { enemyId: 'asteroid', count: 35, interval: 0.15, delay: 2 }, { enemyId: 'rogue_planet', count: 10, interval: 0.6, delay: 3 }], reward: 350 },
  { spawns: [{ enemyId: 'grb', count: 4, interval: 1.5, delay: 0 }, { enemyId: 'dark_matter', count: 20, interval: 0.3, delay: 1 }, { enemyId: 'quasar', count: 6, interval: 1.0, delay: 2 }], reward: 380 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 4, interval: 2.0, delay: 0 }, { enemyId: 'comet', count: 30, interval: 0.15, delay: 1 }, { enemyId: 'rogue_planet', count: 10, interval: 0.6, delay: 2 }], reward: 400 },
  { spawns: [{ enemyId: 'quasar', count: 6, interval: 0.8, delay: 0 }, { enemyId: 'grb', count: 4, interval: 1.5, delay: 1 }, { enemyId: 'antimatter_storm', count: 3, interval: 2.0, delay: 2 }, { enemyId: 'dark_matter', count: 20, interval: 0.25, delay: 3 }], reward: 450 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 5, interval: 1.5, delay: 0 }, { enemyId: 'grb', count: 5, interval: 1.2, delay: 1 }, { enemyId: 'quasar', count: 8, interval: 0.8, delay: 2 }, { enemyId: 'dark_matter', count: 25, interval: 0.2, delay: 3 }], reward: 500 },
];

export const MAP_4_B_WAVES: WaveDef[] = [
  { spawns: [{ enemyId: 'asteroid', count: 20, interval: 0.4, delay: 0 }, { enemyId: 'comet', count: 15, interval: 0.3, delay: 1 }], reward: 100 },
  { spawns: [{ enemyId: 'rogue_planet', count: 6, interval: 1.2, delay: 0 }, { enemyId: 'dark_matter', count: 10, interval: 0.5, delay: 1 }], reward: 130 },
  { spawns: [{ enemyId: 'quasar', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'comet', count: 20, interval: 0.2, delay: 1 }, { enemyId: 'rogue_planet', count: 5, interval: 1.0, delay: 2 }], reward: 160 },
  { spawns: [{ enemyId: 'grb', count: 2, interval: 3.0, delay: 0 }, { enemyId: 'dark_matter', count: 12, interval: 0.4, delay: 1 }, { enemyId: 'antimatter_storm', count: 2, interval: 4.0, delay: 2 }], reward: 190 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 3, interval: 3.0, delay: 0 }, { enemyId: 'quasar', count: 4, interval: 1.5, delay: 1 }, { enemyId: 'asteroid', count: 25, interval: 0.2, delay: 2 }], reward: 220 },
  { spawns: [{ enemyId: 'dark_matter', count: 15, interval: 0.3, delay: 0 }, { enemyId: 'grb', count: 3, interval: 2.0, delay: 1 }, { enemyId: 'rogue_planet', count: 8, interval: 0.8, delay: 2 }], reward: 250 },
  { spawns: [{ enemyId: 'quasar', count: 5, interval: 1.2, delay: 0 }, { enemyId: 'antimatter_storm', count: 3, interval: 2.5, delay: 1 }, { enemyId: 'comet', count: 25, interval: 0.15, delay: 2 }], reward: 280 },
  { spawns: [{ enemyId: 'grb', count: 3, interval: 2.0, delay: 0 }, { enemyId: 'dark_matter', count: 18, interval: 0.3, delay: 1 }, { enemyId: 'antimatter_storm', count: 3, interval: 2.0, delay: 2 }, { enemyId: 'quasar', count: 5, interval: 1.0, delay: 3 }], reward: 320 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 4, interval: 2.0, delay: 0 }, { enemyId: 'quasar', count: 6, interval: 1.0, delay: 1 }, { enemyId: 'rogue_planet', count: 10, interval: 0.6, delay: 2 }], reward: 360 },
  { spawns: [{ enemyId: 'grb', count: 4, interval: 1.5, delay: 0 }, { enemyId: 'dark_matter', count: 20, interval: 0.25, delay: 1 }, { enemyId: 'antimatter_storm', count: 4, interval: 1.5, delay: 2 }, { enemyId: 'quasar', count: 6, interval: 0.8, delay: 3 }], reward: 400 },
  { spawns: [{ enemyId: 'antimatter_storm', count: 5, interval: 1.5, delay: 0 }, { enemyId: 'quasar', count: 8, interval: 0.8, delay: 1 }, { enemyId: 'grb', count: 5, interval: 1.2, delay: 2 }, { enemyId: 'dark_matter', count: 25, interval: 0.2, delay: 3 }], reward: 450 },
  { spawns: [{ enemyId: 'entropy', count: 1, interval: 1, delay: 0 }, { enemyId: 'antimatter_storm', count: 4, interval: 2.0, delay: 3 }, { enemyId: 'quasar', count: 6, interval: 1.0, delay: 2 }, { enemyId: 'grb', count: 4, interval: 1.5, delay: 4 }, { enemyId: 'dark_matter', count: 20, interval: 0.3, delay: 1 }], reward: 600 },
];

export const HEAT_DEATH_BASE_WAVES: WaveDef[] = [
  {
    spawns: [
      { enemyId: 'asteroid', count: 8, interval: 1.0, delay: 0, pathIndex: 0 },
      { enemyId: 'comet', count: 5, interval: 0.8, delay: 2, pathIndex: 1 },
    ],
    reward: 25,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 6, interval: 0.8, delay: 0, pathIndex: 0 },
      { enemyId: 'asteroid', count: 6, interval: 0.8, delay: 0, pathIndex: 1 },
      { enemyId: 'comet', count: 4, interval: 0.6, delay: 1, pathIndex: 2 },
    ],
    reward: 30,
  },
  {
    spawns: [
      { enemyId: 'comet', count: 10, interval: 0.5, delay: 0, pathIndex: 0 },
      { enemyId: 'asteroid', count: 8, interval: 0.7, delay: 1, pathIndex: 2 },
    ],
    reward: 30,
  },
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 3, interval: 2.0, delay: 0, pathIndex: 0 },
      { enemyId: 'asteroid', count: 10, interval: 0.6, delay: 1, pathIndex: 1 },
      { enemyId: 'comet', count: 6, interval: 0.5, delay: 2, pathIndex: 2 },
    ],
    reward: 35,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 12, interval: 0.5, delay: 0, pathIndex: 0 },
      { enemyId: 'rogue_planet', count: 4, interval: 1.5, delay: 0, pathIndex: 1 },
      { enemyId: 'comet', count: 8, interval: 0.4, delay: 1, pathIndex: 2 },
    ],
    reward: 40,
  },
  {
    spawns: [
      { enemyId: 'dark_matter', count: 4, interval: 1.2, delay: 0, pathIndex: 0 },
      { enemyId: 'comet', count: 8, interval: 0.4, delay: 0, pathIndex: 1 },
      { enemyId: 'rogue_planet', count: 3, interval: 1.8, delay: 2, pathIndex: 2 },
    ],
    reward: 45,
  },
  {
    spawns: [
      { enemyId: 'asteroid', count: 15, interval: 0.3, delay: 0, pathIndex: 0 },
      { enemyId: 'dark_matter', count: 5, interval: 1.0, delay: 1, pathIndex: 1 },
      { enemyId: 'quasar', count: 2, interval: 3.0, delay: 2, pathIndex: 2 },
    ],
    reward: 50,
  },
  {
    spawns: [
      { enemyId: 'quasar', count: 3, interval: 2.0, delay: 0, pathIndex: 0 },
      { enemyId: 'rogue_planet', count: 5, interval: 1.2, delay: 0, pathIndex: 1 },
      { enemyId: 'dark_matter', count: 6, interval: 0.8, delay: 1, pathIndex: 2 },
      { enemyId: 'comet', count: 10, interval: 0.3, delay: 2, pathIndex: 0 },
    ],
    reward: 55,
  },
];
