# Star Defense — Claude Code 행동 강령

## 스택
- Babylon.js (WebGL2) + TypeScript + Vite + Zustand (vanilla)
- 탑다운 고정 카메라, 고정 60틱 타임스텝 + 렌더 보간

## 에이전트 및 리서치
- 웹 탐색, 리서치, 서브에이전트 활용(opus 포함)은 임의 판단으로 진행 후 보고만 하면 됨
- 복잡한 구현은 opus 서브에이전트에게 병렬 위임

## 프로젝트 경계
- E:\game\2Test1은 참고 가능하나 파일 직접 import 금지. 필요 시 복제/신규 생성

## 대량 구현 전 조사
- 코드베이스 전반 파악 후 착수. LESSONS.md 참고

## 셰이더 규칙
- 모든 타워: towerStar 셰이더 기반 (FBM + Fresnel + NdotV limb darkening)
- 모든 적: 고유 셰이더 (asteroid, comet, rogue 등)
- ShaderStore에 등록하여 사용

## 핵심 아키텍처
```
src/
  core/           # FixedTimestep, 공간 인덱싱
  app/            # Main.ts, FlowController, store/
  engines/        # map/, tower/, wave/, projectile/
  shared/data/    # 타워/적/맵/웨이브 정의
  shared/ui/      # HUD, RadialMenu
```

## GDD
- Docs/GDD.md — 최신 설계 문서
- 마일스톤: Phase 1(MVP, 완료) → Phase 2(Act 1) → Phase 3(Act 2+성운/진화) → Phase 4(Act 3-4+스펠)
