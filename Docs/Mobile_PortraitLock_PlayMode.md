# 모바일 화면 세로 잠금 플레이 모드 — 기획안

> **공식 명칭:** 모바일 화면 세로 잠금 플레이 모드 (Portrait Lock Play Mode, PLPM)  
> **대상:** Star Defense 웹 (Babylon.js + TypeScript)  
> **작성:** 2026-06-28  
> **상태:** 기획 (미구현)

---

## 1. 한 줄 요약

OS 화면 방향을 **세로(portrait)로 고정한 채**, 게임·UI·입력 전체를 **90° 회전된 좌표계로 제작**한다.  
플레이어는 **기기를 물리적으로 가로로 돌려** 잡고 플레이하며, 그때의 체감은 **일반 모바일 가로 플레이와 동등**해야 한다.

---

## 2. 배경 및 문제

### 2.1 현재 모바일 전제

현재 Star Defense 모바일 최적화는 **OS가 가로(landscape)로 보고할 때**를 전제로 한다.

| 항목 | 현재 조건 |
|------|-----------|
| 모바일 가로 판별 | `touch && vh <= 600 && vw > vh` |
| HUD / RadialMenu | 가로 viewport 기준 레이아웃 |
| 카메라 HUD 보정 | `MobileLayout.computeMobileCameraTargetOffset()` — 가로 전용 |
| 캔버스 비율 | 16:10, `FlowController.resizeCanvas()` |

### 2.2 세로 잠금 사용자의 문제

많은 사용자가 휴대폰 **화면 회전 잠금을 세로로 켠 상태**로 브라우저에 접속한다.

- OS는 viewport를 **세로(`width < height`)** 로 유지
- `vw > vh` 조건을 만족하지 않아 **모바일 가로 레이아웃·카메라 보정이 적용되지 않음**
- 16:10 게임 영역이 세로 화면 중앙의 **좁은 띠**로만 표시됨
- OS에 가로 강제(`orientation: landscape`, `screen.orientation.lock`)는 **일반 브라우저 탭에서 불가능**에 가깝고, iOS Safari는 특히 제한적

### 2.3 PLPM이 해결하는 것

**OS 방향은 세로로 두되**, 앱 내부를 **처음부터 90° 돌린 상태**로 설계한다.

플레이어가 기기를 옆으로 돌려 잡으면:

- 눈에 보이는 UI·맵·텍스트는 **정상 가로 TD**처럼 읽히고
- playable area는 세로 viewport의 **긴 변(논리적 가로)** 을 최대한 활용한다.

즉 **“세로 잠금 + 기기를 돌려서 플레이”** 를 1급 지원 시나리오로 만든다.

---

## 3. 핵심 컨셉

### 3.1 설계 철학

| ❌ 아닌 것 | ✅ 맞는 것 |
|-----------|-----------|
| 세로 화면 안에 가로 게임을 letterbox로 넣기 | 세로 viewport 전체를 **회전 좌표계**로 사용 |
| OS 가로 모드 강제 | OS는 세로, **앱만 90° 회전** |
| 플레이어가 세로로 들고 플레이 | 플레이어는 **기기를 가로로 돌려** 플레이 (전제) |
| 임시 CSS 트릭 | UI·캔버스·입력·카메라가 **동일 회전 기준** |

### 3.2 플레이어 여정

```
[1] 접속 — OS 세로 잠금 ON, viewport 세로 (예: 390×844)
[2] 최초 화면 — (선택) "기기를 가로로 돌려 주세요" 3초 안내
[3] 기기를 90° 회전해 옆으로 든 상태
[4] PLPM 활성 — 회전된 UI/맵이 눈 기준으로 정상 방향
[5] 일반 모바일 가로 TD와 유사한 빌드·웨이브·HUD 조작
```

### 3.3 체감 목표

- **가독성:** 한글 HUD, 타워 이름, RadialMenu 라벨이 돌린 상태에서 정방향
- **조작성:** 타일 탭·타워 배치·메뉴 선택 위치가 손가락과 일치
- **시야:** 맵 하단이 bottom HUD에 가리지 않음 (기존 카메라 오프셋 목표와 동일)
- **일관성:** 동일 맵·동일 밸런스·동일 게임 로직 (회전은 **표현·입력 계층**만)

---

## 4. 모드 분류 (3-way)

PLPM 도입 후 디스플레이 모드는 세 가지로 나뉜다.

| 모드 ID | 조건 | 동작 |
|---------|------|------|
| `desktop` | 터치 없음 또는 `vh > 600` | 현행 데스크톱 레이아웃 |
| `mobile_landscape` | `touch && vh <= 600 && vw > vh` | **현행** 모바일 가로 (회전 없음) |
| `mobile_portrait_lock` (PLPM) | `touch && vh <= 600 && vh > vw` | **신규** 90° 회전 좌표계 |

> **중요:** 잠금 해제 사용자가 기기를 돌리면 OS가 `mobile_landscape`로 전환될 수 있다.  
> PLPM은 **OS가 세로로 보고하는 동안만** 활성화하고, `vw > vh`가 되면 **자동으로 `mobile_landscape`로 전환**한다.  
> 두 모드 간 **체감은 동일**해야 하며, 이중 회전이 발생하면 안 된다.

### 4.1 PLPM 활성화 방식 (미결 — 프로토타입 후 확정)

PLPM을 **언제·어떻게 켤지**는 기획 단계에서 단정하지 않는다.  
세로 viewport + 90° 회전 UX, 안내 문구 필요 여부, 설정 UI 부담 등은 **실제 프로토타입과 실기 테스트** 후에 결정한다.

| 후보 | 설명 | 장점 | 우려 |
|------|------|------|------|
| **A. 자동 적용** | `mobile_portrait_lock` 조건(`touch && vh <= 600 && vh > vw`)이면 즉시 PLPM | 추가 UI 없음, 세로 잠금 사용자가 바로 플레이 | 세로로 든 채 접속 시 화면이 돌아가 보임 — 안내 없으면 혼란 가능 |
| **B. 인게임 설정** | 설정(또는 맵 선택 화면)에서 「세로 잠금 플레이 모드」ON/OFF | 사용자가 의도적으로 선택, A에서의 혼란 완화 | 설정 진입·설명 비용, OFF 상태에서 세로 잠금 UX는 여전히 불리 |
| **C. 하이브리드** | 최초 1회 안내 + 기본 자동, 설정에서 끄거나 수동 전환 | A·B 절충 | 구현·QA 범위 증가, 기본값 정책을 또 정해야 함 |

**v1 구현 시 권장:**

- `DisplayMode` / 회전·입력 파이프라인은 **A·B·C 모두 전환 가능**하도록 분리 (활성 조건을 한곳에서 주입).
- **기본 동작(A/B/C 중 무엇을 default로 할지)은 Phase B 실기 테스트 이후** 기획·개발 합의로 확정.
- 판단에 쓸 **프로토타입 체크 항목:**
  - [ ] 세로 잠금 ON + 기기 미회전 상태에서 A가 “깨진 화면”처럼 보이는지
  - [ ] 「기기를 돌려 주세요」 안내만으로 A가 충분한지
  - [ ] B 설정 항목이 casual 유저에게 과한지
  - [ ] 잠금 해제 후 `mobile_landscape` 전환 시 C의 “설정 ON”이 방해가 되는지

**문서 상태:** `적용 방식 = TBD`. 확정 시 본 절과 §7 Phase C, §13 개정 이력을 갱신한다.

---

## 5. 기술 설계

### 5.1 아키텍처 개요

```
┌─ body (OS viewport: W×H, 세로) ─────────────────────────┐
│  ┌─ #plpm-root (rotate 90°, transform-origin) ────────┐ │
│  │  논리 크기: W'=H, H'=W  (긴 변 = 게임 가로)        │ │
│  │  ┌─ #renderCanvas (Babylon, 16:10) ─────────────┐  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌─ HUD / MapSelect / RadialMenu (DOM overlay) ─┐  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- **단일 회전 루트:** `#plpm-root` 하나에 `transform: rotate(90deg)` (또는 `-90deg`, 기기·safe-area 검증 후 확정)
- **Babylon 씬·게임 로직:** 월드 좌표 **변경 없음** (타워·적·맵 로직 그대로)
- **변경 계층:** DOM 레이아웃, 캔버스 CSS 크기, pointer 좌표 변환, `visualViewport` 구독

### 5.2 viewport · 캔버스

| 항목 | `mobile_landscape` | PLPM |
|------|-------------------|------|
| 논리 width | `vw` | `vh` (회전 후 시각적 가로) |
| 논리 height | `vh` | `vw` (회전 후 시각적 세로) |
| target aspect | 16:10 | 16:10 (동일, 단 논리 W/H에 적용) |
| `engine.resize()` | CSS px = 논리 크기 | 회전 루트 **내부** CSS px |

`FlowController.resizeCanvas()`는 `getDisplayMode()` 결과에 따라 **사용할 w/h를 swap**한다.

### 5.3 터치 · 포인터 좌표

회전 루트 사용 시 **브라우저 `clientX/Y`와 Babylon pick 좌표가 어긋난다.**  
PLPM 활성 시 모든 pointer 경로에 **역회전 변환**을 적용한다.

```
screen (clientX, clientY)
    → inverseRotate(screen) → logical (lx, ly)
    → Babylon scene.pick(lx, ly)
    → RadialMenu / HUD hit test
```

적용 지점:

- `FlowController` — 타일 클릭, 타워 선택
- `RadialMenu` — 메뉴 item hit
- `HUD` — 버튼, 스크롤 (필요 시)
- `MapSelectScreen`, `MutationSelectUI`

**공통 유틸 제안:** `src/shared/ui/DisplayMode.ts` (또는 `PortraitLockLayout.ts`)

- `getDisplayMode(): 'desktop' | 'mobile_landscape' | 'mobile_portrait_lock'`
- `clientToLogical(x, y): { x, y }`
- `getLogicalViewport(): { width, height }`

### 5.4 HUD · UI

PLPM에서도 **`mobile_landscape`와 동일한 HUD 치수·배치 규칙**을 쓴다.

- top bar 높이 36px, bottom palette 58px (현행 모바일 가로 값)
- `getTopBarHeight()` / `estimateBottomHudHeight()` — **display mode 기반**으로 통합 (`MobileLayout.ts` + `HUD.ts` 중복 제거)
- safe-area (`env(safe-area-inset-*)`) — 회전 후 **inset 축 swap** 검증 필요 (iPhone 노치)

**최초 진입 안내 (PLPM 전용):**

- 세로 잠금 상태로 접속 시, 1회성 오버레이
- 문구 예: *「화면 잠금이 세로입니다. 기기를 가로로 돌려 플레이해 주세요.」*
- 3초 후 fade out 또는 탭으로 dismiss
- `localStorage` 플래그로 재표시 제어

### 5.5 카메라

PLPM은 **논리적으로 가로 플레이**이므로:

- `computeMobileCameraTargetOffset()` — PLPM에서도 **적용** (`mobile_landscape`와 동일 계수)
- `isMobileLandscapeGameplay()` → **`isMobileGameplay()`** 로 개명, `vw > vh` OR PLPM 조건

### 5.6 모드 전환 · resize

- `window.resize`, `visualViewport.resize`, `orientationchange` 구독
- `mobile_portrait_lock` ↔ `mobile_landscape` 전환 시:
  - 회전 루트 class toggle
  - `resizeCanvas()` + `applyCameraFraming()`
  - HUD `render()` (레이아웃 재계산)
- 전환 중 **1프레임 깜빡임** 방지: rAF 배치 적용

---

## 6. 현재 코드와의 관계

### 6.1 재사용

| 모듈 | PLPM에서 |
|------|----------|
| `FlowController` 게임 루프 | 그대로 |
| `MapEngine` / `TowerEngine` / `WaveEngine` | 그대로 |
| `HUD` / `RadialMenu` DOM 구조 | 레이아웃 상수 공유, 좌표계만 PLPM 대응 |
| `MobileLayout` 카메라 오프셋 | PLPM 포함하도록 조건 확장 |

### 6.2 수정 · 신규 예상 파일

| 파일 | 변경 |
|------|------|
| `index.html` | `#plpm-root` 래퍼, PLPM CSS |
| `src/shared/ui/DisplayMode.ts` | **신규** — 모드 판별·좌표 변환 |
| `src/shared/ui/MobileLayout.ts` | 모드 통합, `isMobileLandscapeGameplay` 정리 |
| `src/shared/ui/HUD.ts` | 로컬 `isMobileLandscape()` → DisplayMode |
| `src/shared/ui/RadialMenu.ts` | 동일 |
| `src/shared/ui/MapSelectScreen.ts` | 동일 |
| `src/app/FlowController.ts` | resize swap, pointer 변환, 루트 mount |
| `src/app/Main.ts` | (필요 시) 루트 초기화 |

### 6.3 의도적 비목표 (Out of Scope v1)

- OS 세로 잠금 **자동 감지** (불가능 — viewport 형태로만 추론)
- PWA manifest `orientation` (별도 트랙, PLPM v1과 독립)
- 세로로 **든 채** 플레이 (PLPM 전제 위반 — 안내 오버레이만)
- 데스크톱 브라우저 창 세로 모드 지원

---

## 7. 구현 단계 (제안)

### Phase A — 기반 (1~2일)

- [ ] `DisplayMode.ts` — 3-way 판별, logical viewport
- [ ] `#plpm-root` + CSS 회전 (canvas + HUD container)
- [ ] `resizeCanvas()` logical w/h 분기
- [ ] PLPM ↔ landscape 전환 시 class toggle

### Phase B — 입력 (1~2일)

- [ ] `clientToLogical()` 역회전
- [ ] FlowController pointer / pick 연동
- [ ] RadialMenu 위치·hit 보정
- [ ] 실기 테스트: iPhone Safari, Android Chrome

### Phase C — UI 통합 (1일)

- [ ] HUD / MapSelect / MutationSelect DisplayMode 통합
- [ ] safe-area 회전 검증
- [ ] 카메라 오프셋 PLPM 적용
- [ ] 최초 진입 안내 오버레이
- [ ] **(TBD)** §4.1 — 자동 적용 vs 인게임 설정 vs 하이브리드 확정 및 반영

### Phase D — QA · polish (0.5~1일)

- [ ] 세로 잠금 ON/OFF, 회전 잠금 해제 후 landscape 전환
- [ ] 웨이브 중 resize, RadialMenu, 정보 패널 스크롤
- [ ] `localStorage` 안내 dismiss
- [ ] GDD / README 한 줄 링크

---

## 8. QA 체크리스트

### 8.1 PLPM 활성 (세로 viewport + 터치)

- [ ] 기기를 가로로 돌렸을 때 UI·맵이 정방향으로 보임
- [ ] 타일 탭 위치와 pick 결과 일치
- [ ] RadialMenu 선택 정확
- [ ] 맵 하단이 bottom HUD에 과도하게 가려지지 않음
- [ ] BACK / 배속 / 웨이브 중 HUD 버튼 동작

### 8.2 모드 전환

- [ ] 세로 → (잠금 해제 후) 가로 회전 시 layout 깨짐 없음
- [ ] 가로 → 세로 복귀 시 PLPM 재적용

### 8.3 회귀

- [ ] 데스크톱 동작 변화 없음
- [ ] 기존 `mobile_landscape` (잠금 없이 가로) 동작 변화 없음

---

## 9. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| iOS Safari `visualViewport` + rotate 조합 버그 | pick 어긋남 | 실기 매트릭스 테스트, fallback offset |
| safe-area 축 혼동 | 노치 가림 | 회전 방향 단일 확정 + 기기별 QA |
| `isMobileLandscape` 분산 정의 | 조건 불일치 | `DisplayMode.ts` 단일 소스 |
| 이중 회전 (PLPM + OS landscape) | 화면 뒤집힘 | `vh > vw`일 때만 PLPM |
| 90° 회전 시 subpixel blur | 텍스트 흐림 | `will-change`, 정수 px 스냅 |

---

## 10. 성공 기준

1. **iPhone (세로 잠금 ON)** + Safari에서 기기를 가로로 돌려 플레이 시, **잠금 없이 가로 접속한 경우와 UX 동급**
2. pointer 오차가 **타일 1칸 이내** (체감상 정확)
3. 데스크톱·기존 모바일 가로 **회귀 없음**
4. 코드상 display mode가 **한 곳**에서만 결정됨

---

## 11. 용어 정리

| 용어 | 설명 |
|------|------|
| **PLPM** | 모바일 화면 세로 잠금 플레이 모드 (본 문서) |
| **OS portrait** | 브라우저 `innerWidth < innerHeight` |
| **OS landscape** | 브라우저 `innerWidth > innerHeight` |
| **물리적 가로** | 사용자가 기기를 옆으로 돌려 든 자세 (PLPM 플레이 전제) |
| **논리 viewport** | PLPM에서 회전 후 게임이 사용하는 W×H |
| **회전 루트** | `#plpm-root` — DOM·캔버스·HUD의 공통 transform 기준 |

---

## 12. 관련 문서

- [GDD.md](./GDD.md) — §2 기술 사양, 플랫폼
- [Game_Review_Notes.md](./Game_Review_Notes.md) — 모바일 UX 맥락
- 구현 참고: `src/shared/ui/MobileLayout.ts`, `src/app/FlowController.ts`

---

## 13. 개정 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-28 | 초안 — PLPM 명칭·컨셉·기술·단계 정의 |
| 2026-06-28 | §4.1 — 자동 적용 vs 인게임 설정 (TBD, 프로토타입 후 확정) |
