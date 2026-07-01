import { createStore } from 'zustand/vanilla';

export type GamePhase = 'build' | 'wave' | 'result' | 'gameover' | 'clear';

const SPEED_OPTIONS_DESKTOP = [1, 2, 4, 8, 16] as const;
const SPEED_OPTIONS_MOBILE = [1, 2, 4] as const;
// DisplayMode.detect()와 동일한 터치 감지 기준 (maxTouchPoints만 노출하는 기기 포함)
const _isTouch = typeof window !== 'undefined'
  && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
const SPEED_OPTIONS: readonly number[] = _isTouch ? SPEED_OPTIONS_MOBILE : SPEED_OPTIONS_DESKTOP;
export type SpeedMultiplier = 1 | 2 | 4 | 8 | 16;

export interface GameState {
  phase: GamePhase;
  ism: number;
  baseHp: number;
  maxBaseHp: number;
  currentWave: number;
  totalWaves: number;
  availableTowers: string[];
  speed: SpeedMultiplier;
  spellGauge: number;
  spellCooldowns: Record<string, number>;
  enemiesKilled: number;
  towersPlaced: number;
  survivalCycle: number;
  activeMutations: string[];
  heatDeathWave: number;
  heatDeathStartTime: number;
  isHeatDeath: boolean;
  entropyPermanent: boolean;
  buildShrinkLevel: number;

  setPhase: (phase: GamePhase) => void;
  addIsm: (amount: number) => void;
  spendIsm: (amount: number) => boolean;
  damageBase: (amount: number) => void;
  nextWave: () => void;
  unlockTower: (id: string) => void;
  cycleSpeed: () => void;
  addSpellGauge: (amount: number) => void;
  spendSpellGauge: (amount: number) => boolean;
  tickCooldowns: (dt: number) => void;
  startCooldown: (spellId: string, duration: number) => void;
  incrementEnemiesKilled: () => void;
  incrementTowersPlaced: () => void;
  incrementSurvivalCycle: () => void;
  addMutation: (id: string) => void;
  setHeatDeathMode: (enabled: boolean) => void;
  setEntropyPermanent: () => void;
  incrementBuildShrink: () => void;
  reset: () => void;
}

const INITIAL_ISM = 100;
const INITIAL_BASE_HP = 20;

export function createGameStore(totalWaves: number) {
  return createStore<GameState>((set, get) => ({
    phase: 'build',
    ism: INITIAL_ISM,
    baseHp: INITIAL_BASE_HP,
    maxBaseHp: INITIAL_BASE_HP,
    currentWave: 0,
    totalWaves,
    availableTowers: ['sol'],
    speed: 1,
    spellGauge: 0,
    spellCooldowns: {},
    enemiesKilled: 0,
    towersPlaced: 0,
    survivalCycle: 0,
    activeMutations: [],
    heatDeathWave: 0,
    heatDeathStartTime: 0,
    isHeatDeath: false,
    entropyPermanent: false,
    buildShrinkLevel: 0,

    setPhase: (phase) => set({ phase }),

    addIsm: (amount) => set((s) => ({ ism: s.ism + amount })),

    spendIsm: (amount) => {
      if (get().ism < amount) return false;
      set((s) => ({ ism: s.ism - amount }));
      return true;
    },

    damageBase: (amount) => {
      set((s) => {
        const hp = Math.max(0, s.baseHp - amount);
        return { baseHp: hp, phase: hp <= 0 ? 'gameover' : s.phase };
      });
    },

    nextWave: () => set((s) => ({ currentWave: s.currentWave + 1 })),

    unlockTower: (id) => set((s) => ({
      availableTowers: s.availableTowers.includes(id) ? s.availableTowers : [...s.availableTowers, id],
    })),

    cycleSpeed: () => set((s) => {
      const idx = SPEED_OPTIONS.indexOf(s.speed);
      return { speed: SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length] as SpeedMultiplier };
    }),

    addSpellGauge: (amount) => set((s) => ({
      spellGauge: Math.min(100, s.spellGauge + amount),
    })),

    spendSpellGauge: (amount) => {
      if (get().spellGauge < amount) return false;
      set((s) => ({ spellGauge: s.spellGauge - amount }));
      return true;
    },

    tickCooldowns: (dt) => set((s) => {
      const cds = { ...s.spellCooldowns };
      let changed = false;
      for (const key of Object.keys(cds)) {
        if (cds[key] > 0) {
          cds[key] = Math.max(0, cds[key] - dt);
          changed = true;
        }
      }
      return changed ? { spellCooldowns: cds } : {};
    }),

    startCooldown: (spellId, duration) => set((s) => ({
      spellCooldowns: { ...s.spellCooldowns, [spellId]: duration },
    })),

    incrementEnemiesKilled: () => set((s) => ({ enemiesKilled: s.enemiesKilled + 1 })),
    incrementTowersPlaced: () => set((s) => ({ towersPlaced: s.towersPlaced + 1 })),
    incrementSurvivalCycle: () => set((s) => ({ survivalCycle: s.survivalCycle + 1 })),

    addMutation: (id) => set((s) => ({
      activeMutations: s.activeMutations.includes(id) ? s.activeMutations : [...s.activeMutations, id],
    })),

    setHeatDeathMode: (enabled) => set({
      isHeatDeath: enabled,
      heatDeathWave: 0,
      heatDeathStartTime: enabled ? Date.now() : 0,
    }),

    setEntropyPermanent: () => set({ entropyPermanent: true }),

    incrementBuildShrink: () => set((s) => ({ buildShrinkLevel: s.buildShrinkLevel + 1 })),

    reset: () => set({
      phase: 'build',
      ism: INITIAL_ISM,
      baseHp: INITIAL_BASE_HP,
      currentWave: 0,
      availableTowers: ['sol'],
      speed: 1,
      spellGauge: 0,
      spellCooldowns: {},
      enemiesKilled: 0,
      towersPlaced: 0,
      survivalCycle: 0,
      activeMutations: [],
      heatDeathWave: 0,
      heatDeathStartTime: 0,
      isHeatDeath: false,
      entropyPermanent: false,
      buildShrinkLevel: 0,
    }),
  }));
}

export type GameStore = ReturnType<typeof createGameStore>;
