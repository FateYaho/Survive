# 🧭 Phase 1 MVP 방향성 재정립 브리프

> **목적**: MVP 돌려본 후 드러난 설계 이슈 전반을 다른 대화 세션에서 판단·계산하기 위한 핸드오프 문서.
>
> **현재 상태**: Phase 1 단계 0~8 구현 완료, Economy 재설계 필요 (다른 브리프: [ECONOMY_REDESIGN.md](ECONOMY_REDESIGN.md))
>
> **이 문서의 범위**: *수치 계산 이전의 "큰 방향" 판단*. 숫자 조정은 ECONOMY_REDESIGN.md에서.

---

## ✅ 이미 확정된 방향 (2026-04-25 세션)

### A. 확장(Territory Expansion)은 유지한다
- **이유**: 게임 이름이 "영토 개척 생존기". 영토 개념은 아이덴티티.
- **변경점**: 확장 비용이 **누적 영토 수에 따라 비싸짐** (선형 or 지수). 처음엔 싸고 나중엔 비쌈.
- **현재 문제**: 고정 10W+5S 여서 초반 막대하고 의미 불명확.

### B. 초기 영토는 4×4 (5×5에서 축소)
- **이유**: 시작부터 "좀 좁다, 뻗어야겠다" 느낌 주기 위해. 5×5는 너무 여유로움.
- **영향**: 맵 중앙 OWNED 영역 16칸 → 코어 배치 + 근처 공간 빠듯
- **바꿀 것**: `MAP_CONFIG.initialRevealSize: 5 → 4`
  - 주의: `MAP_CENTER`는 `floor(30/2) = 15,15`. 4×4 OWNED는 (13,13)~(16,16) 권장 (코어가 중심에 오도록 `Math.floor((initialRevealSize-1)/2)` 로 half 계산)

### C. 확장 없이는 건물 배치 불가 (기존 유지)
- OWNED 타일에만 건물 배치. 확장은 여전히 "건물 놓을 공간 확보" 의미.
- 단, 자원 채집은 EXPLORED에서도 가능 (이전 변경 유지).

---

## 🤔 아직 결정 안 된 것 (다음 세션에서 판단)

### Q1. 확장 비용 스케일링 공식
옵션들:
- **선형**: `cost_n = baseCost * (1 + 0.5 * n)` (n = 이미 확장한 타일 수)
- **지수**: `cost_n = baseCost * 1.15^n`
- **계단식**: 1~5번째 = 5W, 6~15 = 10W, 16~30 = 20W, 31+ = 40W
- **거리 기반** (GDD §4.5 Phase 2 원안): 코어 거리 제곱 / 근처 타일 가까울수록 쌈
- 각 공식으로 사이클 5까지 누적 비용 시뮬레이션 필요

### Q2. 방어는 **벽 중심**인가 **터렛 중심**인가
이건 핵심 설계 방향 결정. 어느 쪽이냐에 따라 수치 전부 달라짐.

**옵션 A: 벽 중심 (Dome Keeper풍)**
- 벽이 주력 방어. HP 200+ 단단함.
- 터렛은 보조 역할 (소수만 존재).
- 플레이어가 직접 전투 비중 큼.
- 특징: 미로화·동선 설계 재미. 건설 노가다 많음.

**옵션 B: 터렛 중심 (정통 타워디펜스)**
- 터렛이 주력 킬. 다수 배치.
- 벽은 동선 조정용 장애물 (HP 낮음).
- 플레이어는 자원 채집 + 터렛 배치에 집중.
- 특징: 전략 배치 재미. 공간 관리 중요.

**옵션 C: 하이브리드 (현재 의도)**
- 벽: 경로 차단 + 시간 벌기
- 터렛: 주력 킬
- 플레이어: 보조 딜러 + 기동 대응
- 특징: 복잡한 전략이지만 밸런싱 어려움

**결정 필요**: 위 3개 중 하나 확정 → 벽/터렛 HP·비용·DPS 수치 재조정

### Q3. 몬스터가 벽 부수는 속도
- 현재: 늑대 공격력 5, 벽 HP 100 = 혼자 20초. 10마리 2초.
- 벽 중심이면 훨씬 튼튼하게 (HP 300~500)
- 터렛 중심이면 벽은 쉽게 부서져도 OK (HP 50~100)

### Q4. 플레이어의 역할 비중
- 직접 딜 비중 얼마나? (현재 공격력 10 / 초)
- 순찰·채집·피격 회피 어느 쪽 강조?
- 사이클 후반에도 플레이어 혼자 죽창 가능해야 하나?

### Q5. 연구실·정령의 숲을 Phase 1에서 어떻게?
- Phase 1에선 효과 없음 → 걍 제거? 아니면 "비싸지만 영토 점수" 같은 더미 목표로?
- MVP 정신상 효과 없는 건물은 빼는 게 맞음 (안 사니까)

### Q6. 밤 길이·사이클 수 변경?
- 현재: DAY 90s, NIGHT 60s, 5사이클
- 더 길게·짧게? (영토 개척 여유 ↔ 긴장감)
- 사이클 3~5개 중 하나로 재조정?

---

## 🎮 게임 Core Pillars (GDD §0) — 의사결정 기준

설계 판단할 때 **이 5개 기둥을 훼손하지 않는 방향**인지 체크:

1. **수평적 특화** — 선형 테크 아닌 계열별 깊이 (Phase 1은 나무만이라 보류)
2. **능동적 맵 설계** — 토템으로 자원 유도 (Phase 2+, 일단 무시 가능)
3. **리듬감 있는 긴장** — 낮(계획) ↔ 밤(실행) 교대
4. **매 런의 다양성** — 랜덤성 유지
5. **파밍의 탐험적 즐거움** — 이걸 해치는 시스템은 배제

**특히 #5**: 현재 "확장 안 하면 맵이 안 보임" → 파밍 고통 유발 → 이미 완화(시야 자동 공개)
하지만 확장이 너무 비싸면 다시 파밍 스트레스로 돌아감. 균형 중요.

---

## 📐 MVP Done 이후 현재 상태

### 작동하는 것
- 타이틀 → 게임 → 승/패 → 재시작 전체 플로우
- DAY 채집·확장 → BUILD 건설 → NIGHT 전투 → 다음 DAY
- 4계열 건물 배치·파괴
- 몬스터 타깃 락킹, 벽 파괴, 플레이어 다운/부활, 코어 HP
- 몬스터 드롭, 플로팅 텍스트
- 시야 4타일 자동 공개
- 통계 (처치수·건설수·사이클)

### 느슨한 부분 (이 브리프로 해결할 것)
- 자원 경제 파탄 (너무 빠듯함)
- 확장 비용이 용도에 비해 과함
- 벽/터렛 역할 애매
- RESEARCH_LAB/SPIRIT_FOREST 존재 이유 없음 (Phase 1 기준)

---

## 🗂 계산·조정 시 수정할 파일 목록

```
src/config/
├── map.config.ts          ← initialRevealSize: 5→4
├── resource.config.ts     ← startingInventory, collectAmount, expansionCost, initialResourcePerTile
├── monsters.config.ts     ← drop, spawn.byCycle, hp, attackPower
├── buildings.config.ts    ← WALL/TURRET cost·hp·attackPower, Lab/Forest 제거 여부
├── player.config.ts       ← moveSpeed, attackPower, visionRadiusTiles
├── combat.config.ts       ← CORE_CONFIG.initialHp
└── time.config.ts         ← dayDurationMs, nightDurationMs, maxCycles
```

추가로 **확장 비용 스케일링** 구현 필요:
- `src/systems/resource-system.ts` or 새 모듈에서 "지금까지 확장한 타일 수" 카운트 + 동적 비용 계산
- 현재 expansionCost가 상수 객체인데 → 함수(`getExpansionCost(ownedCount: number): Cost`) 로 교체

---

## 🎯 다음 세션 프롬프트 예시

다음 대화에서 이렇게 시작하면 됨:

```
Phase 1 MVP 밸런스/방향 재설계 시작.
먼저 아래 두 파일 읽어봐:
1. docs/DIRECTION_BRIEF.md (방향성 결정)
2. docs/ECONOMY_REDESIGN.md (수치 knob 전체)

순서:
1. DIRECTION_BRIEF의 Q1~Q6에 대해 추천안 제시 + 근거
2. 내가 결정 확정
3. 그 결정 기반으로 ECONOMY_REDESIGN의 수치 시뮬레이션
4. 최종 수치 리스트 출력 (파일별)
```

그 다음 세션에서 수치 확정되면 여기 돌아와서 *5분 안에* 반영 가능.

---

## 📎 관련 문서

- [docs/GDD.md](GDD.md) — 기획 원본 (v1.1)
- [docs/IMPL_PLAN.md](IMPL_PLAN.md) — 구현 계획
- [docs/DECISIONS.md](DECISIONS.md) — 과거 결정 근거
- [docs/OPEN_ISSUES.md](OPEN_ISSUES.md) — 보류 항목
- [docs/ECONOMY_REDESIGN.md](ECONOMY_REDESIGN.md) — 수치 knob
- [CLAUDE.md](../CLAUDE.md) — 최신 작업 기록
