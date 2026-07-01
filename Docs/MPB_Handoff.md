# MPB 구현 핸드오프 문서

> **작성:** 2026-07-01  
> **전제 문서:** `MPB_Schema.md` (아키텍처), `mpb_mockup.html` (시각 검증), `Mobile_Portrait_Battlefield.md` (원본 콘셉트)  
> **목적:** 이 문서를 읽은 에이전트가 다른 문서를 참조하지 않고도 즉시 착수 가능한 수준의 맥락 전달

---

## 1. MPB란

모바일 세로 화면에서 기존 16:10 게임판을 CSS `rotate(90deg)`로 돌려 표시하는 기능.  
게임 로직·카메라·맵은 완전히 동일하며, **UI(Layer B)만 세로에 맞게 재배치**하고 **캔버스 내부 Screen-Aligned 요소를 counter-rotate**한다.

```
가로 (기존)                   세로 (MPB)
┌────────────────┐            ┌──────┐
│  16:10 canvas  │   rotate   │ top  │
│                │  ───────►  │ bar  │
└────────────────┘            ├──────┤
                              │canvas│ ← 같은 16:10, 90° CW
                              │(10:16│
                              │시각) │
                              ├──────┤
                              │palette│
                              └──────┘
```

---

## 2. 현행 코드 상태 — 제거/변경 대상

### 2.1 `isMobileLandscape()` 5곳 중복

| 파일 | 줄 | `mob ?` 삼항 수 |
|------|----|----------------|
| `src/shared/ui/HUD.ts` | 13 | **67** |
| `src/shared/ui/MapSelectScreen.ts` | 4 | 17 |
| `src/shared/ui/MutationSelectUI.ts` | 12 | 6 |
| `src/shared/ui/RadialMenu.ts` | 12 | 4 |
| `src/app/FlowController.ts` | 285 | 2 |
| **합계** | | **96** |

### 2.2 `MobileLayout.ts` — 흡수 후 삭제

```
src/shared/ui/MobileLayout.ts (39줄)
  ├── isMobileLandscapeGameplay()    → DisplayMode.detect()로 대체
  ├── getTopBarHeight()              → LayoutProfile.topBarH
  ├── estimateBottomHudHeight()      → LayoutProfile에서 계산
  └── computeMobileCameraTargetOffset() → FlowController 내부로 이동
```

`FlowController.ts:31`에서 import 중:
```typescript
import { computeMobileCameraTargetOffset, isMobileLandscapeGameplay } from '@/shared/ui/MobileLayout';
```

### 2.3 FlowController 핵심 위치

| 메서드 | 줄 | 역할 | MPB 변경점 |
|--------|-----|------|-----------|
| `resizeCanvas()` | 254-280 | 캔버스 크기·letterbox | portrait 시 rotate(90deg) 추가 |
| `applyCameraFraming()` | 283-291 | 카메라 프레이밍 | 동일 (16:10 보존) |
| `startMap()` | 300-733 | 게임 플레이 진입 | resizeCanvas 타이밍 이미 수정됨 |
| `showPlacementPreview()` | 765-827 | 고스트 프리뷰 | pick 좌표 역변환 필요 |
| `showFloatingIsm()` | 931-950 | +ISM 팝업 | worldToScreen 회전 변환 필요 |
| `scene.onPointerDown` | 621 | 터치/클릭 입력 | clientToLogical 적용 |

### 2.4 EnemyEntity 체력바

```
src/engines/wave/EnemyEntity.ts
  ├── HP 바 생성: CreatePlane (줄 683-711)
  │     rotation.x = PI/2 (바닥에 눕힘)
  │     position.z = -(def.radius + 0.12) (적 앞 = 화면 위)
  │     parent = this.mesh
  ├── HP 업데이트 (줄 807-809)
  │     scaling.x = ratio
  │     position.x = -(hpBarWidth * (1-ratio))/2
  └── MPB 변경점:
        position.z → position.x 전환
        rotation.y = -PI/2 추가
```

---

## 3. 좌표 변환 — 수학적 정의

모든 변환은 **캔버스 중심을 원점으로** 한다.

### 3.1 정변환 (worldToScreen)
캔버스 내부 좌표 → 스크린 좌표. DOM Overlay(ISM, RadialMenu 등) 배치에 사용.

```
canvasRotation === 90 일 때:
  screen_x = center_x + (-dy)    // dy = canvas_y - canvas_h/2
  screen_y = center_y + dx       // dx = canvas_x - canvas_w/2

정리: (dx, dy) → (-dy, dx)
```

### 3.2 역변환 (clientToLogical)
스크린 터치 좌표 → 캔버스 논리 좌표. Pick(터치 입력) 보정에 사용.

```
canvasRotation === 90 일 때:
  logical_x = center_x + dy      // dy = screen_y - center_y
  logical_y = center_y - dx      // dx = screen_x - center_x

정리: (dx, dy) → (dy, -dx)
```

### 3.3 검증

정변환 후 역변환하면 원래 값이 복원되어야 한다:
```
forward:  (dx, dy) → (-dy, dx) = (sx, sy)
inverse:  (sx, sy) → (sy, -sx) = (dx, -(-dy)) = (dx, dy)  ✓
```

---

## 4. 3레이어 분류 — 새 요소 추가 시 판단 기준

| 질문 | Yes → | No → |
|------|-------|------|
| 화면에서 사용자가 읽어야 하는 텍스트/숫자? | Layer 2 or 3 | Layer 1 |
| DOM 요소로 만들 수 있는가? | **Layer 3** (DOM Overlay) | Layer 2 |
| 3D 씬 내부에 있어야 하는가? | **Layer 2** (Screen-Aligned) | — |
| 그 외 모든 것 | **Layer 1** (World-Aligned) | — |

**원칙: 가능하면 Layer 3(DOM)으로.** 텍스트 렌더링은 DOM이 유리하고, counter-rotate 복잡도가 없다.

---

## 5. 구현 단계 — 상세 체크리스트

### S1. DisplayMode.ts + LayoutProfile.ts 생성 `[위험: 낮음]`

**파일:** `src/shared/ui/DisplayMode.ts`, `src/shared/ui/LayoutProfile.ts`

- [ ] `DisplayMode` 클래스 — `detect()`, `subscribe()`, 싱글턴 export
- [ ] `visualViewport` + `resize` 이벤트 구독
- [ ] `Mode = 'desktop' | 'landscape' | 'portrait'` — detect 로직은 기존 `isMobileLandscape()` + portrait 분기
- [ ] `LayoutProfile` 인터페이스 + `PROFILES` Record + `getProfile(mode)`
- [ ] `canvasRotation: 0 | 90` 필드 포함
- [ ] **기존 코드 변경 없음** — 아직 소비자 없이 파일만 추가

**검증:** `displayMode.mode`가 desktop/landscape/portrait를 올바르게 반환하는지 콘솔에서 확인

### S2. HUD.ts 리팩터링 `[위험: 중간]`

- [ ] `isMobileLandscape()` 로컬 함수 삭제
- [ ] constructor에서 `const mob = isMobileLandscape()` 제거
- [ ] `displayMode.subscribe(() => this.render())` 추가
- [ ] `render()` 메서드 추출 — `getProfile(displayMode.mode)` → profile 기반 스타일
- [ ] **67개 `mob ?` 삼항** → `profile.xxx` 참조로 전환
- [ ] `infoPanelStrategy === 'bottom-sheet'` 분기 추가 (portrait용)
- [ ] `getTopBarHeight()` → `profile.topBarH`로 대체

**검증:** desktop + landscape에서 기존과 동일하게 작동하는지 회귀 테스트

### S3. RadialMenu, MapSelectScreen, MutationSelectUI `[위험: 중간]`

- [ ] 각 파일의 `isMobileLandscape()` 삭제 → `displayMode` import
- [ ] `mob ?` 삼항 → `profile.xxx`
- [ ] RadialMenu: `worldToScreen()`에 회전 변환 적용 (스키마 §3.4 참조)

**검증:** 각 화면별 레이아웃 회귀

### S4. MobileLayout.ts 흡수 → 삭제 `[위험: 낮음]`

- [ ] `computeMobileCameraTargetOffset()` → FlowController 내부 private 메서드로 이동
- [ ] `getTopBarHeight()`, `estimateBottomHudHeight()` → LayoutProfile에서 파생
- [ ] `FlowController.ts:31` import 문 제거
- [ ] `MobileLayout.ts` 파일 삭제

**검증:** `import` 에러 없음, 카메라 오프셋 동일

---

### S5. FlowController: 캔버스 회전 + PickTransform + worldToScreen `[위험: 높음]`

**신규 파일:** `src/shared/ui/PickTransform.ts`

- [ ] `clientToLogical(clientX, clientY, canvas)` — 역변환 `(dy, -dx)`
- [ ] `worldToScreen(worldPos, scene, engine)` — 정변환 `(-dy, dx)`
- [ ] `resizeCanvas()` 수정:
  ```
  profile.canvasRotation === 90 일 때:
    available height = vh - topBarH - bottomH
    canvasH = available * (10/16)
    canvasW = canvasH * (16/10)
    style.transform = 'rotate(90deg)'
  ```
- [ ] `scene.onPointerDown` (줄 621): **portrait에서 Babylon 내부 picking이 깨짐** (§7.7 참조)
  - Babylon이 제공한 pickResult 무시, `clientToLogical` → `scene.pick()` 재호출
  - `scene.pick()`에는 캔버스 해상도 기준 좌표를 전달: `(x - rect.left) / dpr`
- [ ] `showPlacementPreview()` (줄 765): 동일한 pick 보정 적용
- [ ] `showFloatingIsm()` (줄 931): `worldToScreen` 회전 보정 — 파이프라인 최종 단계에서 `(-dy, dx)` 적용 (§7.8)

**주의:**
- `engine.resize()` 호출 타이밍 — canvas CSS 크기 변경 후 반드시 호출
- `scene.pick(x, y)` 좌표 공간: 캔버스 해상도 기준 (CSS px가 아님). `clientToLogical` → DPR 변환 → pick 순서
- `getBoundingClientRect()`는 회전 후 시각적 경계를 반환 (640×400 캔버스 → 회전 후 rect 400×640)
- 목업의 CSS counter-rotate를 Babylon 코드로 번역하지 말 것 (§7.6.3)

**검증:** 3모드(desktop/landscape/portrait) 각각에서:
- 타워 배치 터치 → 올바른 셀에 배치되는가
- 고스트 프리뷰 → 터치 위치에 표시되는가
- RadialMenu → 타워 위에 뜨는가
- +ISM 팝업 → 적 위에 뜨는가

### S6. EnemyEntity: Screen-Aligned 체력바 `[위험: 중간]`

- [ ] `updateHpBarOrientation()` 메서드 추가:
  ```
  portrait:
    hpBar.position.z = 0
    hpBar.position.x = -(def.radius + 0.12)
    hpBar.rotation.y = -PI/2
  landscape/desktop:
    복원 (기존 값)
  ```
- [ ] `displayMode.subscribe` → 전체 적 순회하여 `updateHpBarOrientation()` 호출
- [ ] `updateHp()`의 scaling offset — portrait에서 position.x 축 충돌 해결 (§7.5)
- [ ] HP 바 fill 방향 확인: `rotation.y = -PI/2`면 방향 반전됨 (§7.6.4). 필요 시 `+PI/2`로 변경

**검증:** portrait에서 체력바가 적 위(스크린 기준)에 가로로 표시. HP 감소 시 시각 방향이 가로 모드와 일관되는지 확인

### S7. HUD portrait 전용 레이아웃 `[위험: 중간]`

- [ ] infoPanel: `left-side` absolute → `bottom-sheet` 변환
  - `position: fixed; bottom: 0; border-radius: 12px 12px 0 0`
  - 드래그 닫기 또는 탭 토글
- [ ] topBar: 2단 구성 (row1: BACK+info+speed, row2: wave preview+synergy)
- [ ] bottomBar: 가로 스크롤 팔레트 (기존과 동일 방향, 크기만 조정)
- [ ] Start Wave / Spell Panel: `profile.startWavePlacement`, `profile.spellPlacement` 참조

**검증:** portrait에서 모든 HUD 요소 접근 가능, 전장 가시 영역 확보

### S8. QA — 3모드 회귀 테스트 `[위험: —]`

| 테스트 | desktop | landscape | portrait |
|--------|---------|-----------|----------|
| 맵 선택 화면 레이아웃 | | | |
| 타워 배치 (터치/클릭 정확도) | | | |
| 고스트 프리뷰 위치 | | | |
| RadialMenu 위치 | | | |
| 체력바 방향·위치 | | | |
| +ISM 팝업 위치 | | | |
| infoPanel 열기/닫기 | | | |
| Start Wave / Spell 버튼 | | | |
| 시너지 뱃지 스크롤 | | | |
| orientation 전환 (가로↔세로) 실시간 | | | |
| `resizeCanvas` 타이밍 (canvas display:none→block) | | | |

---

## 6. 목업 ↔ 실제 코드 대응표

목업(`mpb_mockup.html`)의 각 구조가 실제 코드의 어디에 대응하는지:

| 목업 | 실제 코드 | 비고 |
|------|-----------|------|
| `C` (CONFIG 객체) | `LayoutProfile.ts` PROFILES | 수치 집중 |
| `canvasToScreen(…, rotation)` | `worldToScreen()` in PickTransform.ts | Babylon Vector3.Project 포함 |
| `addWorldLayer()` | 변경 없음 (Babylon 씬 자체) | 타워/적/경로 메시 |
| `addScreenAlignedLayer(el, rotation)` | `EnemyEntity.updateHpBarOrientation()` | 3D Plane rotation.y |
| `addOverlayLayer(container, …, rotation)` | `showFloatingIsm()`, RadialMenu, HUD | DOM 요소 배치 |
| `buildView(canvas, overlay, dims, rot, fix)` | `FlowController.resizeCanvas()` + DisplayMode.subscribe | 3레이어 조립 |
| `fixMode` 토글 | 없음 (항상 보정 적용) | 목업 전용 디버그 기능 |
| CSS `rotate(-90deg)` (HP 바) | `rotation.y = ∓PI/2` (Babylon Euler) | **같은 연산이 아님** — §7.6.3 |
| CSS `%` 좌표 | `Vector3.Project` → DPR → rect offset | 파이프라인 구조 자체가 다름 — §7.8 |
| 포인터 좌표 직접 사용 | `clientToLogical` → `scene.pick()` 재호출 | Babylon picking 무효화 — §7.7 |

---

## 7. 함정과 주의사항

### 7.1 `engine.resize()` 타이밍
`canvas.style` 변경 후 `engine.resize()`를 호출해야 Babylon 렌더 버퍼가 갱신된다.
`startMap()`에서 `canvas.style.display = 'block'` 후 `resizeCanvas()` 호출이 이미 수정되어 있음 (이전 버그 수정).

### 7.2 `getBoundingClientRect()` vs CSS 크기
CSS `rotate(90deg)` 적용 시 `getBoundingClientRect()`는 **회전 후 시각적 경계**를 반환.
즉 원래 640×400 캔버스가 회전하면 rect은 400×640을 반환. `worldToScreen`에서 center 계산 시 이 점을 고려.

### 7.3 Babylon picking과 clientToLogical
`scene.pick(x, y)`는 **캔버스 해상도 기준** 좌표를 받는다. `clientToLogical`이 반환하는 값은 CSS 좌표이므로, DPR 변환이 추가로 필요할 수 있다. 현행 `scene.onPointerDown`이 어떤 좌표를 사용하는지 확인 후 적용.

### 7.4 orientation 전환 중 과도 상태
세로→가로 전환 시 `visualViewport` resize 이벤트가 여러 번 발생할 수 있다. `DisplayMode.update()`에서 mode가 실제로 변경된 경우에만 구독자를 통지하도록 이미 설계됨.

### 7.5 HP 바 scaling offset
`updateHp()`에서 `position.x = -(width*(1-ratio))/2`는 **로컬 X축** 기준. portrait에서 `rotation.y = -PI/2`를 적용해도 로컬 X축은 변하지 않으므로 scaling 로직은 변경 불필요. 단, portrait에서 오프셋 방향이 `position.x`로 바뀌므로 HP 감소 오프셋과 위치 오프셋이 같은 축을 사용하게 된다 — **이 충돌을 해결해야 함.**

구체적으로:
```
가로: position.x = -(width*(1-ratio))/2   (scaling offset)
      position.z = -(radius + 0.12)       (적 위 offset) → 다른 축, 충돌 없음

세로: position.x = -(radius + 0.12)       (적 위 offset)
      position.x += -(width*(1-ratio))/2  (scaling offset) → 같은 축! 합산 필요
```

**해결:** portrait에서 HP 바 오프셋을 `position.x`에 합산:
```typescript
if (portrait) {
  this.hpBar.position.x = -(def.radius + 0.12) - (hpBarWidth * (1 - ratio)) / 2;
}
```

### 7.6 목업(HTML/CSS) ≠ 실제(Babylon.js) — 기술 스택 차이 총정리

목업은 시각 검증용 HTML/CSS 2D이고, 실제 프로젝트는 Babylon.js WebGL 3D이다.
**목업의 코드를 실제 코드로 "번역"하면 안 된다.** 아래 대응 관계를 참조하되, 스키마(MPB_Schema.md)의 Babylon 코드를 기준으로 구현한다.

#### 7.6.1 좌표계가 다르다

```
목업 (CSS 2D):
  원점: 좌상단       +X = 오른쪽    +Y = 아래쪽
  
Babylon (3D, left-handed):
  원점: 월드 중심     +X = 오른쪽    +Y = 위쪽     +Z = 앞(화면 안쪽)

카메라 (ArcRotateCamera, alpha=-PI/2, beta=0.1 ≈ 탑다운):
  World +X  →  스크린 오른쪽
  World -Z  →  스크린 위쪽
  World +Y  →  카메라 쪽 (깊이, 화면에 투영되지 않음)
```

따라서 "적 위에 HP 바"는:
- 목업: `top` 값을 줄임 (CSS Y-down에서 위 = 작은 값)
- 실제: `position.z = -(radius + 0.12)` (World -Z = 스크린 위)

#### 7.6.2 CSS rotate(90deg) 후 축 매핑이 바뀐다

| 스크린 방향 | 가로 (CSS 회전 없음) | 세로 (CSS 90° CW) |
|-------------|---------------------|-------------------|
| 스크린 오른쪽 | World +X | World -Z |
| 스크린 위쪽 | World -Z | World -X |
| 스크린 아래쪽 | World +Z | World +X |
| 스크린 왼쪽 | World -X | World +Z |

이 표가 체력바 오프셋 방향 전환(`-Z → -X`)의 근거.

#### 7.6.3 목업의 CSS counter-rotate ≠ Babylon의 3D Euler rotation

```
목업 HP 바:
  transform: translate(-50%,-50%) rotate(-90deg) translateY(-12px)
  → CSS 2D 변환 체인, 시각 검증 전용

실제 HP 바:
  rotation.x = PI/2               (XY평면 → XZ평면으로 눕힘)
  rotation.y = -PI/2              (counter-rotate, 스크린 정렬)
  position.x = -(radius + 0.12)   (World -X = portrait 스크린 위)
  → Babylon Euler 회전 (YXZ 순서)
```

CSS `rotate(-90deg)`와 Babylon `rotation.y = -PI/2`는 **수학적으로 같은 연산이 아니다.** CSS는 2D 평면 회전이고, Babylon은 3D 축 회전(left-handed, YXZ order). 목업 CSS를 Babylon 코드로 옮기려 하지 말 것.

#### 7.6.4 HP 바 fill 방향이 portrait에서 반전될 수 있다

현행 가로 모드에서 HP 바는 **World +X 방향**으로 뻗는다 (스크린 오른쪽).
`scaling.x = ratio` + `position.x = -(width*(1-ratio))/2`로 **오른쪽에서 줄어드는** 시각 효과.

`rotation.y = -PI/2` 적용 시:
- 로컬 X축 → World +Z → portrait 스크린 **왼쪽**
- HP 감소 시 바가 **왼쪽에서 줄어들어** 가로와 시각 방향이 반대

**대안:**
- `rotation.y = +PI/2` 사용 → 로컬 X → World -Z → portrait 스크린 오른쪽 → 가로와 동일 방향
- 이 경우 HP 바 면(face)이 뒤집힐 수 있으므로 `backFaceCulling = false` 확인 또는 plane 방향 조정
- 또는 방향 반전을 수용 (게임성에 영향 없음, 시각적 선호 차이)

이 판단은 구현 시 실제 화면 확인 후 결정.

### 7.7 `scene.onPointerDown`과 CSS 회전 — picking 충돌 (Critical)

**현행 코드 (FlowController.ts:622):**
```typescript
this.scene.onPointerDown = (_evt, pickResult) => {
  if (!pickResult.hit || !pickResult.pickedMesh?.metadata) return;
  // pickResult 기반으로 타워/타일 판별
};
```

Babylon은 내부적으로 PointerEvent의 좌표를 캔버스 픽셀로 변환하여 `scene.pick()`을 호출한다.
**CSS `rotate(90deg)`를 캔버스에 적용하면 Babylon이 이 회전을 인지하지 못하므로, 포인터 좌표 → 캔버스 픽셀 매핑이 틀어진다.**

사용자가 portrait에서 타일 A를 터치하면, Babylon은 회전 전 좌표계의 다른 타일 B를 pick한다.

**해결 방안 (2가지 중 택 1):**

**(A) Babylon 포인터 입력 인터셉트:**
```typescript
// canvas에 도달하기 전에 좌표를 역변환
canvas.addEventListener('pointerdown', (evt) => {
  if (profile.canvasRotation === 90) {
    const { x, y } = clientToLogical(evt.clientX, evt.clientY, canvas);
    // 변환된 좌표로 수동 pick
    const pickResult = scene.pick(
      (x - rect.left) / dpr,
      (y - rect.top) / dpr
    );
    handlePick(pickResult);
  }
}, { capture: true });

// scene.onPointerDown은 portrait에서 비활성화
```

**(B) scene.onPointerDown 내부에서 재-pick:**
```typescript
this.scene.onPointerDown = (_evt, pickResult) => {
  if (profile.canvasRotation === 90) {
    // Babylon이 제공한 pickResult 무시, 재계산
    const { x, y } = clientToLogical(_evt.clientX, _evt.clientY, canvas);
    const rect = canvas.getBoundingClientRect();
    const dpr = engine.getHardwareScalingLevel();
    pickResult = scene.pick(
      (x - rect.left) / dpr,
      (y - rect.top) / dpr
    );
  }
  if (!pickResult.hit) return;
  // ...
};
```

방안 (B)가 기존 구조 변경이 적으므로 권장. 단, `_evt`의 좌표가 이미 Babylon에 의해 소비된 후이므로, `scene.onPointerDown` 콜백 내부에서 재-pick이 시간적으로 안전한지 확인 필요.

### 7.8 `worldToScreen` 파이프라인 — 목업 vs 실제

```
목업 파이프라인:
  pct(col, row)                        셀 → 캔버스 내부 % 좌표
    → canvasToScreen(pctX, pctY, ..., rotation)  % → 스크린 px
    
실제 파이프라인:
  worldPos (BABYLON.Vector3)
    → Vector3.Project(worldPos, ...)   월드 → 캔버스 픽셀 (렌더 해상도)
    → × engine.getHardwareScalingLevel()  DPR 보정
    → + rect.left / rect.top          캔버스 → 뷰포트 CSS px
    → 회전 변환 (-dy, dx)              CSS 회전 보정
    → 최종 스크린 px
```

회전 변환 `(-dy, dx)`은 **파이프라인 최종 단계**(뷰포트 CSS px 공간)에서 적용한다.
Vector3.Project 결과나 캔버스 픽셀 좌표에 적용하면 안 된다.

### 7.9 `getHardwareScalingLevel()` 주의

현행 `worldToScreen` (RadialMenu.ts:130-132):
```typescript
const dpr = engine.getHardwareScalingLevel();
return { x: projected.x * dpr + rect.left, y: projected.y * dpr + rect.top };
```

`getHardwareScalingLevel()`은 `setHardwareScalingLevel()`로 설정된 값을 반환하며, 기본값은 `1 / devicePixelRatio`가 **아닌** `1`이다 (Babylon 엔진이 자체 DPR 처리를 하는 경우). 현행 코드가 desktop/landscape에서 정상 동작하므로 이 값을 그대로 사용하되, portrait 추가 후 좌표가 어긋나면 이 곱셈 로직을 가장 먼저 의심할 것.

---

## 8. 파일 변경 요약

```
신규:
  src/shared/ui/DisplayMode.ts       환경 감지 싱글턴
  src/shared/ui/LayoutProfile.ts     mode → 수치/전략 매핑
  src/shared/ui/PickTransform.ts     clientToLogical + worldToScreen

수정:
  src/shared/ui/HUD.ts               mob 삼항 67개 → profile 참조
  src/shared/ui/RadialMenu.ts        mob 삼항 4개 → profile + worldToScreen 보정
  src/shared/ui/MapSelectScreen.ts   mob 삼항 17개 → profile 참조
  src/shared/ui/MutationSelectUI.ts  mob 삼항 6개 → profile 참조
  src/app/FlowController.ts          resizeCanvas 회전 + pick 보정 + ISM 보정
  src/engines/wave/EnemyEntity.ts    updateHpBarOrientation + HP scaling 축 합산

삭제:
  src/shared/ui/MobileLayout.ts      DisplayMode + LayoutProfile로 완전 대체
```
