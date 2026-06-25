import { createStore } from 'zustand/vanilla';

export interface MapInfo {
  id: string;
  name: string;
  nameKo: string;
  act: number;
  order: number;
  unlocked: boolean;
  completed: boolean;
  isBoss: boolean;
  description: string;
}

export interface CampaignState {
  maps: Record<string, MapInfo>;
  currentMapId: string | null;

  unlockMap: (id: string) => void;
  completeMap: (id: string) => void;
  selectMap: (id: string) => void;
  getActMaps: (act: number) => MapInfo[];
  save: () => void;
  load: () => void;
}

const STORAGE_KEY = 'stardefense_campaign';

const DEFAULT_MAPS: Record<string, MapInfo> = {
  map_1_1: {
    id: 'map_1_1',
    name: 'Solar Outskirts',
    nameKo: '태양계 외곽',
    act: 1,
    order: 1,
    unlocked: true,
    completed: false,
    isBoss: false,
    description: '태양계 가장자리에 정체불명의 물체가 접근 중. 첫 방어선을 구축하라.',
  },
  map_1_2: {
    id: 'map_1_2',
    name: 'Sirius Route',
    nameKo: '시리우스 항로',
    act: 1,
    order: 2,
    unlocked: false,
    completed: false,
    isBoss: false,
    description: '밤하늘에서 가장 밝은 별로 향하는 항로. 적의 수가 증가한다.',
  },
  map_1_3: {
    id: 'map_1_3',
    name: "Barnard's Defense Line",
    nameKo: '바너드 별 방어선',
    act: 1,
    order: 3,
    unlocked: false,
    completed: false,
    isBoss: false,
    description: '바너드 별 궤도에 최후의 방어선을 구축한다. 강력한 적이 출현.',
  },
  map_1_b: {
    id: 'map_1_b',
    name: 'Procyon Showdown',
    nameKo: '프로키온 결전',
    act: 1,
    order: 4,
    unlocked: false,
    completed: false,
    isBoss: true,
    description: '프로키온 성계에서 최종 결전. 거대한 적이 기다리고 있다.',
  },
};

export function createCampaignStore() {
  return createStore<CampaignState>((set, get) => ({
    maps: { ...DEFAULT_MAPS },
    currentMapId: null,

    unlockMap: (id) => set((s) => {
      if (!s.maps[id]) return s;
      return { maps: { ...s.maps, [id]: { ...s.maps[id], unlocked: true } } };
    }),

    completeMap: (id) => set((s) => {
      if (!s.maps[id]) return s;
      return { maps: { ...s.maps, [id]: { ...s.maps[id], completed: true } } };
    }),

    selectMap: (id) => set({ currentMapId: id }),

    getActMaps: (act) => {
      const maps = get().maps;
      return Object.values(maps)
        .filter(m => m.act === act)
        .sort((a, b) => a.order - b.order);
    },

    save: () => {
      const { maps } = get();
      const saveData: Record<string, { unlocked: boolean; completed: boolean }> = {};
      for (const [id, m] of Object.entries(maps)) {
        saveData[id] = { unlocked: m.unlocked, completed: m.completed };
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      } catch { /* noop */ }
    },

    load: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saveData = JSON.parse(raw) as Record<string, { unlocked: boolean; completed: boolean }>;
        set((s) => {
          const maps = { ...s.maps };
          for (const [id, data] of Object.entries(saveData)) {
            if (maps[id]) {
              maps[id] = { ...maps[id], unlocked: data.unlocked, completed: data.completed };
            }
          }
          return { maps };
        });
      } catch { /* noop */ }
    },
  }));
}

export type CampaignStore = ReturnType<typeof createCampaignStore>;
