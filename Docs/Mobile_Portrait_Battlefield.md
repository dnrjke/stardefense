# 모바일 세로 전장 플레이 — 기획안

> **공식 명칭:** 모바일 세로 전장 플레이 (Mobile Portrait Battlefield, MPB)  
> **대상:** Star Defense 웹 (Babylon.js + TypeScript)  
> **작성:** 2026-06-28  
> **상태:** 기획 (미구현)  
> **관련:** [Mobile_PortraitLock_PlayMode.md](./Mobile_PortraitLock_PlayMode.md) (PLPM — 별도 트랙)

---

## 1. 한 줄 요약

모바일 **세로(portrait) viewport** 에서, **게임 판은 현행 16:10 전장을 그대로 90° 회전**해 세로로 길게 보이게 한다.  
**전투·맵·밸런스는 환경과 무관하게 동일**하고, **카메라 프레이밍(보이는 크기·HUD 가림 보정)** 과 **DOM UI·자잘한 연출 요소의 재배치** 만 다룬다.

플레이어는 **기기를 세로로 든 채** 플레이한다.

---

## 2. 2레이어 원칙 (핵심)

MPB는 **「같은 게임」** 과 **「모바일 세로에 맞는 껍데기」** 를 분리한다.

```
┌─────────────────────────────────────────────────────────┐
│  Layer B — UI · 연출 배치 (환경별 재설계 / 재배치)        │
│  · HUD, 맵 선택, RadialMenu, 정보 패널 (세로 UX)         │
│  · 적 체력바, 플로팅 ISM, 튜토리얼 등 **자잘한 요소** 위치  │
├─────────────────────────────────────────────────────────┤
│  Layer A — 게임 판 (모든 환경에서 **동일 전장**)          │
│  · MapDef, 타워/적/투사체 로직, 60틱, 시너지, 웨이브       │
│  · Babylon 씬 — **16:10 비율 유지**, MPB에서 **90° 회전** │
│  · 카메라 radius / target — **프레이밍·가림 보정만**       │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Layer A — 게임 판 (건드리지 않는 것)

| 항목 | MPB에서 |
|------|---------|
| `MapDef`, waypoint, buildable | **동일** (transpose·맵 팩 **없음**) |
| `TowerEngine`, `WaveEngine`, 전투 판정 | **동일** |
| 캔버스 **내용** 종횡비 | **16:10 유지** (가로·데스크톱과 같은 판) |
| 재미·체감 | **달라질 여지 없음** — 돌려서 보는 것과 동일 |

**정당한 Layer A 변경 (게임이 아닌 «보기»):**

- **카메라** `radius`, `target`, `alpha`(회전 후 구도) — viewport·HUD에 맞춰 **보이는 크기·여백**만 조정
- **90° 회전 래퍼** — 동일 판을 세로 화면에 맞게 **표시**

→ 데스크톱·가로 모바일·MPB 모두 **같은 전장**; 차이는 **카메라로 얼마나/어디를 비추느냐** 뿐.

### 2.2 Layer B — UI · 연출 배치 (재설계·재배치)

| 항목 | MPB에서 |
|------|---------|
| topBar / bottomBar / infoPanel / MapSelect 등 | **세로 모바일용 재설계** |
| 적 **체력바**, 월드 공간 UI | **회전·가림에 맞게 재배치** (스탯·로직 불변) |
| `showFloatingIsm` 등 픽셀 오버레이 | **좌표 변환·앵커** 조정 |
| pointer / pick | **회전 역변환** (입력 계층) |

UI 재설계는 **당연히 들어가는 범위**. 다만 **게임 규칙·맵 데이터를 바꾸는 것은 아님**.

### 2.3 «지금 화면을 돌려 보면 그 모습»

현행 16:10 gameplay를 **90° 회전**했을 때:

- 전장이 **세로로 길**게 보이고
- map_1_1 등 **좌→우 경로**가 **위→아래**로 읽히는 구도

→ 이것이 MPB의 **Layer A 목표 화면**이다. **별도 맵 제작·밸런스 분기는 하지 않는다.**

### 2.4 제품 rationale — 가로 현행 + 세로 MPB

MPB를 채택하는 **전략적 이유**는 「재미 있는 세로 모드」와 **제작비**를 동시에 만족시키기 위함이다.

**방침:** **가로 모드는 현행 유지**, **세로 모드에만 MPB 적용** → 접속·기기 상황별 **최적 UX**를 **게임 1벌**로 커버한다.

| 상황 | 모드 | Layer A | Layer B |
|------|------|---------|---------|
| 데스크톱 | `desktop` | 16:10 | 현행 HUD |
| 모바일, 기기·OS **가로** | `mobile_landscape` | 16:10 | **현행 유지** (추가 작업 최소) |
| 모바일, **세로** (잠금·습관) | `mobile_portrait` (MPB) | 16:10 + 90° | **세로 UI 재설계** |

**플레이어:** 가로로 돌릴 수 있으면 익숙한 가로 TD, 세로로만 쓰면 MPB — **어느 쪽이든 최적**에 가깝게 플레이.

**제작비가 합리적인 이유:**

| 공유 (1벌) | 분기 (환경별) | 하지 않음 |
|------------|---------------|-----------|
| MapDef, 캠페인, 전투·웨이브·시너지 엔진 | `DisplayMode`, 회전 래퍼, pick 보정 | 맵 2벌, 밸런스 2벌 |
| 동일 16:10 전장 · 동일 재미 | MPB용 HUD / 메뉴 프로필 | 세로 전용 맵 transpose |
| | 체력바·플로팅 UI **재배치** | 게임 규칙 2벌 |

→ **「게임 하나 + UI 두 프로필 + 세로 표시용 회전」** 구조.  
PLPM(가로 UI 통째 회전)이나 세로 네이티브 맵 재작성 대비 **범위가 Layer B에 집중**되어 **ROI**가 좋다.

**PLPM과의 관계:** Layer A(회전 판)는 PLPM과 **공유 가능**. MPB가 **세로 주력**이면 PLPM은 **보조·생략** 후보 — 제품 결정은 §3 참고.

---

## 3. PLPM · 가로 모바일과의 관계

| 트랙 | viewport | Layer A (판) | Layer B (UI) |
|------|----------|--------------|--------------|
| **desktop / mobile_landscape** | 가로 | 16:10, 회전 없음 | 현행 HUD |
| **PLPM** | OS 세로 (+ 기기 **물리 회전** 전제) | 16:10, **90° 회전** | 가로 HUD **그대로 회전** |
| **MPB (본 문서)** | OS **세로**, 기기 **세로** | 16:10, **90° 회전** (PLPM과 **동일 판**) | **세로 전용 UI 재설계** |

**Layer A 구현**은 PLPM과 **공유 가능** (회전 래퍼·pick 보정·카메라).  
**차이는 Layer B** — MPB는 HUD/메뉴를 세로 UX로 **새로 짜고**, PLPM은 기존 UI를 **같이 돌린다**.

**제품 결정 (TBD):** PLPM·MPB 동시 full 지원 vs MPB 단독 등. 본 문서는 MPB(Layer B 중심) 기획안.

---

## 4. 플레이어가 보는 구도

```
┌─────────────────────────┐  ← Layer B: top HUD (재설계)
│  ▲ 스폰 (회전 후 화면 상단) │
│  │                       │
│  │   Layer A: 16:10 판    │  ← Babylon (90° 회전 표시)
│  │   (동일 전장)          │
│  ▼ 기지 방향              │
├─────────────────────────┤
│  Layer B: bottom HUD      │  ← 타워 팔레트 등 (재설계)
└─────────────────────────┘
     적 체력바 등 → 판 위 **재배치**만
```

- **세로로 길다** = 16:10 판을 회전했을 때 **화면 높이 방향**으로 긴 것
- **적 흐름 위→아래** = 회전 투영 결과 (맵 데이터 변경 **아님**)

---

## 5. Layer A — 게임 판 · 카메라

### 5.1 회전 · 비율

- **내부 게임 비율:** 항상 **16:10** (`FlowController` targetAspect **동일**)
- **MPB 표시:** `#mpb-root` (또는 display mode 래퍼) **`transform: rotate(90deg)`** + origin/size 조정
- **letterbox 띠 한 줄**로 판을 줄이지 않음 — 세로 viewport에서 **가능한 한 16:10 판 전체** 노출

### 5.2 카메라 (프레이밍만)

| 항목 | desktop / landscape | MPB |
|------|---------------------|-----|
| 맵·로직 | 동일 | **동일** |
| beta | 0.1 | **동일** |
| alpha / target | -π/2, (0,0,0) | 회전 후 구도 — **동일 씬, 표시용 조정** |
| radius | `mapDef.cameraDistance` | **동일 값** 또는 **프레이밍용 미세 조정** (밸런스 아님) |
| HUD 가림 보정 | `-Z` pan (가로) | 회전 좌표계에서 **target pan** (크기만, `MobileLayout` 분기) |

**하지 않는 것:** `cameraDistancePortrait`로 **줌아웃해 다른 난이도/시야** 만들기, 맵 transpose, MPB 전용 웨이브.

### 5.3 월드 · pick

- `MapEngine` `row/col` 메타데이터, `tileToWorld` — **변경 없음**
- `scene.pick` — Layer B와 별도로 **회전 역변환** 후 기존 경로 사용

---

## 6. Layer B — UI · 연출 재배치

### 6.1 DOM UI (재설계)

1. **엄지 존:** 타워·배속·빈번 조작 → **하단**
2. **정보:** 웨이브·ISM·시너지 → **상단**
3. **infoPanel:** bottom sheet 등 — **세로 폭(~390px) 전제** (TBD)
4. **RadialMenu:** 탭 지점·엄지 reach — MPB 앵커

| 컴포넌트 | MPB |
|----------|-----|
| topBar | 세로 full-width, safe-area |
| bottomBar | 하단 + safe-area, 터치 타겟 |
| infoPanel | **재설계** (역할 tag·프리뷰 유지) |
| MapSelect / MutationSelect | portrait 1급 |
| tutorialOverlay | 전장 가림 최소 |

### 6.2 판 위 · 월드 연출 (재배치만)

게임 로직은 그대로, **보이는 위치·오프셋**만 환경별:

| 요소 | 처리 |
|------|------|
| 적 **체력바** | 회전 후 가독성·HUD 겹침 방지 offset |
| `showFloatingIsm` | `Vector3.Project` + 회전 래퍼 기준 screen 좌표 |
| 스폰/기지 마커 | (필요 시) 라벨 anchor — **메시·경로 불변** |
| Glow·이펙트 | 씬 그대로; **스크린 스페이스 UI만** 손댐 |

### 6.3 최초 진입

- **「기기를 돌려 주세요」 불필요** (세로로 든 채 플레이)
- (선택) 「세로 화면에 최적화」1회 안내

---

## 7. 디스플레이 모드

`DisplayMode.ts` (미구현) 목표:

| ID | 조건 | Layer A | Layer B |
|----|------|---------|---------|
| `desktop` | !touch 또는 vh>600 | 16:10 | desktop HUD |
| `mobile_landscape` | touch, vh≤600, vw>vh | 16:10 | 현행 mobile HUD |
| `mobile_portrait` (MPB) | touch, vh≤600, vh>vw | 16:10 **+ 90°** | **MPB UI** |

PLPM(`mobile_portrait_lock`)은 Layer A는 MPB와 **동일**할 수 있음. Layer B만 PLPM=회전 HUD / MPB=재설계 HUD로 갈림.

---

## 8. 코드 영향 (예상)

### 8.1 Layer A — 최소 변경

| 파일 | 내용 |
|------|------|
| `FlowController.ts` | 회전 래퍼, pick 역변환, `applyCameraFraming` MPB 분기 |
| `MobileLayout.ts` | MPB target pan (회전 좌표) |
| `DisplayMode.ts` | **신규** |

**변경 없음:** `MapData.ts`, `MapEngine` 로직, `TowerEngine`, `WaveEngine`, 밸런스.

### 8.2 Layer B — 재설계

| 파일 | 내용 |
|------|------|
| `HUD.ts` | `renderPortrait()` / MPB layout profile |
| `RadialMenu.ts` | MPB anchor |
| `MapSelectScreen.ts`, `MutationSelectUI.ts` | portrait 1급 |
| 적 체력바 등 | 해당 렌더 모듈 — **offset·anchor** |

### 8.3 의도적 비목표 (v1)

- 맵 transpose · MPB 전용 맵 팩
- MPB 전용 밸런스·웨이브
- **게임 판** 종횡비 10:16 **재작성** (내부 16:10 유지)
- 데스크톱 세로 창 MPB

---

## 9. 구현 단계 (제안)

### Phase A — Layer A 검증 (1~2일)

- [ ] 16:10 canvas + 90° 래퍼 + map_1_1
- [ ] pick · 타일 배치 정확도
- [ ] 카메라 pan (HUD 가림) — **프레이밍만**

### Phase B — Layer B HUD 골격 (2~3일)

- [ ] MPB topBar / bottomBar / canvas 영역 (DOM, **재설계**)
- [ ] safe-area · resize · 세로↔가로 전환
- [ ] pointer → Layer A 일관

### Phase C — Layer B · 연출 (2일)

- [ ] infoPanel bottom sheet 등
- [ ] RadialMenu · MapSelect MPB
- [ ] **적 체력바·플로팅 ISM** 재배치

### Phase D — QA (1일)

- [ ] map_1_1 클리어 — **가로 mobile과 동일 전략** 가능한지 (체감)
- [ ] desktop · mobile_landscape 회귀

---

## 10. QA · 성공 기준

### 10.1 MPB

- [ ] 세로로 든 채 map_1_1 플레이 — **회전 안내 없음**
- [ ] **동일 맵·동일 타워**로 가로 mobile과 **같은 빌드**가 유효
- [ ] 적 체력바·ISM 등 **가림 없이** 읽힘
- [ ] MPB UI만 **세로에 맞게** 조작 가능

### 10.2 성공 기준

1. Layer A: **「판만 돌린 desktop」** 과 전투 결과·시야가 **동일** (카메라 프레이밍 차만 허용)  
2. Layer B: letterbox 가로 띠 대비 **플레이 편의** 우위  
3. `MapData` / 전투 엔진 **diff 없음** (display·UI 계층만)

---

## 11. 리스크 · 완화

| 리스크 | 완화 |
|--------|------|
| 회전 + pick 어긋남 | `clientToLogical` 단일 유틸, 실기 QA |
| HUD가 Layer A 가림 | 카메라 target pan (**프레이밍**) |
| MPB vs PLPM Layer B 중복 | 공통 Layer A, UI 프로필만 분기 |
| 체력바 등 누락 | Phase C 체크리스트 |

---

## 12. PLPM 대비 (요약)

| | **MPB** | **PLPM** |
|--|---------|----------|
| Layer A (판) | 16:10 **회전** | 16:10 **회전** (동일 가능) |
| Layer B (UI) | **세로 재설계** | 가로 UI **회전** |
| 기기 자세 | **세로** | 세로 잠금 + **옆으로 돌림** |
| 게임 재미·체감 | **동일 전장** | **동일 전장** |

---

## 13. 관련 문서

- [GDD.md](./GDD.md)
- [Mobile_PortraitLock_PlayMode.md](./Mobile_PortraitLock_PlayMode.md)
- [Game_Review_Notes.md](./Game_Review_Notes.md)

---

## 14. 개정 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-28 | 초안 — MPB 명칭, 세로 전장·위→아래 구도, UI 분리, PLPM 대비 |
| 2026-06-28 | **2레이어 원칙** — Layer A: 동일 16:10 판+회전·카메라 프레이밍만 / Layer B: UI·체력바 등 재배치. 맵 transpose·판 재작성 삭제 |
| 2026-06-28 | §2.4 **제품 rationale** — 가로 현행 + 세로 MPB, 전 상황 커버·제작비 |
