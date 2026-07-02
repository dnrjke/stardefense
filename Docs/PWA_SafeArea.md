# PWA + Safe Area 구조 (2026-07-02)

## 목적

모바일(특히 세로모드 MPB)에서 HUD가 디바이스 상하단 끝(노치/상태바/홈 인디케이터)까지
점유해 시스템 UI와 겹치던 문제 해소 + PWA 설치 지원.

## Safe Area — 컨테이너 방식

2Test1의 SafeAreaContainer 설계를 DOM 오버레이에 맞게 적용했다.

- **원칙:** 캔버스(비주얼)는 edge-to-edge, 인터랙티브 UI는 safe area 안쪽 컨테이너에만 배치.
- `DisplayMode.applyLayoutVars()`가 전역 변수 4개를 설정:
  `--sd-safe-t/b/l/r` = `env(safe-area-inset-*, 0px)`
- **HUD 컨테이너**(HUD.ts)가 이 변수로 inset — 자식 요소는 safe area를 인지할 필요 없음.
- 개별 요소 변수(`--sd-top-pad-l`, `--sd-bot-pad-b`, `--sd-start-r/b` 등)에서
  env() 가산을 전부 제거했다. **개별 요소에 env()를 다시 넣으면 이중 적용이므로 금지.**
- body에 직접 붙는 fixed 요소(synergyTooltip)와 RadialMenu backdrop만
  `calc(var(--sd-safe-t) + …)`로 수동 보정.
- MapSelectScreen: 배경은 full-bleed 유지, content 래퍼 padding에 safe 가산.
- MutationSelectUI: 컨테이너 padding에 safe 적용 (flex 중앙정렬이라 padding으로 충분).

## iOS standalone 뷰포트 갭

iOS PWA standalone에서 CSS viewport가 실제 화면보다 짧아(상태바 높이만큼) 하단 갭 발생.
`FlowController.applyStandaloneViewportFix()`가 body를 `screen.height`로 확장하고,
오버레이 컨테이너들은 `position:absolute`라 실제 화면 하단까지 도달한다.
(근거: `E:\game\2Test1\Docs\KNOWN_ISSUES\platform\ios-standalone-viewport-gap.md`)
gap > 120px이면 방향 불일치(landscape)로 간주하고 적용하지 않는다.

## PWA 파일

| 파일 | 내용 |
|------|------|
| `public/manifest.webmanifest` | standalone, orientation `any`(가로/세로 모드 둘 다 지원 유지) |
| `public/sw.js` | 최소 SW (설치 요건 충족용 passthrough) |
| `public/icon-192.png`, `icon-512.png` | icon.svg 래스터 (Playwright 생성) |
| `index.html` | manifest 링크, theme-color, apple-touch-icon(정적 PNG), SW 등록, touchmove 방지 |

- iOS 설치 아이콘은 정적 `icon-192.png` 사용 — AppIcon.ts의 data URL은
  정적 링크가 없을 때만 폴백 (iOS는 설치 시 URL을 직접 fetch하므로 data URL 비신뢰).
