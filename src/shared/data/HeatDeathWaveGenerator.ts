import type { WaveDef, WaveSpawn } from './WaveData';
import type { HeatDeathScaling } from './HeatDeathConfig';
import { getEnemyPool, EXTINCTION_BOSSES } from './HeatDeathConfig';
import type { MutationModifiers } from './MutationData';

const WAVE_TEMPLATES: { spawns: { enemyIndex: number; count: number; interval: number; delay: number; pathIndex: number }[] }[] = [
  { spawns: [
    { enemyIndex: 0, count: 8, interval: 1.0, delay: 0, pathIndex: 0 },
    { enemyIndex: 1, count: 5, interval: 0.8, delay: 2, pathIndex: 1 },
  ] },
  { spawns: [
    { enemyIndex: 0, count: 6, interval: 0.8, delay: 0, pathIndex: 0 },
    { enemyIndex: 0, count: 6, interval: 0.8, delay: 0, pathIndex: 1 },
    { enemyIndex: 1, count: 4, interval: 0.6, delay: 1, pathIndex: 2 },
  ] },
  { spawns: [
    { enemyIndex: 1, count: 10, interval: 0.5, delay: 0, pathIndex: 0 },
    { enemyIndex: 0, count: 8, interval: 0.7, delay: 1, pathIndex: 2 },
  ] },
  { spawns: [
    { enemyIndex: 2, count: 3, interval: 2.0, delay: 0, pathIndex: 0 },
    { enemyIndex: 0, count: 10, interval: 0.6, delay: 1, pathIndex: 1 },
    { enemyIndex: 1, count: 6, interval: 0.5, delay: 2, pathIndex: 2 },
  ] },
  { spawns: [
    { enemyIndex: 0, count: 12, interval: 0.5, delay: 0, pathIndex: 0 },
    { enemyIndex: 2, count: 4, interval: 1.5, delay: 0, pathIndex: 1 },
    { enemyIndex: 1, count: 8, interval: 0.4, delay: 1, pathIndex: 2 },
  ] },
  { spawns: [
    { enemyIndex: 3, count: 4, interval: 1.2, delay: 0, pathIndex: 0 },
    { enemyIndex: 1, count: 8, interval: 0.4, delay: 0, pathIndex: 1 },
    { enemyIndex: 2, count: 3, interval: 1.8, delay: 2, pathIndex: 2 },
  ] },
  { spawns: [
    { enemyIndex: 0, count: 15, interval: 0.3, delay: 0, pathIndex: 0 },
    { enemyIndex: 3, count: 5, interval: 1.0, delay: 1, pathIndex: 1 },
    { enemyIndex: 4, count: 2, interval: 3.0, delay: 2, pathIndex: 2 },
  ] },
  { spawns: [
    { enemyIndex: 4, count: 3, interval: 2.0, delay: 0, pathIndex: 0 },
    { enemyIndex: 2, count: 5, interval: 1.2, delay: 0, pathIndex: 1 },
    { enemyIndex: 3, count: 6, interval: 0.8, delay: 1, pathIndex: 2 },
    { enemyIndex: 1, count: 10, interval: 0.3, delay: 2, pathIndex: 0 },
  ] },
];

export function generateHeatDeathWave(
  wave: number,
  scaling: HeatDeathScaling,
  modifiers: MutationModifiers,
  entropyPermanent: boolean,
): WaveDef {
  const pool = getEnemyPool(wave);
  const template = WAVE_TEMPLATES[wave % WAVE_TEMPLATES.length];

  const spawns: WaveSpawn[] = template.spawns.map((t) => {
    const enemyIdx = Math.min(t.enemyIndex, pool.length - 1);
    const enemyId = pool[enemyIdx];
    const count = Math.ceil(t.count * scaling.countMultiplier);
    const interval = t.interval * scaling.intervalMultiplier;

    return {
      enemyId,
      count,
      interval,
      delay: t.delay,
      pathIndex: t.pathIndex,
    };
  });

  if (entropyPermanent) {
    spawns.push({
      enemyId: 'entropy',
      count: 1,
      interval: 1,
      delay: 0,
      pathIndex: wave % 3,
    });
  }

  const baseReward = 20 + wave * 3;
  const reward = Math.round(baseReward * modifiers.waveRewardMult);

  return { spawns, reward };
}

export function generateCrisisWave(crisisType: string, wave: number, scaling: HeatDeathScaling): WaveDef {
  switch (crisisType) {
    case 'swarm':
      return {
        spawns: [
          { enemyId: 'asteroid', count: Math.ceil(30 * scaling.countMultiplier), interval: 0.2 * scaling.intervalMultiplier, delay: 0, pathIndex: 0 },
          { enemyId: 'asteroid', count: Math.ceil(30 * scaling.countMultiplier), interval: 0.2 * scaling.intervalMultiplier, delay: 0, pathIndex: 1 },
          { enemyId: 'asteroid', count: Math.ceil(30 * scaling.countMultiplier), interval: 0.2 * scaling.intervalMultiplier, delay: 0, pathIndex: 2 },
        ],
        reward: 30 + wave * 5,
      };

    case 'antimatter_flood':
      return {
        spawns: [
          { enemyId: 'antimatter_storm', count: Math.ceil(5 * scaling.countMultiplier), interval: 2.0 * scaling.intervalMultiplier, delay: 0, pathIndex: 0 },
          { enemyId: 'antimatter_storm', count: Math.ceil(5 * scaling.countMultiplier), interval: 2.0 * scaling.intervalMultiplier, delay: 0, pathIndex: 1 },
          { enemyId: 'antimatter_storm', count: Math.ceil(5 * scaling.countMultiplier), interval: 2.0 * scaling.intervalMultiplier, delay: 0, pathIndex: 2 },
        ],
        reward: 50 + wave * 5,
      };

    default:
      return generateHeatDeathWave(wave, scaling, {
        enemyHpMult: 1, enemySpeedMult: 1, enemyArmorAdd: 0,
        towerDamageMult: 1, towerRangeMult: 1, towerAttackRateMult: 1,
        projectileSpeedMult: 1, waveRewardMult: 1, killRewardMult: 1,
        nebulaMult: 1, spellGaugeMult: 1, towerCostMult: 1,
        stealthFreqMult: 1, critChance: 0, critMultiplier: 1,
      }, false);
  }
}

export function generateExtinctionBossWave(bossIndex: number, wave: number, scaling: HeatDeathScaling): WaveDef {
  const boss = EXTINCTION_BOSSES[Math.min(bossIndex, EXTINCTION_BOSSES.length - 1)];

  return {
    spawns: [
      {
        enemyId: boss.baseEnemyId,
        count: 1,
        interval: 1,
        delay: 0,
        pathIndex: 1,
      },
      {
        enemyId: 'dark_matter',
        count: Math.ceil(6 * scaling.countMultiplier),
        interval: 1.0 * scaling.intervalMultiplier,
        delay: 3,
        pathIndex: 0,
      },
      {
        enemyId: 'comet',
        count: Math.ceil(10 * scaling.countMultiplier),
        interval: 0.4 * scaling.intervalMultiplier,
        delay: 2,
        pathIndex: 2,
      },
    ],
    reward: 100 + wave * 10,
  };
}
