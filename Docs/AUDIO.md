# Star Defense — 오디오 시스템

작성일: 2026-07-03

## 1. 소스 확보 방식 및 저작권

**모든 사운드(SFX·음악)는 외부 에셋 없이 Web Audio API로 런타임에 절차적(procedural) 생성한다.**

| 항목 | 내용 |
|---|---|
| 제3자 오디오 에셋 | **없음** (샘플/루프/음원 파일 0개) |
| 라이선스 의무 | 없음 — 프로젝트 자체 코드로 합성 (프로젝트 라이선스에 귀속) |
| 크레딧 표기 의무 | 없음 |
| 번들 추가 용량 | 0 바이트 (오디오 파일 미포함) |

선택 이유:
1. 저작권/출처 추적 관리가 원천적으로 불필요
2. 우주 테마에 맞는 일관된 사운드 팔레트 (신스 기반)
3. 피치/음색 파라메트릭 변주 — 타워 데미지에 따라 타격음이 달라짐
4. 로딩·네트워크 비용 0, PWA 캐시 부담 없음

향후 외부 에셋(예: Kenney CC0 팩, freesound CC0)을 도입할 경우 이 문서에 파일별 출처·라이선스를 기록할 것.

## 2. 아키텍처

```
src/engines/audio/
  AudioEngine.ts   # 신디사이저 코어 (싱글턴), 버스/컴프레서/리버브, SFX 정의
  MusicSystem.ts   # 생성형 우주 앰비언트 (드론+코드+플럭 3레이어)
  AudioBridge.ts   # 게임 이벤트 → 사운드 매핑 (콜백 래핑 + store diff)
```

시그널 체인:
```
SFX 합성 노드 → sfxBus ─┐
MusicSystem   → musicBus ┴→ masterGain → DynamicsCompressor → destination
              → reverbSend → Convolver(생성된 IR 2.2s) → masterGain
```

- **autoplay 정책**: 첫 `pointerdown`/`keydown`에서 AudioContext 생성·resume
- **설정 영속화**: `localStorage['sd_audio_settings_v2']` — muted/masterVolume/sfxVolume/musicVolume
  - 기본값: 마스터 100% / 효과음 80% / **배경음악 60%**
- **볼륨 UI**: HUD 상단바 🔊 버튼 → 버튼 하단 부착형 패널. 마스터/배경음악/효과음 슬라이더(0~100%, 백분위 표기) + 헤더 측면 음소거 토글. 바깥 클릭 시 닫힘.
- **스로틀**: 고빈도 사운드(enemy_hit 55ms, enemy_kill 70ms)는 최소 간격 + 덕킹으로 16배속에서도 포화 방지

## 3. 통합 방식 (동시 작업 충돌 회피 설계)

타워/시너지 보강 세션이 수정 중인 파일(TowerEngine/Projectile/TowerData/EvolutionSystem)은 **일절 수정하지 않음**. 대신:

- `AudioBridge`가 FlowController의 배선 완료 **이후** 생성되어 기존 콜백을 래핑:
  - `towerEngine.onEnemyHit` → 타격음 (데미지 기반 피치)
  - `towerEngine.onBetelgeuseExplode` → 초신성 폭발음
  - `radialMenu.onSelect` → 철거/진화 사운드
  - `nebulaEngine.placeNebula` → 성운 배치음 (메서드 래핑)
- 나머지는 GameStore 상태 diff로 유도:
  - phase 전환 → wave_start / wave_clear / victory / gameover (+ 음악 강도 전환)
  - baseHp 감소 → base_damage, enemiesKilled 증가 → enemy_kill
  - towersPlaced 증가 → tower_place, spellGauge 감소 → spell_cast
- 전역 DOM `button` 클릭 → ui_click (개별 배선 불필요, capture 리스너)
- FlowController 변경은 4곳(import/필드/생성/dispose)뿐

## 4. 사운드 목록

| ID | 트리거 | 합성 기법 |
|---|---|---|
| ui_click | 모든 버튼 클릭 | 삼각파 1.8kHz 틱 |
| ui_select | 타워 팔레트 선택 | 사인 2음 상승 (880→1320Hz) |
| ui_error | (예약) 자금 부족 등 | 사각파 저역 버즈 |
| tower_place | 항성 배치 | 저음 사인 블룸(90→180Hz)+배음, 리버브 |
| tower_sell | 철거 | 삼각파 하강 스윕 |
| tower_evolve | 진화 | C5-E5-G5-C6 아르페지오 + 고역 노이즈 쉬머 |
| nebula_place | 성운 배치 | 디튠 사인 패드 스웰 |
| enemy_hit | 투사체 명중 | 소우투스 재핑, 데미지→피치 매핑, 팬 랜덤 |
| enemy_kill | 적 처치 | 노이즈 LP 스윕 + 서브 드롭 |
| base_damage | 기지 피해 | 70Hz 서브 타격 + 2음 경보 |
| wave_start | 웨이브 시작 | 소우투스+공진 LP 상승 스웁 |
| wave_clear | 웨이브 클리어 | E5-G5-B5 차임 |
| victory | 맵 클리어 | 장조 팡파르 (C-E-G-C-E) |
| gameover | 게임 오버 | 디튠 소우투스 하강 드론 2.2s |
| supernova | 베텔게우스 자폭 | 서브 붐(120→30Hz) + 노이즈 폭풍 |
| spell_cast | 스펠 시전 | 사인 상승 스윕 + 쉬머 |

## 5. 음악 (MusicSystem)

D 도리안 기반 생성형 앰비언트, 3레이어:
- **드론**: D1/A1 디튠 소우투스 4-osc, 0.05Hz LFO 필터 모듈레이션
- **코드**: Dm7-F-G-C-Am 풀에서 14~24초 간격 랜덤워크, 6초 크로스페이드
- **플럭**: D 마이너 펜타토닉 랜덤 노트, 강도에 따라 3.5~8초 간격, 스테레오 팬+리버브

강도(intensity): build 0.4 / wave 0.8 — LP 컷오프와 출력 게인에 반영. clear/gameover 시 페이드아웃 정지.

## 6. 확장 가이드

- 새 SFX: `AudioEngine.ts`의 `SoundId` 유니언에 추가 → `play()` switch에 케이스 → `sfx*` 메서드 작성
- 고빈도 사운드는 `THROTTLE` 테이블에 등록
- 타워별 고유 발사음이 필요해지면: TowerEngine에 `onProjectileFired` 콜백 1개 추가 후 AudioBridge에서 래핑 (타워/시너지 세션 종료 후 진행 권장)
