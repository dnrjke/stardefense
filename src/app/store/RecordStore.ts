export interface HeatDeathRecord {
  bestWave: number;
  bestKills: number;
  bestTime: number;
  lastMutations: string[];
  date: string;
}

const STORAGE_KEY = 'stardefense_heatdeath_record';

const DEFAULT_RECORD: HeatDeathRecord = {
  bestWave: 0,
  bestKills: 0,
  bestTime: 0,
  lastMutations: [],
  date: '',
};

export function loadRecord(): HeatDeathRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RECORD };
    return { ...DEFAULT_RECORD, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_RECORD };
  }
}

export function saveRecord(record: Partial<HeatDeathRecord>): void {
  const current = loadRecord();
  const merged = { ...current, ...record, date: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function isNewBest(wave: number, kills: number): boolean {
  const current = loadRecord();
  return wave > current.bestWave || (wave === current.bestWave && kills > current.bestKills);
}
