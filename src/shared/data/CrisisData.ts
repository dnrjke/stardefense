export interface CrisisDef {
  id: string;
  wave: number;
  nameKo: string;
  description: string;
  type: 'swarm' | 'shrink_build' | 'disable_towers' | 'antimatter_flood' | 'entropy_permanent';
}

export const CRISIS_EVENTS: CrisisDef[] = [
  { id: 'asteroid_belt', wave: 10, nameKo: '소행성대 충돌', description: '적 수 3배, 전원 소행성', type: 'swarm' },
  { id: 'event_horizon', wave: 20, nameKo: '사건의 지평선', description: '맵 가장자리 2열 건설 불가', type: 'shrink_build' },
  { id: 'gamma_baptism', wave: 30, nameKo: '감마선 세례', description: '모든 타워 3초 비활성화로 시작', type: 'disable_towers' },
  { id: 'antimatter_front', wave: 40, nameKo: '반물질 전선', description: '전원 반물질 폭풍', type: 'antimatter_flood' },
  { id: 'heat_death', wave: 50, nameKo: '열사', description: '이후 매 웨이브 엔트로피 1체 추가', type: 'entropy_permanent' },
];

export function getCrisisForWave(wave: number): CrisisDef | null {
  if (wave % 10 !== 0 || wave === 0) return null;

  const crisis = CRISIS_EVENTS.find((c) => c.wave === wave);
  if (crisis) return crisis;

  if (wave > 50) return CRISIS_EVENTS[4];
  return null;
}
