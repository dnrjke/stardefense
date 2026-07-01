import { RESONANCE_DEFS } from '@/shared/data/SynergyData';
import type { TowerEntity } from '@/engines/tower/TowerEntity';

export interface ActiveSynergy {
  id: string;
  nameKo: string;
  type: 'resonance' | 'formation';
  description: string;
  affectedTowers: TowerEntity[];
}

// Spectral type → HR class mapping
function getSpectralClass(tower: TowerEntity): string {
  const st = tower.def.spectralType;
  if (st.startsWith('O')) return 'O';
  if (st.startsWith('B')) return 'B';
  if (st.startsWith('A')) return 'A';
  if (st.startsWith('F')) return 'F';
  if (st.startsWith('G')) return 'G';
  if (st.startsWith('K')) return 'K';
  if (st.startsWith('M')) return 'M';
  if (st.startsWith('W')) return 'W';  // Wolf-Rayet
  return 'X';
}

const BASE_TOWER_IDS = ['sol', 'proxima', 'sirius', 'rigel', 'betelgeuse', 'wolf_rayet', 'magnetar'];

function getBaseTowerRoot(id: string): string {
  for (const b of BASE_TOWER_IDS) {
    if (id === b || id.startsWith(b + '_')) return b;
  }
  return id;
}

// Get base tower ID from potentially evolved tower
function getBaseTowerId(tower: TowerEntity): string {
  if (tower.evolvedFrom) return getBaseTowerRoot(tower.evolvedFrom);
  return getBaseTowerRoot(tower.def.id);
}

export class SynergyEngine {
  private activeSynergies: ActiveSynergy[] = [];

  evaluate(towers: TowerEntity[]): ActiveSynergy[] {
    this.activeSynergies = [];

    this.evaluateResonances(towers);
    this.evaluateFormations(towers);

    return this.activeSynergies;
  }

  getActiveSynergies(): ActiveSynergy[] {
    return this.activeSynergies;
  }

  private evaluateResonances(towers: TowerEntity[]) {
    const baseTypesOnField = new Set<string>();
    const spectralClasses = new Set<string>();
    const towersByBase = new Map<string, TowerEntity[]>();
    let evolvedCount = 0;
    let hasPulsarEvolved = false;

    for (const t of towers) {
      const base = getBaseTowerId(t);
      baseTypesOnField.add(base);
      spectralClasses.add(getSpectralClass(t));

      if (!towersByBase.has(base)) towersByBase.set(base, []);
      towersByBase.get(base)!.push(t);

      if (t.level >= 2) evolvedCount++;
      if (t.def.specialType === 'pulsar' || t.def.id.includes('pulsar')) {
        hasPulsarEvolved = true;
      }
    }

    for (const res of RESONANCE_DEFS) {
      let active = false;
      let affected: TowerEntity[] = [];

      if (res.requiredTowers) {
        active = res.requiredTowers.every(id => baseTypesOnField.has(id));
        if (active) {
          for (const id of res.requiredTowers) {
            affected.push(...(towersByBase.get(id) ?? []));
          }
        }
      } else if (res.condition === 'main_sequence') {
        active = spectralClasses.has('G') && spectralClasses.has('A') &&
                 spectralClasses.has('B') && spectralClasses.has('M');
        if (active) affected = [...towers];
      } else if (res.condition === 'stellar_recycling') {
        active = evolvedCount >= 2;
        if (active) affected = towers.filter(t => t.level >= 2);
      } else if (res.condition === 'extreme_magnetosphere') {
        active = baseTypesOnField.has('magnetar') && hasPulsarEvolved;
        if (active) affected = [...(towersByBase.get('magnetar') ?? [])];
      }

      if (active) {
        this.activeSynergies.push({
          id: res.id,
          nameKo: res.nameKo,
          type: 'resonance',
          description: res.description,
          affectedTowers: affected,
        });
      }
    }
  }

  private evaluateFormations(towers: TowerEntity[]) {
    if (towers.length < 2) return;

    const towerGrid = towers.map(t => ({ tower: t, row: t.row, col: t.col, base: getBaseTowerId(t) }));

    // Binary: any 2 towers within 1 tile (Chebyshev distance = 1)
    const binaryPairs: Set<TowerEntity> = new Set();
    for (let i = 0; i < towerGrid.length; i++) {
      for (let j = i + 1; j < towerGrid.length; j++) {
        const dr = Math.abs(towerGrid[i].row - towerGrid[j].row);
        const dc = Math.abs(towerGrid[i].col - towerGrid[j].col);
        if (dr <= 1 && dc <= 1 && (dr + dc) > 0) {
          binaryPairs.add(towerGrid[i].tower);
          binaryPairs.add(towerGrid[j].tower);
        }
      }
    }
    if (binaryPairs.size >= 2) {
      this.activeSynergies.push({
        id: 'binary_star',
        nameKo: '쌍성계',
        type: 'formation',
        description: '타워 2기 인접 → 공속 +15%',
        affectedTowers: [...binaryPairs],
      });
    }

    // Trinary: 3 towers forming a triangle (each pair within 2 tiles Chebyshev distance)
    if (towerGrid.length >= 3) {
      const trinarySet: Set<TowerEntity> = new Set();
      for (let i = 0; i < towerGrid.length; i++) {
        for (let j = i + 1; j < towerGrid.length; j++) {
          for (let k = j + 1; k < towerGrid.length; k++) {
            const d1 = Math.max(Math.abs(towerGrid[i].row - towerGrid[j].row), Math.abs(towerGrid[i].col - towerGrid[j].col));
            const d2 = Math.max(Math.abs(towerGrid[j].row - towerGrid[k].row), Math.abs(towerGrid[j].col - towerGrid[k].col));
            const d3 = Math.max(Math.abs(towerGrid[i].row - towerGrid[k].row), Math.abs(towerGrid[i].col - towerGrid[k].col));
            if (d1 <= 2 && d2 <= 2 && d3 <= 2) {
              const rowSpread = new Set([towerGrid[i].row, towerGrid[j].row, towerGrid[k].row]).size;
              const colSpread = new Set([towerGrid[i].col, towerGrid[j].col, towerGrid[k].col]).size;
              if (rowSpread >= 2 && colSpread >= 2) {
                trinarySet.add(towerGrid[i].tower);
                trinarySet.add(towerGrid[j].tower);
                trinarySet.add(towerGrid[k].tower);
              }
            }
          }
        }
      }
      if (trinarySet.size >= 3) {
        this.activeSynergies.push({
          id: 'trinary_star',
          nameKo: '삼중성계',
          type: 'formation',
          description: '타워 3기 삼각형 → 동시 조준 +25%',
          affectedTowers: [...trinarySet],
        });
      }
    }

    // Orion's Belt: same base type, 3+ in a straight line (same row or same col)
    if (towerGrid.length >= 3) {
      const byBase = new Map<string, typeof towerGrid>();
      for (const t of towerGrid) {
        if (!byBase.has(t.base)) byBase.set(t.base, []);
        byBase.get(t.base)!.push(t);
      }
      const orionSet: Set<TowerEntity> = new Set();
      for (const [, group] of byBase) {
        if (group.length < 3) continue;
        const byRow = new Map<number, typeof towerGrid>();
        const byCol = new Map<number, typeof towerGrid>();
        for (const t of group) {
          if (!byRow.has(t.row)) byRow.set(t.row, []);
          byRow.get(t.row)!.push(t);
          if (!byCol.has(t.col)) byCol.set(t.col, []);
          byCol.get(t.col)!.push(t);
        }
        for (const [, line] of byRow) {
          if (line.length >= 3) {
            for (const t of line) orionSet.add(t.tower);
          }
        }
        for (const [, line] of byCol) {
          if (line.length >= 3) {
            for (const t of line) orionSet.add(t.tower);
          }
        }
      }
      if (orionSet.size >= 3) {
        this.activeSynergies.push({
          id: 'orion_belt',
          nameKo: '오리온 벨트',
          type: 'formation',
          description: '동종 3기 일직선 → 50% 확률 직선 관통탄 (최대 3기, 관통마다 70% 감쇠)',
          affectedTowers: [...orionSet],
        });
      }
    }
  }
}
