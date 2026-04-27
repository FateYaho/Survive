# ADR-0003: 확장 비용 계단식 스케일링 + 생산 건물 도입

**날짜**: 2026-04-25
**상태**: 적용됨

## Context (배경)

ADR-0002 적용 후 확장은 "건물 자리 확보" 용도가 됨. 하지만 비용은 여전히 고정 10W+5S.
문제:
- "10W+5S로 얻는 가치 = 건물 한 칸"인데 비싸다고 느낌. 무한 확장 동기 부족
- 동시에 "건물 종류" 측면에서 RESEARCH_LAB / SPIRIT_FOREST 는 Phase 1에 효과 없음 → 더미 건물

게임 디자인 목표:
- 영토 점진 확장 → 후반엔 비싸짐 (인플레이션)
- 자원 자동 생산 옵션 → 시간 가치 + 투자 결정 도입
- Phase 1엔 "재미 검증"에 집중 → 더미 건물 제거

## Decision (결정)

### 1. 확장 비용 계단식 스케일링
```ts
0~7회  : 3W + 1S
8~15회 : 8W + 3S
16~23회: 15W + 6S
24+    : 25W + 10S
```
(`expansionsDone` 카운터 기반, 함수 `getExpansionCost(n)`로 계산)

초반은 싸서 영토 확장 가볍게 결정, 후반은 비싸서 신중하게.

### 2. 생산 건물 추가
- **LumberMill**: 40W+5S, 5초마다 +2W (DAY 중에만), maxCount=1
- **Quarry**: 15W+20S, 8초마다 +2S (DAY 중에만), maxCount=1
- DAY 90초 기준 mill 36W/cycle, quarry 22S/cycle 생산
- 본전 회수: 약 사이클 4~5

### 3. 더미 건물 제거
- RESEARCH_LAB, SPIRIT_FOREST 삭제 (Phase 1 한정. Phase 2+에서 효과 붙여 재도입)

## Consequences (영향)

- ✓ 영토 확장이 점진적 의사결정으로 작동 (초반 자유 → 후반 절제)
- ✓ "지금 자원 쓰지 말고 mill 짓자" 같은 시간 투자 결정 등장
- ✓ Phase 1 빌드 메뉴 4종 (벽/터렛/제재소/채석장) 깔끔
- ✗ `getExpansionCost(n)` 함수화 필요 → ResourceSystem에 expansionsDone 카운터 추가
- ✗ ProductionBuilding 클래스 신설 → BuildingSystem.update()에 라우팅 추가
- ✗ maxCount 제약 → BuildingSystem.check()에 max_reached reason 추가, BuildMenu UI에서 회색 처리
- ✗ Phase 2+에서 RESEARCH_LAB/SPIRIT_FOREST 다시 추가할 때 enum·config·UI 동시 갱신 필요
- 🔧 mill/quarry 생산량이 후반 사이클에서 너무 풍족 → 추후 튜닝 (BALANCE_CALC.md 옵션 E)

## 관련

- CHANGELOG: 2026-04-25 [FEATURE] 확장 비용 계단식 스케일링, [FEATURE] 생산 건물 시스템, [REMOVE] LAB/FOREST
- 결정 근거: `docs/DIRECTION_BRIEF.md`, `docs/ECONOMY_CONFIG_FINAL.md`
- 영향 파일: `resource.config.ts`, `buildings.config.ts`, `types/building.ts`, `entities/production-building.ts` (신규), `building-system.ts`, `build-menu.ts`
- 선행: ADR-0002 (시야 시스템 도입으로 확장 역할 변경)
