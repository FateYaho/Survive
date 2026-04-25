# ADR-0001: 페이즈 순서 변경 (DAY → BUILD → NIGHT → DAY)

**날짜**: 2026-04-25
**상태**: 적용됨

## Context (배경)

원래 IMPL_PLAN의 페이즈 순서는 `DAY → NIGHT → BUILD → DAY(cycle+1)` 이었음.
문제:
- 첫 낮(DAY 1)이 끝나면 바로 첫 밤(NIGHT 1) 시작
- 빌드 페이즈는 첫 밤 *후*에 처음 등장
- 즉 **첫 밤은 시작 인벤토리(30W+15S)만 가지고 터렛 0개로 막아야 함**
- 사용자 피드백: "첫 낮 끝나고 밤 되기 전에 타워 지을 수 있어야지 타워 언제 지어"
- 답답한 UX. 첫 밤은 자연스럽게 "코어 + 플레이어만으로 버티기"가 되어 빌드의 의미 약화

## Decision (결정)

순서 변경: **`DAY(90s) → BUILD(무제한) → NIGHT(60s) → DAY(cycle+1)`**

자연스러운 흐름:
- 낮: 자원 채집·확장 (준비 시간)
- 빌드: 정비·건설 (의사결정 시간)
- 밤: 전투 (실행 시간)
- 다음 날: 다시 모으기

승리 판정도 변경: NIGHT N 종료 시 cycle ≥ maxCycles 면 game:won.
신규 이벤트 `phase:nightEnd` 도입 (통계 카운터 + WaveSpawner 정리 트리거).

## Consequences (영향)

- ✓ 모든 사이클에서 빌드 → 방어 흐름이 일관됨
- ✓ 시작 자원으로 첫 터렛 가능 (긴장감 존재하지만 절망적이지 않음)
- ✓ 승/패 판정 로직 단순해짐 (NIGHT가 사이클의 끝)
- ✗ WaveSpawner.clearAll()을 `phase:buildStart`에서 `phase:nightEnd`로 옮겨야 함 (안 옮기면 NIGHT 끝나도 몬스터 살아있는 버그)
- ✗ DevSkipButton 의 skipToNext() 순서 로직 갱신
- 🔧 BuildMenu·ReadyButton·PhaseTimer 등 페이즈 이벤트 구독 컴포넌트들 동작 검증

## 관련

- CHANGELOG: 2026-04-25 [ARCH] 페이즈 순서 변경
- 영향 파일: `phase-manager.ts`, `wave-spawner.ts`, `game-scene.ts` (stats handler)
