import { createStore } from 'zustand/vanilla';

export type GamePhase = 'build' | 'wave' | 'result' | 'gameover' | 'clear';

export interface GameState {
  phase: GamePhase;
  ism: number;
  baseHp: number;
  maxBaseHp: number;
  currentWave: number;
  totalWaves: number;
  availableTowers: string[];

  setPhase: (phase: GamePhase) => void;
  addIsm: (amount: number) => void;
  spendIsm: (amount: number) => boolean;
  damageBase: (amount: number) => void;
  nextWave: () => void;
  unlockTower: (id: string) => void;
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

    reset: () => set({
      phase: 'build',
      ism: INITIAL_ISM,
      baseHp: INITIAL_BASE_HP,
      currentWave: 0,
      availableTowers: ['sol'],
    }),
  }));
}

export type GameStore = ReturnType<typeof createGameStore>;
