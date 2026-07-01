# MPB 실전 구현 가이드

> 이 문서는 `MPB_Handoff.md`(이론·함정)를 읽은 상태에서,
> 실제 코드를 기준으로 **복붙-수정 가능한 구현체**를 제공한다.
> 핸드오프의 모든 함정(§7)은 여기서 코드로 해결된다.

---

## 0. 병행 리팩터 — 왜 지금이 최적인가

MPB 구현은 5개 파일의 `isMobileLandscape()` 4중 복사본과 96개 `mob ?` 삼항을 모두 건드려야 한다.
기능 추가와 리팩터를 분리하면 같은 코드를 두 번 수정하게 된다.
**한 번에 하는 것이 효율적이다.**

### 리팩터 스코프

| 현행 문제 | 해결 | 영향 파일 |
|-----------|------|-----------|
| `isMobileLandscape()` 4중 복사 | `DisplayMode` 싱글턴 | HUD, RadialMenu, MapSelectScreen, MutationSelectUI |
| `mob ?` 삼항 96개 | CSS Custom Properties + `LayoutProfile` (JS-only 값) | 동일 4파일 + FlowController |
| `worldToScreen` 2중 복사 | `ScreenProjection` 유틸리티 | RadialMenu, FlowController |
| `MobileLayout.ts` (39줄) | `DisplayMode`에 완전 흡수 | FlowController (유일 소비자) |

---

## 1. DisplayMode — 환경 감지 싱글턴

> **대상 파일:** `src/shared/ui/DisplayMode.ts` (신규)
> **대체:** HUD.ts:13-17, RadialMenu.ts:12-16, MapSelectScreen.ts:4-8, MutationSelectUI.ts:12-16, MobileLayout.ts 전체

```typescript
// src/shared/ui/DisplayMode.ts

export type DisplayModeType = 'desktop' | 'mobileLandscape' | 'mobilePortrait';

interface DisplayState {
  mode: DisplayModeType;
  /** 캔버스 CSS 회전각 (deg). 0 = 기본, 90 = portrait */
  canvasRotation: 0 | 90;
  /** 뷰포트 크기 (CSS px) */
  vw: number;
  vh: number;
}

type Listener = (state: DisplayState) => void;

class DisplayModeImpl {
  private state: DisplayState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = this.detect();
    window.addEventListener('resize', () => this.update());
    window.visualViewport?.addEventListener('resize', () => this.update());
  }

  private detect(): DisplayState {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    let mode: DisplayModeType;
    if (!hasTouch || vh > 600) {
      mode = 'desktop';
    } else if (vw > vh) {
      mode = 'mobileLandscape';
    } else {
      mode = 'mobilePortrait';
    }

    return {
      mode,
      canvasRotation: mode === 'mobilePortrait' ? 90 : 0,
      vw,
      vh,
    };
  }

  private update() {
    const next = this.detect();
    if (next.mode !== this.state.mode || next.vw !== this.state.vw || next.vh !== this.state.vh) {
      this.state = next;
      applyLayoutVars(next.mode);
      for (const fn of this.listeners) fn(this.state);
    }
  }

  /** 초기화 시 CSS 변수 즉시 적용 */
  init() { applyLayoutVars(this.state.mode); }

  get(): DisplayState { return this.state; }

  get mode(): DisplayModeType { return this.state.mode; }
  get isMobile(): boolean { return this.state.mode !== 'desktop'; }
  get isPortrait(): boolean { return this.state.mode === 'mobilePortrait'; }
  get rotation(): 0 | 90 { return this.state.canvasRotation; }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const displayMode = new DisplayModeImpl();

// ── CSS Custom Properties ──
// 순수 레이아웃 값은 CSS 변수로 관리.
// 새 UI 요소 추가 시 여기에 변수만 추가하면 됨 — TS 인터페이스 변경 불필요.

function si(side: string, fb = '0px'): string {
  return `env(safe-area-inset-${side}, ${fb})`;
}

const CSS_VARS: Record<DisplayModeType, Record<string, string>> = {
  desktop: {
    '--sd-top-h':           '40px',
    '--sd-top-fs':          '14px',
    '--sd-top-gap':         '8px',
    '--sd-top-pad':         '0 16px',
    '--sd-top-pad-l':       `calc(16px + ${si('left')})`,
    '--sd-top-pad-r':       `calc(16px + ${si('right')})`,
    '--sd-back-pad':        '4px 10px',
    '--sd-back-fs':         '12px',
    '--sd-back-minh':       'auto',
    '--sd-bot-gap':         '8px',
    '--sd-bot-pad':         '8px 16px',
    '--sd-bot-pad-l':       `calc(16px + ${si('left')})`,
    '--sd-bot-pad-r':       `calc(16px + ${si('right')})`,
    '--sd-bot-pad-b':       `calc(8px + ${si('bottom')})`,
    '--sd-bot-btn-pad':     '6px 12px',
    '--sd-bot-btn-fs':      '12px',
    '--sd-start-r':         `calc(16px + ${si('right')})`,
    '--sd-start-b':         `calc(76px + ${si('bottom')})`,
    '--sd-start-pad':       '10px 20px',
    '--sd-start-fs':        '14px',
    '--sd-spell-w':         '120px',
    '--sd-spell-fs':        '11px',
    '--sd-spell-gauge-w':   '100px',
    '--sd-spell-gauge-h':   '10px',
    '--sd-spell-r':         '12px',
    '--sd-info-w':          '196px',
    '--sd-info-maxh':       'calc(100dvh - 50px - 72px - 16px)',
    '--sd-tut-top':         '50px',
    '--sd-tut-pad':         '12px 24px',
    '--sd-tut-maxw':        '400px',
    '--sd-wave-fs':         '24px',
    '--sd-syn-top':         '44px',
    '--sd-syn-pad':         '8px 14px',
    '--sd-syn-maxw':        '320px',
    '--sd-mut-top':         '200px',
    '--sd-mut-maxw':        '120px',
    '--sd-mut-r':           '12px',
    '--sd-crisis-top':      '40px',
    '--sd-crisis-pad':      '6px 16px',
    '--sd-crisis-fs':       '13px',
    '--sd-speed-pad':       '4px 12px',
    '--sd-speed-fs':        '13px',
    '--sd-speed-minh':      'auto',
    '--sd-info-fs':         '11px',
    '--sd-wavepreview-fs':  '11px',
    '--sd-wavepreview-maxw':'300px',
  },
  mobileLandscape: {
    '--sd-top-h':           '36px',
    '--sd-top-fs':          '12px',
    '--sd-top-gap':         '4px',
    '--sd-top-pad':         '0 8px',
    '--sd-top-pad-l':       `calc(8px + ${si('left')})`,
    '--sd-top-pad-r':       `calc(8px + ${si('right')})`,
    '--sd-back-pad':        '6px 12px',
    '--sd-back-fs':         '11px',
    '--sd-back-minh':       '32px',
    '--sd-bot-gap':         '4px',
    '--sd-bot-pad':         '6px 6px',
    '--sd-bot-pad-l':       `calc(6px + ${si('left')})`,
    '--sd-bot-pad-r':       `calc(6px + ${si('right')})`,
    '--sd-bot-pad-b':       `calc(6px + ${si('bottom')})`,
    '--sd-bot-btn-pad':     '8px 8px',
    '--sd-bot-btn-fs':      '11px',
    '--sd-start-r':         `calc(8px + ${si('right')})`,
    '--sd-start-b':         `calc(64px + ${si('bottom')})`,
    '--sd-start-pad':       '10px 16px',
    '--sd-start-fs':        '13px',
    '--sd-spell-w':         '90px',
    '--sd-spell-fs':        '9px',
    '--sd-spell-gauge-w':   '72px',
    '--sd-spell-gauge-h':   '8px',
    '--sd-spell-r':         `calc(8px + ${si('right')})`,
    '--sd-info-w':          '148px',
    '--sd-info-maxh':       'calc(100dvh - 50px - 58px - 16px)',
    '--sd-tut-top':         '40px',
    '--sd-tut-pad':         '8px 16px',
    '--sd-tut-maxw':        '90vw',
    '--sd-wave-fs':         '18px',
    '--sd-syn-top':         '38px',
    '--sd-syn-pad':         '6px 10px',
    '--sd-syn-maxw':        '80vw',
    '--sd-mut-top':         '140px',
    '--sd-mut-maxw':        '80px',
    '--sd-mut-r':           `calc(8px + ${si('right')})`,
    '--sd-crisis-top':      '36px',
    '--sd-crisis-pad':      '4px 12px',
    '--sd-crisis-fs':       '11px',
    '--sd-speed-pad':       '6px 14px',
    '--sd-speed-fs':        '12px',
    '--sd-speed-minh':      '32px',
    '--sd-info-fs':         '10px',
    '--sd-wavepreview-fs':  '10px',
    '--sd-wavepreview-maxw':'30vw',
  },
  mobilePortrait: {
    // mobileLandscape 기반, portrait 전용 오버라이드
    '--sd-top-h':           '36px',
    '--sd-top-fs':          '12px',
    '--sd-top-gap':         '4px',
    '--sd-top-pad':         '0 8px',
    '--sd-top-pad-l':       `calc(8px + ${si('left')})`,
    '--sd-top-pad-r':       `calc(8px + ${si('right')})`,
    '--sd-back-pad':        '6px 12px',
    '--sd-back-fs':         '11px',
    '--sd-back-minh':       '32px',
    '--sd-bot-gap':         '4px',
    '--sd-bot-pad':         '6px 6px',
    '--sd-bot-pad-l':       `calc(6px + ${si('left')})`,
    '--sd-bot-pad-r':       `calc(6px + ${si('right')})`,
    '--sd-bot-pad-b':       `calc(6px + ${si('bottom')})`,
    '--sd-bot-btn-pad':     '6px 6px',     // portrait: 더 컴팩트
    '--sd-bot-btn-fs':      '10px',        // portrait: 더 작은 폰트
    '--sd-start-r':         `calc(8px + ${si('right')})`,
    '--sd-start-b':         `calc(64px + ${si('bottom')})`,
    '--sd-start-pad':       '10px 16px',
    '--sd-start-fs':        '13px',
    '--sd-spell-w':         '80px',        // portrait: 더 좁음
    '--sd-spell-fs':        '9px',
    '--sd-spell-gauge-w':   '72px',
    '--sd-spell-gauge-h':   '8px',
    '--sd-spell-r':         `calc(8px + ${si('right')})`,
    '--sd-info-w':          '130px',       // portrait: 좁은 패널
    '--sd-info-maxh':       'calc(100dvh - 50px - 58px - 16px)',
    '--sd-tut-top':         '40px',
    '--sd-tut-pad':         '8px 16px',
    '--sd-tut-maxw':        '90vw',
    '--sd-wave-fs':         '18px',
    '--sd-syn-top':         '38px',
    '--sd-syn-pad':         '6px 10px',
    '--sd-syn-maxw':        '80vw',
    '--sd-mut-top':         '140px',
    '--sd-mut-maxw':        '80px',
    '--sd-mut-r':           `calc(8px + ${si('right')})`,
    '--sd-crisis-top':      '36px',
    '--sd-crisis-pad':      '4px 12px',
    '--sd-crisis-fs':       '11px',
    '--sd-speed-pad':       '6px 14px',
    '--sd-speed-fs':        '12px',
    '--sd-speed-minh':      '32px',
    '--sd-info-fs':         '10px',
    '--sd-wavepreview-fs':  '10px',
    '--sd-wavepreview-maxw':'30vw',
  },
};

function applyLayoutVars(mode: DisplayModeType) {
  const root = document.documentElement.style;
  const vars = CSS_VARS[mode];
  for (const [key, val] of Object.entries(vars)) {
    root.setProperty(key, val);
  }
}
```

### 마이그레이션

```typescript
// ── 기존 (4개 파일에서 제각각) ──
const mob = isMobileLandscape();

// ── 신규 (모든 파일 공통) ──
import { displayMode } from '@/shared/ui/DisplayMode';
const mob = displayMode.isMobile;
// 또는 portrait 분기가 필요한 곳:
const { mode, rotation } = displayMode.get();
```

---

## 2. LayoutProfile — JS-only 값 + CSS 변수 하이브리드

> **설계 원칙:** 순수 레이아웃 값(px, padding, font-size)은 CSS custom property(`--sd-*`)로,
> JS 로직에서 연산에 필요한 값(radius 계산, pixel 비교, Babylon API 인자)만 TS 프로파일로.

### 왜 CSS 변수인가

| 방식 | 새 UI 요소 추가 시 편집 횟수 |
|------|------|
| TS LayoutProfile 전체 | interface 1 + profile 3개 = **4곳** |
| CSS 변수 하이브리드 | `CSS_VARS` 테이블에 행 추가 = **1곳** (+ 소비하는 HTML에서 `var()` 사용) |

> **대상 파일:** `src/shared/ui/LayoutProfile.ts` (신규, 최소화)
> **CSS 변수 테이블:** `DisplayMode.ts` 하단의 `CSS_VARS` (위 §1 참조)

```typescript
// src/shared/ui/LayoutProfile.ts — JS 로직 전용 값만 보유

import type { DisplayModeType } from '@/shared/ui/DisplayMode';

export interface LayoutProfile {
  canvasRotation: 0 | 90;
  topBarHeight: number;       // camera framing, DOM 계산에 사용
  bottomHudHeight: number;    // camera framing occlusion 계산
  radialBtnSize: number;      // show() 내 위치 연산
  radialRadius: number;       // show() 내 삼각함수 연산
  radialFontSize: number;     // DOM 생성 시 직접 대입
  radialRingSize: number;     // DOM 생성 시 직접 대입
  glowKernelSize: number;     // GlowLayer 생성자 인자
  glowIntensity: number;      // GlowLayer.intensity
}

const PROFILES: Record<DisplayModeType, LayoutProfile> = {
  desktop: {
    canvasRotation: 0,
    topBarHeight: 40,
    bottomHudHeight: 72,
    radialBtnSize: 40,
    radialRadius: 52,
    radialFontSize: 10,
    radialRingSize: 56,
    glowKernelSize: 32,
    glowIntensity: 0.5,
  },
  mobileLandscape: {
    canvasRotation: 0,
    topBarHeight: 36,
    bottomHudHeight: 58,
    radialBtnSize: 48,
    radialRadius: 62,
    radialFontSize: 11,
    radialRingSize: 64,
    glowKernelSize: 16,
    glowIntensity: 0.35,
  },
  mobilePortrait: {
    canvasRotation: 90,
    topBarHeight: 36,
    bottomHudHeight: 58,
    radialBtnSize: 48,
    radialRadius: 62,
    radialFontSize: 11,
    radialRingSize: 64,
    glowKernelSize: 16,
    glowIntensity: 0.35,
  },
};

export function getProfile(mode: DisplayModeType): LayoutProfile {
  return PROFILES[mode];
}
```

### 사용 예시: HUD.ts의 mob 삼항 96개 제거

```typescript
// ── 기존 (HUD.ts:217-236) — 30+줄의 mob? 삼항 ──
render() {
  const mob = isMobileLandscape();
  const topH = getTopBarHeight();
  this.topBar.style.height = `${topH}px`;
  this.topBar.style.fontSize = mob ? '12px' : '14px';
  this.bottomBar.style.gap = mob ? '4px' : '8px';
  this.startWaveBtn.style.right = `calc(${mob ? '8px' : '16px'} + ...)`;
  // ... 30줄 더 ...
}

// ── 신규 — CSS 변수로 자동 반영, render()에서 레이아웃 업데이트 불필요 ──
render() {
  // 레이아웃 값은 CSS 변수가 자동 갱신 (DisplayMode.update → applyLayoutVars)
  // render()는 상태(state) 기반 콘텐츠 업데이트만 담당
  const state = this.store.getState();
  this.updateTopBar(state);
  this.updateSpellPanel(state);
  this.updateInfoPanel();
  this.renderBottomBar(state);
  this.updateMutationPanel();
  this.updateCrisisBanner();
}
```

---

## 3. ScreenProjection — worldToScreen 통합 + 회전 보정

> **대상 파일:** `src/shared/ui/ScreenProjection.ts` (신규)
> **대체:** RadialMenu.ts:123-133의 `worldToScreen()` + FlowController.ts:932-940의 인라인 projection

```typescript
// src/shared/ui/ScreenProjection.ts

import * as BABYLON from '@babylonjs/core';
import { displayMode } from '@/shared/ui/DisplayMode';

/**
 * 월드 좌표 → 스크린 CSS px (회전 보정 포함).
 * 
 * 파이프라인:
 *   worldPos → Vector3.Project → ×DPR → +rect → 회전 변환
 */
export function worldToScreen(
  worldPos: BABYLON.Vector3,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine,
): { x: number; y: number } {
  const cam = scene.activeCamera!;
  const projected = BABYLON.Vector3.Project(
    worldPos,
    BABYLON.Matrix.Identity(),
    scene.getTransformMatrix(),
    cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
  );
  const dpr = engine.getHardwareScalingLevel();
  const rect = engine.getRenderingCanvas()!.getBoundingClientRect();

  // 회전 전 캔버스-로컬 좌표 (CSS px)
  const lx = projected.x * dpr;
  const ly = projected.y * dpr;

  if (displayMode.rotation === 0) {
    return { x: lx + rect.left, y: ly + rect.top };
  }

  // CSS rotate(90deg) CW 보정
  // 캔버스 중심 기준 변환: (dx,dy) → (-dy, dx)
  // rect는 회전 후 시각적 경계 (W×H가 뒤집힘)
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // 캔버스 원래 크기 (회전 전): rect가 400×640이면 원래는 640×400
  const origW = rect.height;  // 회전으로 가로세로 교환
  const origH = rect.width;

  // 캔버스 중심 기준 오프셋
  const dx = lx - origW / 2;
  const dy = ly - origH / 2;

  // 90° CW: (dx, dy) → (-dy, dx)
  return {
    x: cx + (-dy),
    y: cy + dx,
  };
}
```

### 마이그레이션

```typescript
// ── RadialMenu.ts ──
// 기존: this.worldToScreen(tower.mesh.position, scene, engine)
// 신규:
import { worldToScreen } from '@/shared/ui/ScreenProjection';
// RadialMenu 클래스에서 worldToScreen 메서드 삭제
// 호출부: worldToScreen(tower.mesh.position, this.scene, this.engine)

// ── FlowController.ts showFloatingIsm() ──
// 기존: 인라인 Vector3.Project + dpr + rect (9줄)
// 신규: const screenPos = worldToScreen(worldPos, this.scene, this.engine);  // 1줄
```

---

## 4. resizeCanvas — portrait 회전 적용

> **대상:** `FlowController.ts:254-280`
> **변경:** 캔버스 CSS transform에 rotate(90deg) 추가, 가로세로 교환
>
> **전제:** FlowController constructor 초기화 시 `displayMode.init()` 호출하여 CSS 변수 적용.
> ```typescript
> import { displayMode } from '@/shared/ui/DisplayMode';
> // constructor 상단에서:
> displayMode.init();
> ```

```typescript
// FlowController.ts — resizeCanvas() 교체

private resizeCanvas() {
  const { mode, canvasRotation } = displayMode.get();
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const targetAspect = 16 / 10;

  let cw: number;
  let ch: number;

  if (canvasRotation === 90) {
    // Portrait: 게임보드(16:10)를 90° 회전하여 표시
    // 뷰포트 기준으로 "회전 후" 보이는 크기를 계산
    // 회전 후 시각적으로 width=ch, height=cw가 됨
    if (vh / vw > targetAspect) {
      cw = vw;
      ch = vw * targetAspect;
    } else {
      ch = vh;
      cw = vh / targetAspect;
    }
  } else {
    if (vw / vh > targetAspect) {
      ch = vh;
      cw = vh * targetAspect;
    } else {
      cw = vw;
      ch = cw / targetAspect;
    }
  }

  this.canvas.style.width = `${cw}px`;
  this.canvas.style.height = `${ch}px`;
  this.canvas.style.position = 'absolute';
  this.canvas.style.left = '50%';
  this.canvas.style.top = '50%';

  if (canvasRotation === 90) {
    this.canvas.style.transform = 'translate(-50%, -50%) rotate(90deg)';
  } else {
    this.canvas.style.transform = 'translate(-50%, -50%)';
  }

  this.engine.resize();

  if (this.screenState === 'gameplay') {
    this.applyCameraFraming();
  }
}
```

### Portrait 레터박스 계산 상세

```
뷰포트: 393×852 (일반적 모바일 portrait)
게임보드: 16:10 (=1.6)

회전 후 시각적: width=ch, height=cw
- 시각적 height(=cw) 기준 aspect: vh/vw = 852/393 = 2.17 > 1.6
  → cw = vw = 393, ch = 393 × 1.6 = 628.8
- 캔버스 실제: 393×628.8 (CSS)
- 회전 후 시각적: 628.8×393 — 뷰포트(393×852) 내에 세로 여백으로 피팅

검증: 628.8 < 852 (뷰포트 높이) ✓, 393 ≤ 393 (뷰포트 폭) ✓
```

---

## 5. Picking 수정 — 수동 역변환 (확정)

> **Babylon 포럼에서 `scene.pointerX/Y`가 CSS transform을 처리한다는 정보가 있었으나,**
> **Babylon 8.44 소스 검증 결과 처리하지 않음이 확인됨.**
>
> `scene.inputManager._updatePointerPosition()` (scene.inputManager.js:134-142):
> ```js
> this._pointerX = evt.clientX - canvasRect.left;
> this._pointerY = evt.clientY - canvasRect.top;
> ```
> `canvasRect`는 `engine.getInputElementClientRect()` = `canvas.getBoundingClientRect()`.
> CSS `rotate(90deg)` 후 `getBoundingClientRect()`는 **회전 후 시각적 바운딩 박스**를 반환하므로,
> `clientX - rect.left`는 회전된 좌표계에서의 잘못된 좌표를 생성한다.
>
> 또한 `scene.pick(x, y)` 내부 (`ray.core.js:606`):
> ```js
> const levelInv = 1 / engine.getHardwareScalingLevel();
> x = x * levelInv - vx;
> ```
> 입력은 CSS px 기준이며 내부에서 렌더 해상도로 변환한다.
> 따라서 **수동 역변환 후 CSS px 기준 좌표를 `scene.pick()`에 전달**하면 된다.

> **대상:** `FlowController.ts` — `scene.onPointerDown`

### 적용된 코드 (S5 완료)

```typescript
this.scene.onPointerDown = (_evt, pickResult) => {
  const state = store.getState();
  if (state.phase === 'gameover') return;
  if (this.radialMenu!.isVisible()) return;

  // CSS rotate(90deg) 보정: Babylon의 기본 pickResult는 회전을 인지하지 못함
  if (displayMode.isPortrait) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const sdx = _evt.clientX - cx;
    const sdy = _evt.clientY - cy;
    // 90° CW 역변환: (sdx, sdy) → (sdy, -sdx)
    const canvasX = sdy + rect.height / 2;
    const canvasY = -sdx + rect.width / 2;
    pickResult = this.scene.pick(canvasX, canvasY);
  }

  if (!pickResult.hit || !pickResult.pickedMesh?.metadata) return;
  const meta = pickResult.pickedMesh.metadata;
  // ... 이하 동일 ...
};
```

> ✅ Babylon 8.44 소스 검증 완료 — 수동 역변환이 유일한 해법.
> `scene.pick(x, y)` 입력은 CSS px 기준. DPR 보정은 Babylon 내부에서 `hardwareScalingLevel`로 처리하므로 별도 불필요.

---

## 6. HP 바 — portrait 오리엔테이션 + 축 충돌 해결

> **대상:** `EnemyEntity.ts:683-711` (생성), `802-815` (업데이트)

### 현행 구조 분석

```
HP 바 메시 (parent = enemy mesh):
  rotation.x = PI/2       ← XY 평면을 XZ 평면으로 눕힘 (탑다운 카메라를 향함)
  position.z = -(radius + 0.12)  ← 적 앞 (스크린 위) — World -Z = 스크린 위
  position.y = 0.02/0.025       ← 약간 띄움
  
HP 감소 시:
  scaling.x = ratio
  position.x = -(width * (1-ratio)) / 2   ← 좌단 고정, 우단 축소
```

### Portrait에서의 문제

```
가로 모드:  "적 위" = World -Z (position.z)
            "HP 축소" = World +X (position.x)
            → 다른 축, 충돌 없음

세로 모드:  "적 위" = World -X (스크린 위 = World -X, §7.6.2)
            → position.x를 "적 위"에 사용
            "HP 축소" = position.x (기존 로직)
            → 같은 축! 합산 필요
            
            "적 앞" = World -Z = 스크린 오른쪽 (portrait)
            → position.z는 스크린 가로 방향으로 바뀜 — HP 바 방향축
```

### 구현: updateHpBarOrientation

```typescript
// EnemyEntity.ts — 새 메서드 추가

/** HP 바를 portrait에 맞게 회전·배치 */
updateHpBarOrientation(portrait: boolean) {
  if (!this.hpBar || !this.hpBarBg) return;
  const offset = this.def.radius + 0.12;

  if (portrait) {
    // counter-rotate: 스크린 가로 정렬
    // rotation.x = PI/2 (이미 설정됨 — XZ 평면)
    // rotation.y로 90° 회전하여 HP 바가 스크린 가로와 정렬
    this.hpBar.rotation.y = Math.PI / 2;
    this.hpBarBg.rotation.y = Math.PI / 2;

    // "적 위" 오프셋: World -X = 스크린 위
    this.hpBar.position.z = 0;
    this.hpBar.position.x = -offset;
    this.hpBarBg.position.z = 0;
    this.hpBarBg.position.x = -offset;
  } else {
    this.hpBar.rotation.y = 0;
    this.hpBarBg.rotation.y = 0;

    this.hpBar.position.x = 0;
    this.hpBar.position.z = -offset;
    this.hpBarBg.position.x = 0;
    this.hpBarBg.position.z = -offset;
  }
}
```

### takeDamage 수정 — 축 충돌 해결

```typescript
// EnemyEntity.ts:806-809 수정

takeDamage(amount: number): boolean {
  // ... 기존 damage 계산 ...
  
  const ratio = Math.max(0, this.hp / this.def.hp);
  if (this.hpBar) {
    this.hpBar.scaling.x = ratio;
    
    const shrinkOffset = -(this.hpBarWidth * (1 - ratio)) / 2;
    
    if (this._isPortrait) {
      // Portrait: position.x = "적 위" 오프셋 + HP 축소 오프셋 (합산)
      const aboveOffset = -(this.def.radius + 0.12);
      this.hpBar.position.x = aboveOffset + shrinkOffset;
    } else {
      // Landscape: 다른 축이므로 단순 대입
      this.hpBar.position.x = shrinkOffset;
    }
    
    // 색상 업데이트 (기존과 동일)
    const mat = this.hpBar.material as BABYLON.StandardMaterial;
    mat.diffuseColor.r = ratio < 0.5 ? 0.9 : 0.2 + (1 - ratio) * 1.4;
    mat.diffuseColor.g = ratio > 0.5 ? 0.9 : ratio * 1.8;
    mat.emissiveColor.r = mat.diffuseColor.r * 0.4;
    mat.emissiveColor.g = mat.diffuseColor.g * 0.4;
  }
  // ...
}
```

### HP 바 fill 방향 검증

`rotation.y = PI/2` 적용 시 로컬 X축이 World -Z로 매핑된다.
Portrait에서 World -Z = 스크린 오른쪽이므로, scaling.x가 줄어들면 **스크린 오른쪽에서 줄어든다.**
이는 가로 모드와 동일한 방향이다. ✓

만약 `rotation.y = -PI/2`를 사용하면 반전된다. 따라서 **`+PI/2`를 사용한다.**

---

## 7. applyCameraFraming — portrait 지원

> **대상:** `FlowController.ts:282-291`
> **현행:** `isMobileLandscapeGameplay()` → landscape에서만 카메라 오프셋
> **변경:** portrait에서도 HUD occlusion 보정

```typescript
// FlowController.ts — applyCameraFraming 교체

private applyCameraFraming() {
  this.camera.targetScreenOffset.set(0, 0);
  const { mode, canvasRotation } = displayMode.get();

  if (mode === 'desktop') {
    this.camera.target.copyFromFloats(0, 0, 0);
    return;
  }

  if (canvasRotation === 0) {
    // mobileLandscape: 기존 로직 (하단 HUD 가림 보정)
    const p = getProfile(mode);
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const bottomHud = p.bottomHudHeight;
    const topHud = p.topBarHeight;
    const occlusion = (bottomHud * 1.6 + topHud * 0.4) / Math.max(vh, 1);
    let offset = this.camera.radius * occlusion * 0.104;
    if (vh <= 340) offset += this.camera.radius * 0.012;
    else if (vh <= 375) offset += this.camera.radius * 0.009;
    else if (vh <= 414) offset += this.camera.radius * 0.005;
    this.camera.target.copyFromFloats(0, 0, -Math.min(offset, this.camera.radius * 0.048));
  } else {
    // mobilePortrait: 회전 후 HUD가 좌우에 위치
    // 90° 회전 → 상단 HUD는 스크린 왼쪽, 하단 HUD는 스크린 오른쪽
    // World +X = 스크린 아래 (portrait) → 카메라 target.x로 보정
    // 초기값 0, 실제 테스트 후 조정
    this.camera.target.copyFromFloats(0, 0, 0);
  }
}
```

---

## 8. showFloatingIsm — worldToScreen 통합 적용

> **대상:** `FlowController.ts:931-950`

```typescript
// FlowController.ts — showFloatingIsm 교체

private showFloatingIsm(amount: number, worldPos: BABYLON.Vector3) {
  const screenPos = worldToScreen(worldPos, this.scene, this.engine);
  const el = document.createElement('div');
  el.textContent = `+${amount}`;
  el.style.cssText = `position:fixed;left:${screenPos.x}px;top:${screenPos.y}px;color:#ff4;font-family:monospace;font-size:14px;font-weight:bold;pointer-events:none;z-index:20;text-shadow:0 0 4px rgba(255,255,0,0.5);transition:all 0.5s ease-out;`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    // 애니메이션 방향: 항상 스크린 위쪽으로 떠오름
    el.style.top = `${screenPos.y - 40}px`;
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 500);
}
```

기존 9줄의 인라인 projection → `worldToScreen` 1줄 호출. 회전 보정 자동 포함.

---

## 9. RadialMenu — worldToScreen 메서드 제거 + show viewport 보정

> **대상:** `RadialMenu.ts`

```typescript
// RadialMenu.ts — 변경사항

// 1. import 추가
import { displayMode } from '@/shared/ui/DisplayMode';
import { getProfile } from '@/shared/ui/LayoutProfile';

// 2. isMobileLandscape() 로컬 함수 삭제
// 3. worldToScreen() 메서드 삭제 (ScreenProjection.ts로 이동)

// 4. show() 메서드 — RadialMenu는 JS 연산(삼각함수)에 px 값을 사용하므로 LayoutProfile 참조
show(screenX: number, screenY: number, items: RadialMenuItem[]) {
  const p = getProfile(displayMode.mode);
  const btnSize = p.radialBtnSize;       // cos/sin 계산에 필요
  const radius = p.radialRadius;         // cos/sin 계산에 필요
  const fontSize = p.radialFontSize;     // DOM 생성 시 직접 대입
  const ringSize = p.radialRingSize;     // DOM 생성 시 직접 대입
  // ... 이하 동일 구조 ...

  // backdrop의 topBarH도 프로파일에서:
  const topBarH = p.topBarHeight;
  backdrop.style.cssText = `position:absolute;top:${topBarH}px;...`;
}
```

> RadialMenu는 버튼 위치를 `cos(angle) * radius`로 계산하므로,
> radius/btnSize는 CSS 변수가 아닌 JS 값(LayoutProfile)으로 유지해야 한다.
> 이것이 CSS 변수와 LayoutProfile을 분리하는 이유의 좋은 예시.

### FlowController에서 RadialMenu 호출 수정

```typescript
// FlowController.ts:638 — 기존
const screenPos = this.radialMenu!.worldToScreen(tower.mesh.position, this.scene, this.engine);
this.radialMenu!.show(screenPos.x, screenPos.y, menuItems);

// 신규
import { worldToScreen } from '@/shared/ui/ScreenProjection';
const screenPos = worldToScreen(tower.mesh.position, this.scene, this.engine);
this.radialMenu!.show(screenPos.x, screenPos.y, menuItems);
```

---

## 10. HUD — CSS 변수 리팩터

HUD.ts는 67개 `mob ?` 삼항의 주전장이다.
CSS 변수 방식에서는 **constructor에서 `var(--sd-*)` 참조로 한 번만 작성**하고,
`render()`에서 레이아웃 업데이트를 완전히 제거한다.

### constructor — var() 참조로 작성

```typescript
// HUD.ts constructor — 기존 mob? 삼항 전부 제거

constructor(store: GameStore) {
  this.store = store;

  // isMobileLandscape() 로컬 함수 삭제
  // getTopBarHeight() import 삭제

  this.container = document.createElement('div');
  this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;font-family:monospace;color:#fff;';
  document.body.appendChild(this.container);

  // Top bar — 모든 수치가 CSS 변수
  this.topBar = document.createElement('div');
  this.topBar.style.cssText = `
    position:absolute;top:0;left:0;right:0;
    height:var(--sd-top-h);
    background:rgba(0,0,0,0.7);
    display:flex;align-items:center;
    gap:var(--sd-top-gap);
    padding:var(--sd-top-pad);
    padding-left:var(--sd-top-pad-l);
    padding-right:var(--sd-top-pad-r);
    pointer-events:auto;
    font-size:var(--sd-top-fs);
    z-index:15;
  `.replace(/\n\s*/g, '');
  this.container.appendChild(this.topBar);

  // Back button
  this.backBtn = document.createElement('button');
  this.backBtn.style.cssText = `
    background:#322;color:#a88;border:1px solid #544;
    padding:var(--sd-back-pad);
    cursor:pointer;font-family:monospace;
    font-size:var(--sd-back-fs);
    border-radius:4px;flex-shrink:0;
    min-height:var(--sd-back-minh);
  `.replace(/\n\s*/g, '');
  this.backBtn.textContent = 'BACK';
  this.backBtn.onclick = () => this.onBack?.();
  this.topBar.appendChild(this.backBtn);

  // Bottom bar
  this.bottomBar = document.createElement('div');
  this.bottomBar.style.cssText = `
    position:absolute;bottom:0;left:0;right:0;
    background:rgba(0,0,0,0.7);
    display:flex;align-items:center;
    gap:var(--sd-bot-gap);
    padding:var(--sd-bot-pad);
    padding-left:var(--sd-bot-pad-l);
    padding-right:var(--sd-bot-pad-r);
    padding-bottom:var(--sd-bot-pad-b);
    pointer-events:auto;
    overflow-x:auto;overflow-y:hidden;
    scrollbar-width:none;-ms-overflow-style:none;
  `.replace(/\n\s*/g, '');
  this.container.appendChild(this.bottomBar);

  // Start wave button
  this.startWaveBtn = document.createElement('button');
  this.startWaveBtn.style.cssText = `
    position:absolute;
    right:var(--sd-start-r);
    bottom:var(--sd-start-b);
    background:#224;color:#aaf;border:2px solid #558;
    padding:var(--sd-start-pad);
    cursor:pointer;font-family:monospace;
    font-size:var(--sd-start-fs);
    font-weight:bold;border-radius:8px;
    pointer-events:auto;display:none;z-index:12;
    text-shadow:0 0 8px rgba(100,120,255,0.4);
  `.replace(/\n\s*/g, '');
  this.startWaveBtn.onclick = () => this.onStartWave?.();
  this.container.appendChild(this.startWaveBtn);

  // ... 나머지 요소도 동일 패턴: mob ? A : B → var(--sd-*) ...
}
```

### render() — 레이아웃 업데이트 삭제

```typescript
// ── 기존 render() ──
render() {
  const mob = isMobileLandscape();
  const topH = getTopBarHeight();
  // 30+줄의 style 업데이트...
  this.topBar.style.height = `${topH}px`;
  this.topBar.style.fontSize = mob ? '12px' : '14px';
  // ...
}

// ── 신규 render() ──
render() {
  // CSS 변수는 DisplayMode.update() → applyLayoutVars()가 자동 갱신.
  // render()는 게임 상태(state) 기반 콘텐츠만 업데이트.
  const state = this.store.getState();
  this.updateTopBar(state);
  this.updateSpellPanel(state);
  this.updateInfoPanel();
  this.renderBottomBar(state);
  this.updateMutationPanel();
  this.updateCrisisBanner();
}
```

### 내부 메서드 — mob: boolean 인자 전부 삭제

```typescript
// 기존
private updateTopBar(state: ..., mob: boolean) { ... }
private renderBottomBar(state: ..., mob: boolean) { ... }

// 신규 — mob 인자 제거, 내부에서 var() 참조이므로 분기 불필요
private updateTopBar(state: ...) { ... }
private renderBottomBar(state: ...) { ... }
```

### 왜 render()에서 레이아웃 코드를 제거할 수 있는가

CSS 변수는 **라이브 바인딩**이다. `applyLayoutVars()`가 `:root`의 `--sd-top-h`를 변경하면,
`var(--sd-top-h)`를 참조하는 모든 요소가 **자동으로 즉시 갱신**된다.
따라서 `render()` 호출 없이도 모드 전환 시 레이아웃이 반영된다.

이것이 96개 삼항을 제거하는 것을 넘어서, **render() 호출 경로 자체를 단순화**하는 핵심 이점.

### Portrait에서 HUD 레이아웃

Portrait에서 캔버스가 90° 회전하지만, **HUD는 DOM 오버레이이므로 회전하지 않는다.**
즉, 사용자의 스크린 방향(세로)에 맞춰 배치된다.

- **상단 바:** 그대로 스크린 상단 (게임보드 왼쪽 변에 인접)
- **하단 바:** 그대로 스크린 하단 (게임보드 오른쪽 변에 인접)
- **스타트웨이브 버튼:** 스크린 우하단 (게임보드 우하단에 인접)
- **정보 패널:** 스크린 좌측 — portrait에서 게임보드와 겹칠 수 있으므로 폭 축소 (`--sd-info-w: 130px`)

---

## 11. MobileLayout.ts 삭제

> **현행 소비자:** FlowController.ts (line 31)
>
> ```typescript
> import { computeMobileCameraTargetOffset, isMobileLandscapeGameplay } from '@/shared/ui/MobileLayout';
> ```

- `isMobileLandscapeGameplay()` → `displayMode.mode === 'mobileLandscape'`
- `computeMobileCameraTargetOffset()` → `applyCameraFraming()`에 인라인 (위 §7)
- `getTopBarHeight()` → `getProfile(displayMode.mode).topBarHeight`
- `estimateBottomHudHeight()` → 프로파일 상수로 대체

파일 삭제 후 import 경로 제거.

---

## 12. MapSelectScreen + MutationSelectUI — CSS 변수 동일 패턴

두 파일 모두 로컬 `isMobileLandscape()` + `mob ?` 삼항 패턴.
HUD와 동일한 CSS 변수 리팩터 적용:

```typescript
// ── 기존 (MapSelectScreen.ts) ──
const mob = isMobileLandscape();
el.style.fontSize = mob ? '12px' : '14px';
el.style.padding = mob ? '8px' : '12px';

// ── 신규 ──
// isMobileLandscape() 로컬 함수 삭제
// mob? 삼항 → var(--sd-*) 참조
el.style.fontSize = 'var(--sd-top-fs)';
el.style.padding = 'var(--sd-bot-pad)';
// 전용 변수가 필요하면 CSS_VARS 테이블에 --sd-mapsel-* 추가
```

MapSelectScreen은 게임플레이 화면이 아니므로 캔버스 회전과 무관.
MutationSelectUI도 풀스크린 모달이므로 회전과 무관.

이 두 파일에서 필요한 것은 **모바일 vs 데스크톱 크기 분기**뿐이며,
이는 CSS 변수가 DisplayMode에 의해 자동 전환되므로 JS에서 분기 로직이 완전히 사라진다.

> **주의:** 이 파일들에 RadialMenu처럼 JS 연산에 px 값이 필요한 곳이 있으면
> LayoutProfile에 해당 필드를 추가한다. 현재 분석으로는 순수 스타일 값만 사용하므로
> CSS 변수만으로 충분하다.

---

## 13. 구현 순서 (의존성 기반)

```
S1. DisplayMode.ts 생성 (CSS_VARS 테이블 포함)       [의존: 없음]
    → displayMode.init() 호출하여 CSS 변수 즉시 적용
S2. LayoutProfile.ts 생성 (JS-only ~9필드)           [의존: S1]
S3. ScreenProjection.ts 생성                         [의존: S1]
S4. FlowController.resizeCanvas() 수정               [의존: S1]
    → 여기서 portrait 렌더링 확인 가능 (회전된 게임보드)
S5. Picking 검증                                     [의존: S4]
    → scene.pointerX/Y가 CSS transform을 처리하는지 테스트
    → 처리하면 그대로, 아니면 폴백 코드(§5) 적용
S6. HUD 리팩터 — mob삼항 67개 → var(--sd-*)          [의존: S1]
    → constructor에서 var() 참조, render() 레이아웃 코드 삭제
    → 내부 메서드에서 mob: boolean 인자 삭제
S7. RadialMenu 리팩터                                [의존: S1, S2, S3]
    → isMobileLandscape 삭제, worldToScreen 삭제
    → show()에서 LayoutProfile의 JS-only 값 참조
S8. MapSelectScreen + MutationSelectUI 리팩터        [의존: S1]
    → mob삼항 → var(--sd-*), isMobileLandscape 삭제
S9. ScreenProjection 적용                            [의존: S3]
    → showFloatingIsm, RadialMenu 호출부 수정
S10. EnemyEntity HP 바                               [의존: S1]
    → updateHpBarOrientation + takeDamage 축 충돌 해결
S11. applyCameraFraming 수정                         [의존: S1, S2]
S12. MobileLayout.ts 삭제                            [의존: S6-S11]
```

### 리스크 순위

| 단계 | 리스크 | 이유 |
|------|--------|------|
| S5 | 🔴 높음 | Babylon 버전별 동작 차이, 실패 시 수동 좌표 변환 필요 |
| S10 | 🟡 중간 | 축 충돌 합산이 시각적으로 올바른지 실기기 확인 필요 |
| S4 | 🟡 중간 | 레터박스 계산이 모든 해상도에서 정확한지 확인 필요 |
| S6-S8 | 🟢 낮음 | 기계적 치환 — mob? → var(--sd-*), 로직 변경 없음 |
| S1-S3 | 🟢 낮음 | 신규 파일, 기존 코드에 영향 없음 |

---

## 14. Babylon 버전 확인

```bash
# package.json에서 Babylon 버전 확인
grep "@babylonjs/core" package.json
```

Babylon 6.x 이상에서는 `scene.pointerX/Y`가 CSS transform을 처리한다고 알려져 있으나,
정확한 동작은 버전과 `InputManager` 구현에 따라 다르다.

---

## 15. 테스트 체크리스트

```
□ Desktop 가로:     기존과 완전 동일 (regression 없음)
□ Mobile 가로:      기존과 완전 동일
□ Mobile 세로:
  □ 게임보드가 90° 회전되어 표시
  □ 레터박스가 올바르게 피팅
  □ 타일 터치 → 올바른 타일에 타워 배치
  □ 타워 터치 → RadialMenu가 타워 위치에 표시
  □ HP 바가 적 위에 가로로 표시, 방향 올바름
  □ +ISM 팝업이 올바른 위치에 표시되고 위로 떠오름
  □ SPAWN/BASE/웨이브 레이블이 올바른 위치
  □ HUD 상단/하단 바 정상 표시
  □ 스펠 패널, 뮤테이션 패널 정상 표시
  □ 세로↔가로 전환 시 레이아웃 즉시 갱신
```

---

## 부록 A: 파일 변경 총정리

| 파일 | 작업 | 삭제 줄 | 추가 줄 (추정) |
|------|------|---------|----------------|
| `DisplayMode.ts` | **신규** — 환경 감지 + CSS_VARS 테이블 + applyLayoutVars | — | ~200 |
| `LayoutProfile.ts` | **신규** — JS-only 값 9필드 | — | ~45 |
| `ScreenProjection.ts` | **신규** | — | ~40 |
| `HUD.ts` | **리팩터** — mob삼항 67개 → var(--sd-*), render() 레이아웃 코드 삭제 | ~100 | ~50 |
| `RadialMenu.ts` | **리팩터** — isMobileLandscape 삭제, worldToScreen 삭제 | ~30 | ~10 |
| `MapSelectScreen.ts` | **리팩터** — isMobileLandscape + mob삼항 17개 → var() | ~20 | ~5 |
| `MutationSelectUI.ts` | **리팩터** — isMobileLandscape + mob삼항 8개 → var() | ~10 | ~5 |
| `FlowController.ts` | **수정** — resizeCanvas, picking, ISM, camera, init | ~30 | ~50 |
| `EnemyEntity.ts` | **추가** — updateHpBarOrientation + takeDamage | 0 | ~30 |
| `MobileLayout.ts` | **삭제** | 39 | 0 |

**총 변경 규모:** ~460줄 (순증 ~175줄)

### CSS 변수 방식의 유지보수 이점

```
기존:  새 UI 요소 추가 시
       → TS interface에 필드 추가
       → DESKTOP 프로파일에 값 추가
       → MOBILE_LANDSCAPE 프로파일에 값 추가
       → MOBILE_PORTRAIT 프로파일에 값 추가
       = 4곳 편집

신규:  새 UI 요소 추가 시
       → CSS_VARS 테이블 3개 모드에 행 추가 (같은 객체 내)
       → 소비 측에서 var(--sd-xxx) 사용
       = 1곳 편집 (JS 연산에 필요하면 +LayoutProfile 1곳)
```
