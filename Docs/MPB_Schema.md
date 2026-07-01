# MPB 구현 스키마 — DisplayMode + LayoutProfile 아키텍처

> **목적:** MPB를 "누더기 분기"가 아닌, 게임 업데이트·패치 시에도 지속 가능한 구조로 구현하기 위한 설계안  
> **원칙:** 캡슐화, 단일 책임, 구조적 부모-자식 관계, 데이터 주도 레이아웃

---

## 1. 현재 문제점

```
현행: isMobileLandscape() → boolean 하나로 모든 UI가 삼항연산자 분기
```

| 문제 | 영향 |
|------|------|
| `isMobileLandscape()` 5곳 중복 | 탐지 로직 변경 시 누락 → 불일치 |
| HUD 생성자에서 `mob` 캡처 후 **resize 시 재생성 불가** | orientation 변경 시 일부 요소만 업데이트 |
| 모든 수치가 `mob ? A : B` 인라인 | portrait 추가 시 **모든 삼항을 3항으로 변경** → 폭발 |
| infoPanel이 좌측 absolute 고정 | 세로에서 전장 가림, bottom sheet로 바꿀 수 없음 |

---

## 2. 핵심 구조: DisplayMode + LayoutProfile

```
┌─────────────────────────────────────────────────────────┐
│                    DisplayMode (싱글턴)                   │
│  viewport 감시 → mode: desktop | landscape | portrait    │
│  change 이벤트 발행                                      │
├─────────────────────────────────────────────────────────┤
│              LayoutProfile (데이터 객체)                  │
│  mode별 수치·동작 정의 — UI 컴포넌트가 참조               │
│  topBarH, fontSize, padding, infoPanel 위치 전략 등       │
└─────────────────────────────────────────────────────────┘
         ↓ 소비
┌─────────────────────────────────────────────────────────┐
│  HUD / RadialMenu / MapSelectScreen / MutationSelectUI  │
│  LayoutProfile만 읽고 렌더 — mode 판단 로직 없음          │
└─────────────────────────────────────────────────────────┘
```

### 2.1 DisplayMode — 환경 감지 단일 책임

```typescript
// src/shared/ui/DisplayMode.ts

export type Mode = 'desktop' | 'landscape' | 'portrait';

export interface DisplayModeState {
  mode: Mode;
  vw: number;
  vh: number;
  isTouch: boolean;
}

class DisplayMode {
  private _state: DisplayModeState;
  private _listeners: Set<(state: DisplayModeState) => void> = new Set();

  constructor() {
    this._state = this.detect();
    window.addEventListener('resize', () => this.update());
    window.visualViewport?.addEventListener('resize', () => this.update());
  }

  private detect(): DisplayModeState {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    let mode: Mode;
    if (!isTouch || vh > 600) {
      mode = 'desktop';
    } else if (vw > vh) {
      mode = 'landscape';
    } else {
      mode = 'portrait';
    }
    return { mode, vw, vh, isTouch };
  }

  private update() {
    const next = this.detect();
    const changed = next.mode !== this._state.mode
                 || next.vw !== this._state.vw
                 || next.vh !== this._state.vh;
    this._state = next;
    if (changed) {
      for (const fn of this._listeners) fn(this._state);
    }
  }

  get state() { return this._state; }
  get mode() { return this._state.mode; }

  subscribe(fn: (state: DisplayModeState) => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}

export const displayMode = new DisplayMode();
```

**핵심:**
- `isMobileLandscape()` 5곳 중복 → `displayMode.mode` 단일 진실
- resize/visualViewport 이벤트 → 자동 mode 전환 + 구독자 통지
- **portrait 추가 시 `detect()` 하나만 수정**

---

### 2.2 LayoutProfile — 수치·전략 캡슐화

```typescript
// src/shared/ui/LayoutProfile.ts

import type { Mode } from './DisplayMode';

export interface LayoutProfile {
  // ── Top Bar ──
  topBarH: number;
  fontSize: number;
  topBarGap: number;
  topBarPadX: string;

  // ── Bottom Bar ──
  bottomPadding: string;
  bottomGap: number;
  paletteDirection: 'row';  // 항상 row, 방향은 동일
  paletteFontSize: number;
  paletteMinH: number;

  // ── Info Panel ──
  infoPanelStrategy: 'left-side' | 'bottom-sheet';
  infoPanelWidth: string;

  // ── Start Wave Button ──
  startWavePlacement: { right: string; bottom: string };

  // ── Spell Panel ──
  spellPlacement: { position: 'right-col' | 'bottom-right'; right: string; top?: string; bottom?: string };
  spellBtnWidth: number;

  // ── Radial Menu ──
  radialBtnSize: number;
  radialRadius: number;

  // ── Canvas ──
  canvasRotation: number;  // 0 or 90

  // ── 기타 ──
  safeAreaPadding: boolean;
  compactLabels: boolean;
}

const PROFILES: Record<Mode, LayoutProfile> = {
  desktop: {
    topBarH: 40,
    fontSize: 14,
    topBarGap: 8,
    topBarPadX: '16px',
    bottomPadding: '8px 16px',
    bottomGap: 8,
    paletteDirection: 'row',
    paletteFontSize: 12,
    paletteMinH: 0,
    infoPanelStrategy: 'left-side',
    infoPanelWidth: '196px',
    startWavePlacement: { right: '16px', bottom: '76px' },
    spellPlacement: { position: 'right-col', right: '12px', top: '48px' },
    spellBtnWidth: 120,
    radialBtnSize: 40,
    radialRadius: 52,
    canvasRotation: 0,
    safeAreaPadding: false,
    compactLabels: false,
  },
  landscape: {
    topBarH: 36,
    fontSize: 12,
    topBarGap: 4,
    topBarPadX: '8px',
    bottomPadding: '6px 6px',
    bottomGap: 4,
    paletteDirection: 'row',
    paletteFontSize: 11,
    paletteMinH: 44,
    infoPanelStrategy: 'left-side',
    infoPanelWidth: '148px',
    startWavePlacement: { right: '8px', bottom: '64px' },
    spellPlacement: { position: 'right-col', right: '8px', top: '44px' },
    spellBtnWidth: 90,
    radialBtnSize: 48,
    radialRadius: 62,
    canvasRotation: 0,
    safeAreaPadding: true,
    compactLabels: true,
  },
  portrait: {
    topBarH: 44,
    fontSize: 12,
    topBarGap: 4,
    topBarPadX: '12px',
    bottomPadding: '6px 8px',
    bottomGap: 4,
    paletteDirection: 'row',
    paletteFontSize: 11,
    paletteMinH: 40,
    infoPanelStrategy: 'bottom-sheet',
    infoPanelWidth: '100%',
    startWavePlacement: { right: '8px', bottom: '8px' },
    spellPlacement: { position: 'bottom-right', right: '8px', bottom: '8px' },
    spellBtnWidth: 60,
    radialBtnSize: 44,
    radialRadius: 56,
    canvasRotation: 90,
    safeAreaPadding: true,
    compactLabels: true,
  },
};

export function getProfile(mode: Mode): LayoutProfile {
  return PROFILES[mode];
}
```

**핵심:**
- **모든 레이아웃 수치가 한 파일, 한 테이블** — 새 모드 추가 = 레코드 1개 추가
- UI 코드에서 `mob ? X : Y` 삼항 소멸 → `profile.topBarH` 참조
- `infoPanelStrategy` 같은 **전략 필드**로 동작 분기 (left-side vs bottom-sheet)
- `canvasRotation`으로 Layer A 회전 여부 결정

---

## 3. 컴포넌트별 적용

### 3.1 HUD — LayoutProfile 소비자

```
현행:  constructor에서 mob 캡처 → 수백 줄의 mob ? A : B
개선:  render()에서 getProfile(displayMode.mode) → profile 기반 스타일 적용
```

```typescript
// HUD.ts 핵심 변경 (개념)

import { displayMode } from './DisplayMode';
import { getProfile } from './LayoutProfile';

export class HUD {
  constructor(store: GameStore) {
    // DOM 요소 생성 (수치 없이 구조만)
    this.createElements();

    // 최초 렌더
    this.render();

    // mode 변경 시 전체 재렌더
    displayMode.subscribe(() => this.render());
  }

  render() {
    const p = getProfile(displayMode.mode);
    this.applyLayout(p);
    this.updateContent(this.store.getState(), p);
  }

  private applyLayout(p: LayoutProfile) {
    this.topBar.style.height = `${p.topBarH}px`;
    this.topBar.style.fontSize = `${p.fontSize}px`;
    // ... profile 값으로 스타일 적용

    if (p.infoPanelStrategy === 'bottom-sheet') {
      this.infoPanel.style.cssText = '/* bottom sheet 스타일 */';
    } else {
      this.infoPanel.style.cssText = '/* left side 스타일 */';
    }
  }
}
```

**관계:** `DisplayMode` → (이벤트) → `HUD.render()` → `LayoutProfile` 참조

### 3.2 FlowController — 캔버스 회전

```typescript
// FlowController.ts 핵심 변경 (개념)

private resizeCanvas() {
  const { mode, vw, vh } = displayMode.state;
  const profile = getProfile(mode);
  const targetAspect = 16 / 10;

  // 16:10 letterbox 계산 (기존 동일)
  let cw: number, ch: number;
  if (vw / vh > targetAspect) { ch = vh; cw = vh * targetAspect; }
  else { cw = vw; ch = vw / targetAspect; }

  if (profile.canvasRotation === 90) {
    // 세로 viewport에서 16:10 판을 90° 회전 표시
    // 회전 후 10:16 비율이 됨 → viewport 높이에 맞춤
    const availH = vh - profile.topBarH - estimateBottomH(profile);
    const rotatedW = availH * (10/16);
    this.canvas.style.width = `${availH}px`;
    this.canvas.style.height = `${rotatedW}px`;
    this.canvas.style.transform = 'translate(-50%, -50%) rotate(90deg)';
  } else {
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.style.transform = 'translate(-50%, -50%)';
  }

  this.engine.resize();
  if (this.screenState === 'gameplay') {
    this.applyCameraFraming();
  }
}
```

### 3.3 Pick 역변환 — 회전 보정 유틸

```typescript
// src/shared/ui/PickTransform.ts

import { displayMode } from './DisplayMode';
import { getProfile } from './LayoutProfile';

/**
 * 화면 좌표 → 논리 좌표 변환 (회전 보정 포함)
 * scene.onPointerDown 이전에 적용
 */
export function clientToLogical(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const profile = getProfile(displayMode.mode);

  if (profile.canvasRotation === 90) {
    // 90° 회전 역변환
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    return { x: cx + dy, y: cy - dx };
  }

  return { x: clientX, y: clientY };
}
```

### 3.4 worldToScreen — 회전 정변환

```typescript
// RadialMenu.ts / FlowController.ts 공용

export function worldToScreen(
  worldPos: BABYLON.Vector3,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
): { x: number; y: number } {
  const projected = BABYLON.Vector3.Project(
    worldPos,
    BABYLON.Matrix.Identity(),
    scene.getTransformMatrix(),
    scene.activeCamera!.viewport.toGlobal(
      engine.getRenderWidth(), engine.getRenderHeight()
    ),
  );
  const dpr = engine.getHardwareScalingLevel();
  const rect = engine.getRenderingCanvas()!.getBoundingClientRect();
  let x = projected.x * dpr + rect.left;
  let y = projected.y * dpr + rect.top;

  const profile = getProfile(displayMode.mode);
  if (profile.canvasRotation === 90) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    x = cx - dy;
    y = cy + dx;
  }

  return { x, y };
}
```

---

## 4. 캔버스 내부 3레이어 — 회전 시 요소 분류

CSS `rotate(90deg)`로 캔버스를 돌리면 **내부 WebGL 픽셀 전체**가 회전한다.
이때 요소별로 처리가 다르며, 이를 **구조적으로 분류**해야 새 요소 추가 시에도 자동으로 올바른 처리가 적용된다.

```
┌──────────────────────────────────────────────────────────────────┐
│ DOM Overlay (Layer 3)                                            │
│ 캔버스 밖 DOM — 항상 정립, worldToScreen 좌표 변환만              │
│ HUD, RadialMenu, 플로팅 ISM, Start Wave, Spell Panel             │
├──────────────────────────────────────────────────────────────────┤
│ Screen-Aligned in Scene (Layer 2)                                │
│ 씬 내부 3D 메시지만 화면 기준 정렬 필요                           │
│ 적 체력바, (향후) 데미지 텍스트, 상태 아이콘 등                    │
│ → counter-rotate + anchor offset                                 │
├──────────────────────────────────────────────────────────────────┤
│ World-Aligned (Layer 1)                                          │
│ 월드 좌표 기준 — 회전과 함께 자연스럽게 돌아감                     │
│ 타워/적 메시, 경로 타일, 고스트 Sphere, 범위 Disc, 성운, 스펠     │
│ → 조치 없음 (탑다운 대칭)                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Screen-Aligned 패턴 — 핵심 구현

캔버스가 90° 회전하면 **화면 기준 "위"가 캔버스 좌표계에서 다른 방향**이 된다.
단순히 `rotate(-90deg)`만 하면 요소가 **자기 중심 기준**으로 돌아가서 위치가 어긋난다.
**피벗(anchor) = 부모 엔티티 중심**으로 회전+재배치해야 한다.

| 속성 | 가로 (기준) | 세로 (MPB) | 원리 |
|------|------------|-----------|------|
| 체력바 **오프셋 방향** | `position.z = -(r + 0.12)` (적 앞=화면 위) | `position.x = -(r + 0.12)`, `position.z = 0` | 캔버스 -Z가 화면 위 → 90° 회전 후 -X가 화면 위 |
| 체력바 **회전** | `rotation.x = PI/2` | `rotation.x = PI/2, rotation.y = -PI/2` | 바닥에 눕힌 후 Y축 -90° → 화면에서 가로 |
| 체력바 **스케일링** | `scaling.x = ratio` | `scaling.x = ratio` (동일) | 로컬 X축 기준 — 월드 회전과 무관 |

```typescript
// EnemyEntity.ts — Screen-Aligned 적용 예시
private updateHpBarOrientation() {
  if (!this.hpBar || !this.hpBarBg) return;
  const isPortrait = displayMode.mode === 'portrait';

  if (isPortrait) {
    // 피벗 = 적 mesh 중심, 오프셋 방향 전환 (-Z → -X)
    this.hpBar.position.z = 0;
    this.hpBar.position.x = -(this.def.radius + 0.12);
    this.hpBar.rotation.y = -Math.PI / 2;
    this.hpBarBg.position.z = 0;
    this.hpBarBg.position.x = -(this.def.radius + 0.12);
    this.hpBarBg.rotation.y = -Math.PI / 2;
  } else {
    // 원래 위치 복원
    this.hpBar.position.x = 0; // scaling offset은 updateHp에서 처리
    this.hpBar.position.z = -(this.def.radius + 0.12);
    this.hpBar.rotation.y = 0;
    this.hpBarBg.position.x = 0;
    this.hpBarBg.position.z = -(this.def.radius + 0.12);
    this.hpBarBg.rotation.y = 0;
  }
}
```

**⚠ HP scaling offset 축 충돌:**

가로에서 HP 감소 시 `position.x = -(width*(1-ratio))/2` (scaling offset)을 사용하고,
위치 오프셋은 `position.z` (다른 축) → 충돌 없음.

세로에서는 위치 오프셋이 `position.x = -(radius+0.12)`로 바뀌므로 **같은 축에서 두 값이 합산**되어야 한다:
```typescript
// updateHp() 내부 — portrait 분기
if (isPortrait) {
  this.hpBar.position.x = -(this.def.radius + 0.12) - (hpBarWidth * (1 - ratio)) / 2;
} else {
  this.hpBar.position.x = -(hpBarWidth * (1 - ratio)) / 2;
}
```

**DisplayMode 구독으로 자동 전환:**
```typescript
// EnemyEntity constructor 또는 WaveEngine에서
displayMode.subscribe(() => {
  for (const enemy of this.enemies) {
    enemy.updateHpBarOrientation();
  }
});
```

### 4.2 새 Screen-Aligned 요소 추가 시 체크리스트

향후 데미지 텍스트, 상태 아이콘 등을 씬 내부에 추가할 때:

1. **"이 요소는 화면 기준으로 읽혀야 하는가?"** → Yes면 Screen-Aligned
2. 오프셋 방향: 가로의 `-Z`를 세로의 `-X`로 전환
3. 회전: `rotation.y = -PI/2` 추가
4. `displayMode.subscribe`로 전환 시 자동 갱신
5. **아니면 DOM Overlay로 빼는 것이 더 나은지 판단** (텍스트는 대체로 DOM이 유리)

---

## 5. 의존 관계 (부모-자식)

```
DisplayMode (싱글턴, 환경 감지)
  │
  ├── LayoutProfile (순수 데이터, mode → 수치/전략 매핑)
  │
  ├── FlowController (Canvas 크기·회전, 카메라 프레이밍)
  │     ├── PickTransform (clientToLogical — 입력 역변환)
  │     └── worldToScreen (출력 정변환)
  │
  ├── EnemyEntity (Screen-Aligned: 체력바 orientation)
  │     └── displayMode.subscribe → updateHpBarOrientation
  │
  ├── HUD (DOM Overlay — LayoutProfile 소비)
  │
  ├── RadialMenu (DOM Overlay — worldToScreen 사용)
  │
  ├── MapSelectScreen (DOM — LayoutProfile 소비)
  │
  └── MutationSelectUI (DOM — LayoutProfile 소비)
```

**관계 규칙:**
1. `DisplayMode`만 viewport를 감시 — 다른 모듈은 **직접 감지 금지**
2. `LayoutProfile`은 순수 데이터 — 사이드이펙트 없음
3. DOM UI 컴포넌트는 `DisplayMode` 구독 + `LayoutProfile` 참조
4. Screen-Aligned 씬 요소는 `DisplayMode` 구독 + orientation 전환
5. World-Aligned 씬 요소는 **아무것도 하지 않음**
6. 새 요소 추가 시 → **3레이어 중 어디에 속하는지 먼저 분류**

---

## 6. 파일 구조 (변경·신규)

```
src/shared/ui/
  DisplayMode.ts      [신규] 환경 감지 싱글턴
  LayoutProfile.ts    [신규] mode → 수치/전략 매핑
  PickTransform.ts    [신규] 입력 좌표 회전 역변환
  HUD.ts              [수정] mob 삼항 → profile 참조
  RadialMenu.ts       [수정] mob 삼항 → profile 참조, worldToScreen 회전 보정
  MapSelectScreen.ts  [수정] mob 삼항 → profile 참조
  MutationSelectUI.ts [수정] mob 삼항 → profile 참조
  MobileLayout.ts     [삭제/흡수] DisplayMode + LayoutProfile로 대체

src/app/
  FlowController.ts   [수정] resizeCanvas 회전 분기, PickTransform 적용
```

---

## 7. 유지보수 시나리오별 검증

| 시나리오 | 현행 (누더기) | 스키마 적용 후 |
|----------|--------------|----------------|
| **새 모드 추가** (태블릿 등) | 5개 파일에 분기 추가, 수백 줄 삼항 변경 | `DisplayMode.detect()`에 조건 1줄 + `PROFILES`에 레코드 1개 |
| **topBar 높이 변경** | HUD.ts, MobileLayout.ts, RadialMenu.ts 각각 수정 | `LayoutProfile.topBarH` 하나만 변경 |
| **infoPanel 세로 전용 UX 변경** | HUD.ts에 portrait 조건 하드코딩 | `infoPanelStrategy` 값 변경 또는 신규 전략 추가 |
| **pick 좌표 버그** | FlowController에 ad-hoc 보정 | `PickTransform.clientToLogical` 단일 유틸 수정 |
| **mode 전환 중 어긋남** | resize 이벤트 누락 시 미반영 | `DisplayMode` 구독 → 전 컴포넌트 일괄 갱신 |

---

## 8. 구현 순서 (제안)

| 단계 | 내용 | 위험도 |
|------|------|--------|
| **S1** | `DisplayMode.ts` + `LayoutProfile.ts` 생성 | 낮음 (신규 파일) |
| **S2** | HUD.ts 리팩터링: `mob` 삼항 → `profile` 참조 | 중간 (기존 동작 보존 필요) |
| **S3** | RadialMenu, MapSelectScreen, MutationSelectUI 동일 리팩터링 | 중간 |
| **S4** | `MobileLayout.ts` 흡수 → 삭제 | 낮음 |
| **S5** | FlowController: canvas 회전 래퍼 + `PickTransform` + `worldToScreen` | 높음 (Layer A) |
| **S6** | EnemyEntity: Screen-Aligned 체력바 orientation 전환 | 중간 (Layer 2) |
| **S7** | HUD portrait 전용 레이아웃 (bottom sheet 등) | 중간 (Layer B) |
| **S8** | QA: desktop / landscape / portrait 3모드 회귀 | — |

S1~S4는 **MPB 구현 전 리팩터링** — 기존 동작을 변경하지 않으면서 구조만 정리.
S5~S7이 **실제 MPB 구현**. S6이 이번 논의의 핵심 — Screen-Aligned 패턴.

---

## 9. 요약

```
Before:  isMobileLandscape() → 300줄의 mob ? A : B → 세 번째 모드 추가 불가능

After:   DisplayMode (감지)
           → LayoutProfile (수치 테이블)
             → UI 컴포넌트 (profile 소비)
               → PickTransform (좌표 보정)

추가 비용: 파일 3개 (DisplayMode, LayoutProfile, PickTransform)
제거 비용: MobileLayout.ts 삭제, isMobileLandscape() 5곳 중복 제거
```
