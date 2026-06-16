import { createStore } from 'zustand/vanilla';

export type GamePhase = 'build' | 'wave' | 'result' | 'gameover' | 'clear';

const SPEED_OPTIONS = [1, 2, 4, 8, 16] as const;
export type SpeedMultiplier = (typeof SPEED_OPTIONS)[number];

export interface GameState {
  phase: GamePhase;
  ism: number;
  baseHp: number;
  maxBaseHp: number;
  currentWave: number;
  totalWaves: number;
  availableTowers: string[];
  speed: SpeedMultiplier;

  setPhase: (phase: GamePhase) => void;
  addIsm: (amount: number) => void;
  spendIsm: (amount: number) => boolean;
  damageBase: (amount: number) => void;
  nextWave: () => void;
  unlockTower: (id: string) => void;
  cycleSpeed: () => void;
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
      return { speed: SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length] };
    }),

    reset: () => set({
      phase: 'build',
      ism: INITIAL_ISM,
      baseHp: INITIAL_BASE_HP,
      currentWave: 0,
      availableTowers: ['sol'],
      speed: 1,
    }),
  }));
}

export type GameStore = ReturnType<typeof createGameStore>;
