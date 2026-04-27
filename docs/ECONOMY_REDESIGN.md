# 💰 경제 재설계 브리프 (Phase 1 MVP)

> **목적**: 현재 자원 경제가 망가져서(확장 비용 ≥ 타일 자원, 건물 비용 대비 수입 부족) Phase 1 MVP에서 "뭔가 의미있게 건설하고 방어"가 불가능. 재설계 후 config 수치만 바꾸면 되는 구조.
>
> **사용법**: 다른 대화 세션에서 이 파일 보며 계산. 결정되면 `src/config/*.ts` 수치만 교체.

---

## 🎯 제약 조건 (바꾸지 말 것)

- **총 사이클 수**: 5 (Phase 1 MVP, GDD §20)
- **승리 조건**: 5사이클 NIGHT 전부 버티기
- **패배 조건**: 코어 HP 0
- **페이즈 순서**: DAY(90s) → BUILD(무제한) → NIGHT(60s) → DAY...
- **맵**: 30×30 고정, 중앙 5×5 초기 OWNED (자원 없음), 나머지 25×25에 자원 스폰
- **현재 채집 조건**: 확장 없이 EXPLORED 타일에서도 채집 가능 (최근 변경)
- **건물 배치 조건**: OWNED 타일에만

---

## 📊 현재 수치 (모든 knob)

### 자원
| 변수 | 현재값 | 파일 |
|------|--------|------|
| `startingInventory.WOOD` | 30 | `src/config/resource.config.ts` |
| `startingInventory.STONE` | 15 | 〃 |
| `collectAmount.WOOD` | 3 | 〃 |
| `collectAmount.STONE` | 3 | 〃 |
| `collectTimeMs.WOOD` | 1000ms | 〃 |
| `collectTimeMs.STONE` | 1500ms | 〃 |
| `initialResourcePerTile` | 12 | 〃 |
| `spawnDensity` | 0.15 (15%) | 〃 |
| `woodStoneRatio` | 0.5 (1:1) | 〃 |
| `minSpawnGapTiles` | 2 | 〃 |
| `expansionCost.WOOD` | 10 | 〃 |
| `expansionCost.STONE` | 5 | 〃 |

### 플레이어
| 변수 | 현재값 | 파일 |
|------|--------|------|
| `moveSpeed` | 128 px/s (4타일/초) | `src/config/player.config.ts` |
| `attackPower` | 10 | 〃 |
| `attackSpeed` | 1.0 (초당 1발) | 〃 |
| `attackRange` | 160 px (5타일) | 〃 |
| `visionRadiusTiles` | 4 | 〃 |
| `initialHp` | 100 | 〃 |

### 몬스터 (WOLF)
| 변수 | 현재값 | 파일 |
|------|--------|------|
| `hp` | 20 (플레이어 2타로 죽음) | `src/config/monsters.config.ts` |
| `attackPower` | 5 | 〃 |
| `moveSpeed` | 64 px/s (2타일/초) | 〃 |
| `attackRange` | 24 px (근접) | 〃 |
| `attackCooldownMs` | 1000ms | 〃 |
| `drop.wood` | 2 | 〃 |
| `drop.stone` | 1 | 〃 |
| `spawn.byCycle` | [10, 15, 20, 25, 30] | 〃 |
| `spawn.spawnBurstIntervalMs` | 500ms | 〃 |

### 건물
| 건물 | 비용 | HP | 비고 | 파일 |
|------|------|-----|-----|------|
| WALL | 10W | 100 | 경로 차단 | `src/config/buildings.config.ts` |
| BASIC_TURRET | 20W + 10S | 80 | 공격력 8, 쿨 800ms, 사거리 160 | 〃 |
| RESEARCH_LAB | 50W + 30S | 200 | Phase 1엔 효과 없음 | 〃 |
| SPIRIT_FOREST | 100W + 50S | 150 | Phase 1엔 효과 없음 | 〃 |

### 코어
| 변수 | 현재값 | 파일 |
|------|--------|------|
| `initialHp` | 500 | `src/config/combat.config.ts` |

### 페이즈
| 변수 | 현재값 | 파일 |
|------|--------|------|
| `dayDurationMs.early` (cycle 1~3) | 90,000ms | `src/config/time.config.ts` |
| `dayDurationMs.mid` (cycle 4~9) | 150,000ms | 〃 |
| `nightDurationMs` | 60,000ms | 〃 |
| `maxCycles` | 5 | 〃 |

---

## 🧮 계산해야 할 것

### 1. 현실적 DAY 수입 추정
- 90초 중 실제 채집 시간 = ? (이동·타일 전환 빼고 순 채집)
- 가정: 60초 채집 + 30초 이동
- 초당 채집량 = 1회 / 1초(나무) 또는 1.5초(돌)
- 타일당 4회 채집 × 3 = 12 자원
- DAY 1에 몇 타일 방문 가능? (시야 4 = 9×9 즉시 공개, 걸어가며 확장)
- **추정 DAY 수입**: W ___개 + S ___개

### 2. NIGHT 드롭 수입 (사이클별)
- 사이클 N: N+1번째 인덱스가 아니라 `byCycle[cycle-1]`개 몬스터
- 처치율 100% 가정:
  - 사이클 1: 10 × (2W+1S) = 20W + 10S
  - 사이클 2: 30W + 15S
  - 사이클 3: 40W + 20S
  - 사이클 4: 50W + 25S
  - 사이클 5: 60W + 30S
- 처치율 60%면 각각 × 0.6

### 3. 사이클별 필수 방어 수량
- **사이클 N을 생존하려면 몇 터렛 + 몇 벽이 필요한가?**
- 계산 기준:
  - 터렛 DPS = 8 / 0.8 = 10 dps
  - 플레이어 DPS = 10 / 1.0 = 10 dps
  - 늑대 HP 20 → 터렛 or 플레이어 혼자서는 2초/마리
  - 늑대 스폰 간격 0.5초 → 터렛 1개론 스폰 속도 못 따라감
- **가설 (계산으로 검증 필요)**:
  - 사이클 1: 터렛 2개면 커버 가능?
  - 사이클 5: 터렛 5~7개 + 벽 우회 구조?

### 4. 밸런스 방정식
각 사이클 진입 시 누적 수입 ≥ 누적 필수 지출 + 버퍼

| 사이클 | 예상 누적 W | 예상 누적 S | 필요 터렛 | 필요 W | 필요 S |
|--------|------------|------------|-----------|--------|--------|
| 1 (DAY+BUILD+NIGHT) | 30+DAY+NIGHT | 15+DAY+NIGHT | 2 | 40 | 20 |
| 2 | 누적 | 누적 | 3 | 60 | 30 |
| ... | | | | | |

---

## ❓ 설계 결정 (먼저 답해야 함)

1. **확장(10W+5S) 유지? 제거? 싸게?**
   - 현재: 건물 배치만이 존재 이유. 10W+5S는 비쌈.
   - 옵션 A: 무료로 (걸어가서 밟으면 OWNED)
   - 옵션 B: 싸게 (3W+1S)
   - 옵션 C: 유지 (중요한 결정으로 남김)

2. **건물 비용 재조정?**
   - 현재 RESEARCH_LAB/SPIRIT_FOREST는 Phase 1에 효과 없음 → MVP에서 빼거나 싸게 만들어 테크 감만 주기
   - 벽/터렛 비율 조정? 벽 너무 싸면 벽도배 메타 생김

3. **NIGHT 드롭 스케일링?**
   - 사이클이 올라가면 드롭도 늘림 (난이도↑ 보상↑)
   - 또는 고정 (내구력 테스트)

4. **맵 자원 밀도/총량 재조정?**
   - 15% → 20%?
   - 타일당 12 → 20?
   - 돌:나무 비율 1:1 → 2:1 (돌이 희소하게)?

5. **시야 반경?**
   - 4타일 = 9×9 보임. 너무 좁으면 못 찾음. 너무 넓으면 긴장감 상실.

6. **코어 HP 500 적절한가?**
   - 사이클 5 100% 실패 가정 기준으로 튜닝
   - 늑대 1마리가 코어에 공격하면 5dmg/초. 10마리 동시 공격이면 50dmg/초. 10초면 500 소멸.

---

## 🎯 목표 경험 (설계 지향점)

설계할 때 이걸 머릿속에 두고 계산:

1. **사이클 1**: 쉬움. 실수해도 버틸 만함. 기본 터렛 1~2개로 방어.
2. **사이클 2~3**: 슬슬 빡빡. 영토 확장 + 터렛 증설 필요.
3. **사이클 4**: 위기감. 자원 부족 가능성.
4. **사이클 5**: 마지막 승부. 모든 자원 쏟아붓기.

**핵심 원칙**:
- 절대 "자원 0 상태로 할 수 있는 게 없음" 상태 나오면 안 됨 (데드락)
- 플레이어가 "이번 사이클 어떻게 넘길까?" 고민하는 순간이 1~2번은 있어야 함
- 매 사이클마다 "이번엔 벽? 터렛? 확장?" 선택지 존재

---

## 🧾 Output 형식

계산 끝나면 각 config 파일의 수치만 바꾸면 됨. 이 브리프에서 **"변경된 수치 리스트"**만 세션에 전달하면 됨:

```
resource.config.ts:
- startingInventory.WOOD: 30 → ___
- collectAmount.WOOD: 3 → ___
...

monsters.config.ts:
- drop.wood: 2 → ___
...

buildings.config.ts:
- BASIC_TURRET.cost.WOOD: 20 → ___
...
```

이걸 붙여넣으면 수정 5분 안에 끝남.

---

## 📎 관련 파일 (참고용)

- [docs/GDD.md](GDD.md) §5 (자원), §10 (몬스터), §15 (핵심 수치), §20 (Phase별 범위)
- [docs/IMPL_PLAN.md](IMPL_PLAN.md) §6.5 (튜닝 체크리스트)
- [docs/OPEN_ISSUES.md](OPEN_ISSUES.md) — TBD 항목
- [CLAUDE.md](../CLAUDE.md) — 최신 작업 기록
