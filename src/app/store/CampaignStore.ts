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
  map_2_1: {
    id: 'map_2_1',
    name: 'Rigel Outpost',
    nameKo: '리겔 전초기지',
    act: 2,
    order: 1,
    unlocked: false,
    completed: false,
    isBoss: false,
    description: '오리온 자리의 청백색 초거성 리겔. 새로운 위협이 감지되었다.',
  },
  map_2_2: {
    id: 'map_2_2',
    name: 'Betelgeuse Sanctuary',
    nameKo: '베텔게우스 성역',
    act: 2,
    order: 2,
    unlocked: false,
    completed: false,
    isBoss: false,
    description: '적색 초거성 베텔게우스의 광활한 성역. 밀집된 적을 폭발로 제압하라.',
  },
  map_2_3: {
    id: 'map_2_3',
    name: 'Orion Nebula Corridor',
    nameKo: '오리온 성운 회랑',
    act: 2,
    order: 3,
    unlocked: false,
    completed: false,
    isBoss: false,
    description: '좁은 성운 회랑. 암흑물질이 출현한다 — 펄서와 마그네타만이 감지할 수 있다.',
  },
  map_2_b: {
    id: 'map_2_b',
    name: 'Bellatrix Breakthrough',
    nameKo: '벨라트릭스 돌파',
    act: 2,
    order: 4,
    unlocked: false,
    completed: false,
    isBoss: true,
    description: '벨라트릭스에서 반물질 폭풍이 접근 중. 분열하는 거대한 적을 저지하라.',
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
