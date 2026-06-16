export interface WaveSpawn {
  enemyId: string;
  count: number;
  interval: number;  // seconds between spawns
  delay: number;     // delay before this group starts
}

export interface WaveDef {
  spawns: WaveSpawn[];
  reward: number;     // bonus ISM on wave clear
}

export const MAP_1_1_WAVES: WaveDef[] = [
  // Wave 1: asteroid x5
  {
    spawns: [{ enemyId: 'asteroid', count: 5, interval: 1.2, delay: 0 }],
    reward: 30,
  },
  // Wave 2: asteroid x8
  {
    spawns: [{ enemyId: 'asteroid', count: 8, interval: 1.0, delay: 0 }],
    reward: 40,
  },
  // Wave 3: asteroid x6 + comet x2
  {
    spawns: [
      { enemyId: 'asteroid', count: 6, interval: 1.0, delay: 0 },
      { enemyId: 'comet', count: 2, interval: 0.8, delay: 3 },
    ],
    reward: 50,
  },
  // Wave 4: comet x6
  {
    spawns: [{ enemyId: 'comet', count: 6, interval: 0.7, delay: 0 }],
    reward: 50,
  },
  // Wave 5: asteroid x10 + comet x4
  {
    spawns: [
      { enemyId: 'asteroid', count: 10, interval: 0.8, delay: 0 },
      { enemyId: 'comet', count: 4, interval: 0.6, delay: 2 },
    ],
    reward: 60,
  },
  // Wave 6: rogue_planet x1 + asteroid x8
  {
    spawns: [
      { enemyId: 'rogue_planet', count: 1, interval: 1, delay: 0 },
      { enemyId: 'asteroid', count: 8, interval: 0.8, delay: 2 },
    ],
    reward: 80,
  },
];
