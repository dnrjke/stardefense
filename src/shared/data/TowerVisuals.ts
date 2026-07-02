/**
 * TowerVisuals — 타워(항성)별 시각 차별화 파라미터.
 *
 * ci(색지수)만으로는 적색왜성(프록시마)과 적색초거성(베텔게우스)처럼
 * 색이 겹치는 항성이 구분되지 않아, 고증 기반의 크기/표면/맥동/색조를 분리 정의한다.
 *  - scale:      메시 지름 배율 (기본 0.6에 곱)
 *  - noiseScale: FBM 표면 노이즈 주파수 배율 (낮을수록 대류 셀이 큼 — 초거성)
 *  - pulseSpeed / pulseAmp: 발광 맥동 (변광성·플레어 성 표현)
 *  - tint:       ci 색상에 곱하는 RGB 보정 (색상 겹침 해소용)
 *
 * TowerData를 수정하지 않는 독립 레이어 (동시 밸런싱 작업과 충돌 방지).
 */

export interface TowerVisual {
  scale: number;
  noiseScale: number;
  pulseSpeed: number;
  pulseAmp: number;
  tint?: [number, number, number];
}

// 기존 셰이더 기본 동작과 동일한 값 (pulse = 0.85 + 0.15·sin(2t))
const DEFAULT_VISUAL: TowerVisual = { scale: 1, noiseScale: 1, pulseSpeed: 2, pulseAmp: 0.15 };

const VISUALS: Record<string, TowerVisual> = {
  // 태양 — 기준 항성
  sol: { scale: 1, noiseScale: 1, pulseSpeed: 2, pulseAmp: 0.15 },
  // 적색왜성 — 작고 진홍색, 미세한 표면, 빠른 플레어 깜빡임
  proxima: { scale: 0.7, noiseScale: 1.9, pulseSpeed: 7, pulseAmp: 0.3, tint: [1.0, 0.75, 1.15] },
  // 백색 주계열 — 매끈하고 밝음
  sirius: { scale: 1.0, noiseScale: 1.15, pulseSpeed: 2.5, pulseAmp: 0.1 },
  // 청색초거성 — 크고 안정적
  rigel: { scale: 1.15, noiseScale: 0.85, pulseSpeed: 1.5, pulseAmp: 0.12 },
  // 적색초거성 — 거대, 큰 대류 셀, 느리고 깊은 맥동, 주황 색조
  betelgeuse: { scale: 1.45, noiseScale: 0.55, pulseSpeed: 0.8, pulseAmp: 0.35, tint: [1.05, 1.35, 0.55] },
  // 마그네타 — 작고 조밀, 고주파 표면·맥동
  magnetar: { scale: 0.85, noiseScale: 2.2, pulseSpeed: 8, pulseAmp: 0.25 },
  // 볼프-레이에 — 항성풍으로 표면이 거칢
  wolf_rayet: { scale: 1.2, noiseScale: 1.5, pulseSpeed: 3, pulseAmp: 0.2 },
};

// 진화형 폴백: specialType 기준 (id가 테이블에 없을 때)
const SPECIAL_FALLBACK: Record<string, TowerVisual> = {
  betelgeuse: VISUALS.betelgeuse,
  flare_star: VISUALS.proxima,
  pulsar: { scale: 0.8, noiseScale: 2.0, pulseSpeed: 10, pulseAmp: 0.3 },
  black_hole: { scale: 0.9, noiseScale: 0.7, pulseSpeed: 0.5, pulseAmp: 0.1 },
};

// 접두 매칭 시 긴 키 우선 (wolf_rayet가 wolf보다 먼저 매칭되도록)
const PREFIX_KEYS = Object.keys(VISUALS).sort((a, b) => b.length - a.length);

export function getTowerVisual(def: { id: string; specialType?: string }): TowerVisual {
  const exact = VISUALS[def.id];
  if (exact) return exact;
  for (const key of PREFIX_KEYS) {
    if (def.id.startsWith(key)) return VISUALS[key];
  }
  if (def.specialType && SPECIAL_FALLBACK[def.specialType]) {
    return SPECIAL_FALLBACK[def.specialType];
  }
  return DEFAULT_VISUAL;
}

/** ci 기반 RGB에 tint를 곱해 최종 항성 색을 산출 (1.0 클램프) */
export function applyVisualTint(rgb: [number, number, number], vis: TowerVisual): [number, number, number] {
  if (!vis.tint) return rgb;
  return [
    Math.min(1, rgb[0] * vis.tint[0]),
    Math.min(1, rgb[1] * vis.tint[1]),
    Math.min(1, rgb[2] * vis.tint[2]),
  ];
}
