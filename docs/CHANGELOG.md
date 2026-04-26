# 📋 코드 변경 로그

> **목적**: 모든 코드 변경 기록. 비개발자도 "언제 뭐가 왜 바뀌었나" 추적 가능.
> **새 항목은 항상 맨 위에 추가** (역순).
>
> **형식**:
> ```
> ## YYYY-MM-DD
> ### [TAG] 한 줄 요약
> - **무엇**: 구체적으로 어떤 코드/수치 바뀌었는지
> - **왜**: 이유 (버그/요구사항/밸런스 피드백 등)
> - **파일**: 영향받은 파일 (가능하면 line number까지)
> - **관련**: 관련 ADR / 다른 문서 / 이슈
> ```
>
> **TAG 종류**:
> - `[BUG FIX]` 버그 수정
> - `[FEATURE]` 새 기능
> - `[BALANCE]` 수치 조정
> - `[REFACTOR]` 코드 정리 (동작 변화 X)
> - `[REMOVE]` 기능/코드 제거
> - `[DOC]` 문서 변경
> - `[ARCH]` 아키텍처 변경 (시스템 추가·의존성 변경)
> - `[CONFIG]` 설정 변경 (config 파일)
> - `[FIX-FEEDBACK]` 플레이 피드백 반영

---

## 2026-04-27

### [BALANCE] Patch B — 옵션 E+G 적용 (생산 효율 + DAY 시간 컷)
- **무엇**:
  - `LUMBER_MILL.production.intervalMs`: 5000 → **8000** (사이클당 36W → 22W)
  - `QUARRY.production.intervalMs`: 8000 → **12000** (사이클당 22S → 15S)
  - `PHASE_CONFIG.dayDurationMs.early`: 90_000 → **60_000** (1~3사이클 DAY 1.5분 → 1분)
- **왜**: 직전 커밋 시점부터 BALANCE_LOG.md에 "Patch B 예정"으로 정리되어 있었으나 미적용 상태로 Phase 2 step 2/3 진행 → 새 터렛 6종 추가 후 자원 풍족 가속 우려. CLAUDE.md "다음 컷 후보: E+G" 지시대로 적용.
- **파일**: `src/config/buildings.config.ts`, `src/config/time.config.ts`
- **관련**: `docs/BALANCE_LOG.md` Patch B, `docs/BALANCE_CALC.md` §6 옵션 E/G, CLAUDE.md:21
- **주의**: mid(4~9사이클) 150s는 그대로. 옵션 G가 명시한 건 early만이라 그렇게 적용. 후속 플레이 테스트 필요.

### [FEATURE] Phase 2 step 3 — 특수 터렛 4종 + 슬로우 시스템
- **무엇**:
  - `BuildingType` enum 4종 추가: `STONE_BALLISTA`, `MACHINE_GUN_TURRET`, `MAGIC_ORB`, `ROTATING_SPIKE_TURRET`. 새 `SlowEffect` 인터페이스도 export.
  - `BUILDING_CONFIG` 4종 spec 추가 (모든 수치 — 비용·HP·DPS·AoE반경·슬로우·빔 회전속도 — 전부 config). 새 spec 인터페이스 `AoeTurretSpec`, `MultiHitTurretSpec`, `BeamTurretSpec`.
    - 돌 발리스타: 40S+20W, hp100, 6dmg/1500ms cd, AoE반경60, 슬로우 0.5×2s.
    - 기관총: 40I+20S, hp80, 5dmg/267ms cd (기본 터렛 800ms의 1/3 → DPS≈18.7).
    - 마법 구슬: 20G+30W, hp60, 4dmg/1500ms cd, 사거리 내 전체 동시 타격.
    - 회전 가시: 30S+30I, hp120, 빔 반경80·두께16, 회전 π/2 rad/s (4초당 1회전), 10dps + 슬로우 0.5×1.5s.
  - `Monster.applySlow()` 메서드 + 슬로우 상태 트래킹 (slowFactor, slowExpiresAt). 만료시각은 max-갱신, 강도는 더 강한 것(낮은 factor) 우선. 적용 중 옅은 청색 틴트(WOLF_SLOW_COLOR).
  - `Turret` 클래스 리팩터: `turretType` 파라미터 받아 BASIC_TURRET·MACHINE_GUN_TURRET 공유. shotLine 색상도 타입별 차등.
  - 신규 엔티티 클래스 3종: `AoeTurret`, `MagicOrb`, `RotatingSpikeTurret`. 각 자체 시각 효과(원형 플래시·펄스·회전 빔) 보유.
  - `BuildingSystem`: `turrets` Set → `combatTurrets` 로 일반화 (4종 공통). `createBuilding` switch 분기 4 추가.
  - `BuildMenu`: 카드 6→10개. 폭 130→110, gap 10→6 (10*110+9*6=1154px ≤ 1280).
- **왜**: Phase 2 — 4계열(나무/돌/철/마법) 차별화된 방어 옵션 도입. 단일·AoE·멀티·빔 4 패턴으로 빌드 다양성 확보.
- **파일**: `src/types/building.ts`, `src/config/buildings.config.ts`, `src/entities/building.ts`, `src/entities/turret.ts`, `src/entities/monster.ts`, 신규 `src/entities/aoe-turret.ts`·`magic-orb.ts`·`rotating-spike-turret.ts`, `src/entities/index.ts`, `src/systems/building-system.ts`, `src/ui/build-menu.ts`
- **관련**: `docs/GDD.md` §6.7, §6.3 (계열별 특화), `docs/ARCHITECTURE.md`
- **주의**:
  - 돌 발리스타·회전 가시 슬로우는 자동 적용 (별도 토글 X).
  - 회전 가시는 update 매 프레임 빔 회전 + 적중 판정 → 몬스터·터렛 다수 시 비용 누적 가능. Phase 4 성능 측정 필요.
  - 회전 가시 빔은 시각만 직선이고 적중 판정도 line-thickness 기반. 너무 멀리 위치한 몬스터는 빔이 통과해도 미적중 가능 (radius 80 이내만).

---

## 2026-04-26

### [FEATURE] Phase 2 step 2 — 대장간(FORGE)·공장(FACTORY) 건물 추가
- **무엇**:
  - `BuildingType` enum에 `FORGE`, `FACTORY` 추가.
  - `BUILDING_CONFIG`에 두 건물 추가 — 둘 다 `ProductionSpec`(maxCount=1, hp=150).
    - FORGE: 30W + 50S → +1 IRON / 10000ms
    - FACTORY: 50W + 50S + 10 IRON → +1 GOLD / 15000ms (IRON 게이팅으로 FORGE 선건설 강제)
  - `BUILDING_COLORS`에 청회색(FORGE) / 황금색(FACTORY) 매핑.
  - `ProductionBuilding`의 `ProdType` 유니온에 두 타입 포함.
  - `BuildingSystem.createBuilding` switch에 두 case 추가 (LumberMill·Quarry와 동일 분기).
  - `BuildMenu`에 카드 2장 추가 → 총 6칸 (벽/터렛/제재소/채석장/대장간/공장). 비용 표기에 IRON·GOLD 표시 추가.
- **왜**: Phase 2 진입 — 철·금 경제 부트스트랩. 제재소·채석장과 완전히 동일한 ProductionBuilding 패턴 재사용.
- **파일**: `src/types/building.ts`, `src/config/buildings.config.ts`, `src/entities/building.ts`, `src/entities/production-building.ts`, `src/systems/building-system.ts`, `src/ui/build-menu.ts`
- **관련**: `docs/GDD.md` §6.4, §20 (Phase 2 범위), `docs/OPEN_ISSUES.md`
- **주의**: 같은 날 다른 worktree(`claude/intelligent-matsumoto-a11704`)에서 Phase 2 step 1과 ResourceBar 4종 일반화가 동시 진행됨. 머지 시 step 1의 RESOURCE_ICONS 공통화 + BuildMenu 비용 라벨 일반화 채택. 본 step 2 직후 임시로 추가했던 [FIX] ResourceBar IRON/GOLD는 머지 결과로 흡수되어 항목 생략.

### [FEATURE] 철(IRON)·금(GOLD) 자원 스폰·채집·HUD (Phase 2 스텝 1)
- **무엇**:
  - `RESOURCE_CONFIG.spawnWeights` 도입 (W:50 / S:30 / I:15 / G:5). 기존 미사용 `woodStoneRatio` 제거.
  - `TileMap.spawnResources()` 가 4종 가중치 random으로 스폰 (기존 i%2 → `pickResourceType()` weighted).
  - 채집은 기존 로직 그대로 동작 — `RESOURCE_CONFIG.collectTimeMs/collectAmount` 가 이미 IRON(2초/1개)·GOLD(3초/1개) 수치 보유 (GDD §5.2).
  - `ResourceBar` 에 IRON/GOLD 표시 추가 (W·S·I·G 4종 모두 노출).
- **왜**: Phase 2 시작. 4계열 테크 체계로 가기 위한 첫 단계 — 철·금 자원 인벤토리·HUD가 먼저 살아있어야 후속 건물·테크 작업 가능.
- **파일**:
  - `src/config/resource.config.ts:31-49` (spawnWeights 도입, woodStoneRatio 제거)
  - `src/systems/tile-map.ts:96-148` (spawnResources + pickResourceType)
  - `src/ui/resource-bar.ts:36-41` (shown 배열 4종)
- **관련**: GDD §5.1·§5.2 (자원 4종·채집 속도). 바이오옴(산악·사막) 시스템은 Phase 2 후속 — 일단 맵 전체 균일 가중치로 스폰.
- **검증**: `npm run typecheck` 통과.

### [REFACTOR] UI exclusion zone 매직넘버를 GAME_CONFIG.ui로 통일
- **무엇**: 월드 클릭이 HUD 위에서 발화 안 되게 막는 좌표(상단 48 / 하단 140)를 `GAME_CONFIG.ui.topZoneHeight`·`bottomZoneHeight` 로 끌어올림. ResourceSystem·PlacementMode 두 곳에서 같은 상수 import.
- **왜**: PhaseTimer / BuildMenu / ReadyButton 높이를 변경할 때 두 시스템 동시 수정 필요한 DRY 위반. 한 곳만 바꾸면 동기화되도록.
- **파일**: `src/config/game.config.ts` (ui zone 신규), `src/systems/resource-system.ts:130-133`, `src/systems/placement-mode.ts:95-96`
- **관련**: 코드 감사 발견. 동작 변화 없음 (값 동일). typecheck 통과.

### [REFACTOR] BuildMenu 비용 라벨을 4종 자원 일반화
- **무엇**: `build-menu.ts`의 비용 문자열 생성을 W/S 하드코딩에서 `Object.entries(cost)` 루프로 교체. 공통 `RESOURCE_ICONS` 매핑 사용.
- **왜**: Phase 2에서 IRON/GOLD를 비용으로 쓰는 건물(공장·마법연구소 등) 추가 시 UI에서 비용이 사일런트 누락되는 버그 회피. 자원 4종 모두 자동 반영.
- **파일**: `src/ui/build-menu.ts:88-94`
- **관련**: 코드 감사 발견. 현재 W/S만 쓰는 건물 4종은 표시 결과 동일 (회귀 X). typecheck 통과.

### [REFACTOR] 몬스터 drop 컨벤션을 ResourceType enum 키로 통일
- **무엇**:
  - `MONSTER_CONFIG.WOLF.drop` 키를 소문자 `wood`/`stone` → `ResourceType.WOOD`/`ResourceType.STONE`로 교체. 타입은 `Partial<Record<ResourceType, number>>`.
  - `monster.ts` `applyDrop()` 을 W/S 하드코딩 → `Object.entries(drop)` 4종 루프로 일반화.
  - 공통 `RESOURCE_ICONS: Record<ResourceType, string>` 을 `resource.config.ts`에 신규 export. 드롭 텍스트·HUD 라벨·(다음 단계) 비용 라벨이 공유.
  - `resource-bar.ts`의 로컬 `ICONS` 제거 → 공통 `RESOURCE_ICONS` import.
- **왜**: Phase 2 IRON/GOLD 드롭 몬스터 추가 시 config·entity 두 곳을 모두 손대지 않게. 매직 키 컨벤션도 ResourceType enum과 일치.
- **파일**: `src/config/monsters.config.ts`, `src/config/resource.config.ts`, `src/entities/monster.ts:248-258`, `src/ui/resource-bar.ts`
- **관련**: 코드 감사 발견. typecheck 통과.

### [REMOVE] dead code — TargetRef 타입 / currentTarget 필드 제거
- **무엇**:
  - `TargetRef` union type 제거 (types/monster.ts)
  - `MonsterState.currentTarget` 필드 제거
  - `TurretState.currentTarget` 필드 제거
  - Monster·Turret 생성자에서 `currentTarget: null` 라인 제거
- **왜**: state에 선언되었으나 construction 시 null로만 세팅되고 평생 갱신·읽기 X. 실제 타깃 추적은 entity의 private `this.target` 필드에서 처리. → 죽은 타입.
- **파일**: `src/types/monster.ts`, `src/types/building.ts`, `src/entities/monster.ts:80`, `src/entities/turret.ts:42`
- **관련**: 코드 감사 발견. typecheck 통과.

---

## 2026-04-25

### [BUG FIX] 마지막 자원 채집 시 인벤토리 NaN
- **무엇**: `decrementResource()` 호출 전에 `tile.resource` 타입을 변수로 캡처. 호출 후 `tile.resource`는 null이 되어버려 `addResource(null, 2)`가 인벤토리 키를 깨뜨림.
- **왜**: 사용자 보고 — "마지막 자원이 안 캐짐". 실제로는 인벤토리가 NaN으로 망가져서 안 늘어나 보였음.
- **파일**: `src/systems/resource-system.ts:93-101`
- **관련**: 없음 (단순 버그)

### [BALANCE] 채집량 3→2, 터렛/벽 비용 인상 (옵션 A+D)
- **무엇**:
  - `RESOURCE_CONFIG.collectAmount.WOOD/STONE`: 3 → 2
  - `BUILDING_CONFIG.WALL.cost.WOOD`: 10 → 15
  - `BUILDING_CONFIG.BASIC_TURRET.cost`: 20W+10S → 30W+15S
  - 터렛 수리비도 비례 인상: 15W+8S
- **왜**: 사용자 피드백 "BUILD 2에서 터렛 7개 + 벽 2개 살 수 있는데 너무 쉬움". 사이클 5도 trivial 됨.
- **파일**: `src/config/resource.config.ts`, `src/config/buildings.config.ts`
- **관련**: `docs/BALANCE_CALC.md`
- **결과**: 적용 후에도 여전히 풍족 (BUILD 2에 터렛 5개) — 추가 컷 필요. BALANCE_CALC.md에 옵션 E~I 정리됨.

### [FEATURE] 생산 건물 시스템 (LumberMill / Quarry)
- **무엇**: 새 BuildingType 2개. `ProductionBuilding` 클래스가 DAY 페이즈 중에만 주기적으로 자원 자동 생산. 각 maxCount=1.
- **왜**: ECONOMY_CONFIG_FINAL 결정 — 시간 가치 + 투자/회수 의사결정 도입.
- **파일**: 신규 `src/entities/production-building.ts`. 수정 `src/types/building.ts`, `src/config/buildings.config.ts`, `src/entities/building.ts` (BUILDING_COLORS), `src/entities/index.ts`
- **관련**: `docs/ECONOMY_CONFIG_FINAL.md`

### [REMOVE] RESEARCH_LAB / SPIRIT_FOREST 제거
- **무엇**: BuildingType enum에서 두 항목 삭제. config·UI 카드에서도 제거.
- **왜**: Phase 1 MVP에서 효과 없는 더미 건물이라 빼는 게 맞음 (MVP 정신).
- **파일**: `src/types/building.ts`, `src/config/buildings.config.ts`, `src/entities/building.ts`, `src/ui/build-menu.ts`
- **관련**: `docs/DIRECTION_BRIEF.md` Q5

### [FEATURE] 확장 비용 계단식 스케일링
- **무엇**: `expansionCost` 상수 → `getExpansionCost(expansionsDone)` 함수. 0~7회=3W+1S, 8~15=8W+3S, 16~23=15W+6S, 24+=25W+10S.
- **왜**: 영토 무한 확장 방지 + 후반 의사결정 강화.
- **파일**: `src/config/resource.config.ts`, `src/systems/resource-system.ts`
- **관련**: `docs/DIRECTION_BRIEF.md` Q1, `docs/ECONOMY_CONFIG_FINAL.md`

### [CONFIG] 초기 영토 5×5 → 4×4
- **무엇**: `MAP_CONFIG.initialRevealSize` 5→4. `TileMap.generateMap()`도 짝수 크기 정확히 처리하도록 공식 수정.
- **왜**: 시작 좁게 만들어 초반 확장 욕구 자극.
- **파일**: `src/config/map.config.ts`, `src/systems/tile-map.ts`
- **관련**: `docs/DIRECTION_BRIEF.md` 확정 사항 B

### [BUG FIX] PlacementMode 활성 시 expansion 클릭 이중 발화
- **무엇**: ResourceSystem.handleClick에 `placementMode?.isActive()` 체크 추가. setter 주입 (`setPlacementMode`).
- **왜**: 빌드하려고 클릭한 게 expansion까지 트리거하는 문제 방지.
- **파일**: `src/systems/resource-system.ts`
- **관련**: 없음

### [FEATURE] DAY 중에도 건설 허용
- **무엇**: BuildMenu가 DAY+BUILD 둘 다 표시. PlacementMode는 NIGHT 진입 시만 자동 종료.
- **왜**: 정비를 BUILD 페이즈에만 몰지 않고, 낮 자원 모으면서 즉시 건설 가능. 사용자 피드백.
- **파일**: `src/ui/build-menu.ts`, `src/systems/placement-mode.ts`
- **관련**: `docs/ECONOMY_CONFIG_FINAL.md`

### [BUG FIX] 페이즈 순서 변경 후 NIGHT 끝나도 몬스터 살아있던 문제
- **무엇**: WaveSpawner.clearAll()을 `phase:buildStart` → `phase:nightEnd`에서 트리거.
- **왜**: 페이즈 순서 변경 (DAY→BUILD→NIGHT)으로 "BUILD 진입 시점"이 NIGHT 이전이 됨. clearAll이 잘못된 시점에 호출되던 버그.
- **파일**: `src/systems/wave-spawner.ts`
- **관련**: ADR-0001 (페이즈 순서)

### [FEATURE] 시야 시스템 (Vision Radius)
- **무엇**: `Player.visionRadiusTiles=4`. 플레이어 이동 시 주변 4칸 FOG → EXPLORED. 자원도 EXPLORED에서 채집 가능 (이전: OWNED만).
- **왜**: 사용자 피드백 — "확장에 자원 다 쓰면 끝, 망함". 채집-확장 데드락 해소.
- **파일**: `src/systems/tile-map.ts` (revealAround, findCollectibleNear), `src/entities/player.ts` (revealAround 호출), `src/config/player.config.ts`
- **관련**: ADR-0002 (시야 vs 확장-to-채집)

### [ARCH] 페이즈 순서 변경: DAY → BUILD → NIGHT → DAY
- **무엇**: 이전 DAY → NIGHT → BUILD 순서 변경. 승리 판정도 NIGHT 종료 기준으로. `phase:nightEnd` 이벤트 신설.
- **왜**: 첫 낮 끝나고 첫 밤 전에 터렛도 못 짓는 답답함 해소 (사용자 피드백).
- **파일**: `src/systems/phase-manager.ts`, `src/scenes/game-scene.ts` (stats handler)
- **관련**: ADR-0001

### [FEATURE] 몬스터 처치 시 자원 드롭 + 플로팅 텍스트
- **무엇**: WOLF 처치 시 `+2W +1S` 자동 인벤토리 적립. 노란 플로팅 텍스트 800ms 페이드.
- **왜**: 사용자 피드백 — "몹 잡으면 자원도 나와야". NIGHT 보상 도입.
- **파일**: `src/entities/monster.ts` (applyDrop), `src/config/monsters.config.ts` (drop 필드)
- **관련**: 없음

---

## 2026-04-24 (Phase 1 MVP 단계 0~8 완료, 한 세션)

### [FEATURE] 단계 8: 사이클 승패 + GameOverScene + TitleScene
- **무엇**: 5사이클 완주 시 game:won, 코어 파괴 시 game:lost. GameOverScene/TitleScene 추가.
- **파일**: 신규 `src/scenes/title-scene.ts`, `src/scenes/game-over-scene.ts`. 수정 `phase-manager.ts`, `game-scene.ts` (stats), `preload-scene.ts`, `main.ts`

### [FEATURE] 단계 7: 건설 시스템 (BuildingSystem + Turret + BuildMenu + 벽 파괴)
- **무엇**: 4종 건물(WALL, TURRET, LAB, FOREST) 배치/파괴 + 터렛 자동 사격 + 몬스터의 벽 공격.
- **파일**: 신규 `src/entities/building.ts`, `src/entities/turret.ts`, `src/systems/building-system.ts`, `src/systems/placement-mode.ts`, `src/ui/build-menu.ts`. 수정 `monster.ts` (벽 블로킹+공격), `wave-spawner.ts`, `player.ts` (resource:spent 이벤트)

### [FEATURE] 단계 6: 전투 시스템
- **무엇**: 플레이어 자동 조준(160px·1초 쿨), 몬스터 타깃 락킹·공격, HP·다운/부활(30s)·코어 피격(흔들림).
- **파일**: 신규 `src/systems/combat-system.ts`, `src/ui/hp-bar.ts`. 수정 `core.ts` (CORE_CONFIG 500HP·takeDamage), `player.ts` (takeDamage·다운), `monster.ts` (타깃락킹·공격), `wave-spawner.ts` (Player 참조 주입)

### [FEATURE] 단계 5: 몬스터 + WaveSpawner
- **무엇**: WOLF 빨간 14×14 직진 이동, 사이클별 10/15/20/25/30 마리 0.5s 버스트 스폰, BUILD 진입 시 정리.
- **파일**: 신규 `src/entities/monster.ts`, `src/systems/wave-spawner.ts`. 수정 `resource-system.ts` (UI 영역 클릭 무시), `game-scene.ts` (HUD 카운트)

### [FEATURE] 개발용 페이즈 스킵 버튼 + Core 시각화
- **무엇**: 상단 우측 ⏭ 버튼으로 페이즈 즉시 스킵. Core 클래스로 중앙 파란 사각형 시각화 (HP는 단계 6).
- **파일**: 신규 `src/entities/core.ts`, `src/ui/dev-skip-button.ts`

### [FEATURE] 단계 4: PhaseManager + UI
- **무엇**: DAY/NIGHT/BUILD 페이즈 루프 (90s/60s/무제한). PhaseTimer + ReadyButton.
- **파일**: 신규 `src/systems/phase-manager.ts`, `src/ui/phase-timer.ts`, `src/ui/ready-button.ts`. 수정 `resource-system.ts` (DAY 페이즈 게이팅)

### [FEATURE] 단계 3: 자원 시스템 + 영토 확장
- **무엇**: 자원 타일 스폰(15% 밀도), F 키 채집, 클릭 확장(인접 4방향), ResourceBar UI.
- **파일**: 신규 `src/systems/resource-system.ts`, `src/ui/resource-bar.ts`. 수정 `tile-map.ts` (자원 메서드), `player.ts` (인벤토리), `resource.config.ts` (시작 인벤토리)

### [FEATURE] 단계 2: Player + WASD 이동
- **무엇**: 녹색 16×16 사각형. WASD/화살표 둘 다, 대각선 정규화, 맵 경계 clamp, 카메라 follow lerp 0.1.
- **파일**: 신규 `src/entities/player.ts`. 수정 `game-scene.ts`

### [FEATURE] 단계 1: TileMap 30×30
- **무엇**: 격자 렌더 + fog + F1 격자 토글 + 마우스 호버 좌표 표시. 카메라 setBounds.
- **파일**: 신규 `src/systems/tile-map.ts`. 수정 `game-scene.ts`

### [BUG FIX] 단계 0: TypeScript `events.off()` 에러
- **무엇**: `events.off()` → `events.removeAllListeners()` (인자 없는 off는 비허용)
- **파일**: `src/scenes/game-scene.ts:68`

### [DOC] Phase 1 MVP 코드 스켈레톤 사전 작성
- **무엇**: 루트 설정(`index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`) + types/config/scenes 뼈대.
- **왜**: 코워크 PC에서 만들어두고 집 PC에서 바로 시작 가능하게.

---

## 이전 (기획 단계)

### 2026-04-24
- GDD v1.1 본문 반영 완료 (Part 1~3 병합)
- IMPL_PLAN v0.2 풀 상세화 (단계 0~8 티켓 레벨)

### 2026-04-22
- 기획 완성 GDD v1.0 → v1.1 합의 (자원 5→4종, 유닛 소환 삭제, 자동 조준 등)
- 플랫폼 전략 길 A 확정: 웹 → Capacitor 모바일 → 토스인앱 → Steam
- 모바일 친화 코딩 가이드라인 (해상도, 터치 크기, 입력 추상화) 정립
