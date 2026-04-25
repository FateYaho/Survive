# 경제 재설계 최종 수치 (2026-04-25 확정)

> 이 파일의 수치를 그대로 적용하면 됨.
> 설계 근거는 [ECONOMY_REDESIGN.md](ECONOMY_REDESIGN.md) / [DIRECTION_BRIEF.md](DIRECTION_BRIEF.md) 참고.

---

## ✅ 확정된 방향 요약

- 확장 비용: 계단식 스케일링 (누적 타일 수 기준)
- 방어: 하이브리드 (터렛 주력 킬, 벽 동선 통제)
- 생산 건물: LUMBER_MILL / QUARRY 각 최대 1개
- 채집: EXPLORED 타일에서도 가능 (기존 변경 유지)
- 건설: DAY 페이즈 중에도 허용 (BUILD 페이즈는 유지)
- 제거: RESEARCH_LAB, SPIRIT_FOREST

---

## 📁 config 수치 변경

### resource.config.ts

```ts
initialResourcePerTile: 8        // 12 → 8
woodStoneRatio: 0.65              // 0.5 → 0.65 (나무 타일 더 많게)

// expansionCost: 상수 객체 제거 → 아래 함수로 교체
// resource-system.ts 또는 expansion 모듈에서 호출
export function getExpansionCost(ownedCount: number): { WOOD: number; STONE: number } {
  if (ownedCount <= 8)  return { WOOD: 3,  STONE: 1  };
  if (ownedCount <= 16) return { WOOD: 8,  STONE: 3  };
  if (ownedCount <= 24) return { WOOD: 15, STONE: 6  };
  return                       { WOOD: 25, STONE: 10 };
}

// 유지
startingInventory: { WOOD: 30, STONE: 15 }
collectAmount:     { WOOD: 3,  STONE: 3  }
collectTimeMs:     { WOOD: 1000, STONE: 1500 }
spawnDensity:      0.15
minSpawnGapTiles:  2
```

---

### buildings.config.ts

```ts
WALL: {
  cost: { WOOD: 10 },   // 유지
  hp: 150,              // 100 → 150
}

BASIC_TURRET: {
  cost:       { WOOD: 20, STONE: 10 },  // 유지
  repairCost: { WOOD: 10, STONE: 5  },  // 신규 추가 (건설비 50%)
  hp: 80,        // 유지
  attackPower: 8, // 유지
  attackCooldownMs: 800, // 유지
  attackRange: 160,      // 유지
}

// 신규 추가
LUMBER_MILL: {
  cost:       { WOOD: 40, STONE: 5 },
  hp:         150,
  maxCount:   1,
  production: { resource: 'WOOD', amount: 2, intervalMs: 5000 },
  // DAY 90초 기준 36W/사이클, 본전: 사이클 4
}

// 신규 추가
QUARRY: {
  cost:       { WOOD: 15, STONE: 20 },
  hp:         150,
  maxCount:   1,
  production: { resource: 'STONE', amount: 2, intervalMs: 8000 },
  // DAY 90초 기준 22S/사이클, 본전: 사이클 4
}

// 제거
// RESEARCH_LAB
// SPIRIT_FOREST
```

---

### map.config.ts

```ts
initialRevealSize: 4   // 5 → 4
// 초기 OWNED 영역: (13,13)~(16,16) — Math.floor((initialRevealSize-1)/2) 로 half 계산
```

---

### 유지 (변경 없음)

```
monsters.config.ts  — 전체 유지
player.config.ts    — 전체 유지
combat.config.ts    — CORE_CONFIG.initialHp: 500 유지
time.config.ts      — dayDurationMs: 90000 / nightDurationMs: 60000 / maxCycles: 5 유지
```

---

## 🔧 코드 변경 필요 (config 수정만으론 안 되는 것)

### 1. expansionCost 함수화 (필수)
```
위치: src/systems/resource-system.ts 또는 expansion 관련 모듈
현재: expansionCost 상수 객체 참조
변경: getExpansionCost(currentOwnedTileCount) 호출로 교체
```

### 2. 생산 건물 틱 시스템 (필수)
```
위치: 게임 루프 또는 building-system.ts
동작: 건물별 production.intervalMs 마다 production.resource += production.amount
     DAY 페이즈 중에만 작동 (NIGHT엔 생산 없음)
```

### 3. DAY 페이즈 중 건설 허용 (필수)
```
위치: 건설 허용 조건 체크하는 곳
현재: phase === 'BUILD' 일 때만 건설 가능
변경: phase === 'DAY' || phase === 'BUILD' 로 수정
```

### 4. 터렛 수리 기능 (낮은 우선순위)
```
위치: building-system.ts + UI
동작: 터렛 선택 → 수리 액션 → repairCost 차감 → HP 전체 회복
조건: HP가 max가 아닐 때만 수리 가능
```

---

## 🧮 사이클별 예상 경제 흐름 (참고)

```
사이클 1: 터렛 2개 + 벽 2개 간신히 가능. 10마리 방어 쉬움.
사이클 2: MILL 짓냐 터렛 추가냐 선택. 2개 터렛으로 15마리 버팀 (빡빡).
사이클 3: MILL 본전 + QUARRY 건설. 터렛 4개로 안정화.
사이클 4: 위기감. 터렛 6개.
사이클 5: 올인. 터렛 9개 + 30마리. 긴장감 있는 마무리.
```

---

## 🗂 관련 문서

- [DIRECTION_BRIEF.md](DIRECTION_BRIEF.md) — 방향성 결정
- [ECONOMY_REDESIGN.md](ECONOMY_REDESIGN.md) — 수치 knob 원본
- [GDD.md](GDD.md) — 기획 원본
