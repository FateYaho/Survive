# 🏛 아키텍처 스냅샷

> **목적**: "지금 코드가 어떻게 생겼나" 한눈에. 새 시스템·파일·패턴 추가될 때마다 업데이트.
> **이 문서는 항상 *현재 상태*만 기술**. 변경 이력은 [CHANGELOG.md](CHANGELOG.md), 결정 근거는 [adr/](adr/) 참조.
>
> **마지막 업데이트**: 2026-04-27

---

## 📂 디렉토리 구조

```
game-dev/
├── CLAUDE.md                ← 프로젝트 전제·작업 규칙·문서 안내
├── README.md
├── index.html               ← Phaser 마운트 포인트
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md      ← 이 파일 (현재 구조)
│   ├── CHANGELOG.md         ← 모든 코드 변경 로그
│   ├── adr/                 ← 큰 결정 기록 (ADR)
│   ├── GDD.md               ← 게임 디자인 (v1.1)
│   ├── IMPL_PLAN.md         ← Phase 1 구현 계획
│   ├── BALANCE_CALC.md      ← 밸런스 계산 가이드
│   ├── DIRECTION_BRIEF.md   ← 방향성 결정
│   ├── ECONOMY_CONFIG_FINAL.md
│   └── (기타 기획 문서)
└── src/
    ├── main.ts              ← 엔트리. Phaser.Game 인스턴스 생성
    ├── types/               ← TypeScript 인터페이스·enum
    ├── config/              ← 모든 밸런스 수치 (절대 하드코딩 X)
    ├── scenes/              ← Phaser Scene 들
    ├── entities/            ← 게임 객체 클래스 (Player, Monster, ...)
    ├── systems/             ← 게임 시스템 (TileMap, ResourceSystem, ...)
    └── ui/                  ← UI 컴포넌트 (HUD, 메뉴, 버튼)
```

---

## 🎬 Scene 흐름

```
BootScene → PreloadScene → TitleScene → GameScene → GameOverScene → (TitleScene)
                                              ↑                              ↓
                                              └──── 다시 하기 ────────────────┘
```

- **BootScene**: 즉시 PreloadScene 전환
- **PreloadScene**: 에셋 로드 (현재 빈 상태, Phase 4에서 Kenney 스프라이트 추가)
- **TitleScene**: 타이틀 + 시작 버튼
- **GameScene**: 메인 게임 루프
- **GameOverScene**: 승/패 메시지 + 통계 + 다시 하기/타이틀로 버튼

---

## 🧩 시스템 의존성 그래프

> `*` = 순환 의존 회피용 setter 주입

```
TileMap (무의존)
  ↑
Core (TileMap)
Player (TileMap, *PhaseManager? 없음)
  ↑
ResourceSystem (TileMap, Player, *PlacementMode)
PhaseManager (무의존)
  ↑
WaveSpawner (TileMap, Player, Core, *BuildingSystem)
  ↑
CombatSystem (Player, WaveSpawner)
BuildingSystem (TileMap, Player, WaveSpawner, PhaseManager)
PlacementMode (TileMap, BuildingSystem)
```

**생성 순서** (GameScene.create()):
1. TileMap → Core → Player → ResourceSystem → PhaseManager
2. WaveSpawner → CombatSystem → BuildingSystem
3. `waves.setBuildingSystem(buildings)` (순환 해소)
4. PlacementMode → `resources.setPlacementMode(placement)` (순환 해소)
5. UI: ResourceBar, HpBar, PhaseTimer, ReadyButton, DevSkipButton, BuildMenu
6. `phase.start()` — Day 1 시작

---

## 📦 엔티티 (`src/entities/`)

| 클래스 | 역할 | 의존 |
|--------|------|------|
| `Player` | WASD 이동·HP·인벤토리·다운/부활·시야 자동 공개 | TileMap |
| `Core` | 중앙 수호 대상. HP 500. 피격 시 화면 흔들림 + core:destroyed | TileMap |
| `Monster` | WOLF만 (Phase 1). 타깃 락킹(player/core) + 근접 공격 + 벽 공격 + 슬로우 상태 (Phase 2 step 3) | Player, Core, TileMap, BuildingSystem (옵션) |
| `Building` | 모든 건물 베이스. HP 바 자동 표시 + takeDamage + destroy 이벤트 | (Phaser scene만) |
| `Turret` | extends Building. 단일 타깃 hitScan. BASIC_TURRET·MACHINE_GUN_TURRET 공유 (turretType 파라미터) | WaveSpawner |
| `AoeTurret` | extends Building. 단일 타깃 명중 시 AoE 광역 피해 + 슬로우 (STONE_BALLISTA) | WaveSpawner |
| `MagicOrb` | extends Building. 사거리 내 모든 몬스터 동시 타격 | WaveSpawner |
| `RotatingSpikeTurret` | extends Building. 시계방향 회전 빔, line-thickness 적중 → 지속 피해 + 슬로우 | WaveSpawner |
| `ProductionBuilding` | extends Building. DAY 중에만 주기적 자원 생산 (LumberMill, Quarry, Forge, Factory) | Player |

---

## ⚙️ 시스템 (`src/systems/`)

| 클래스 | 역할 |
|--------|------|
| `TileMap` | 30×30 격자 데이터·렌더(Graphics)·자원 스폰·타일 상태 변경·시야 reveal |
| `ResourceSystem` | F 채집 타이머·클릭 확장 (계단식 비용)·페이즈 게이팅 |
| `PhaseManager` | DAY(90s) → BUILD(∞) → NIGHT(60s) → DAY(cycle+1) 루프. 승/패 판정 |
| `WaveSpawner` | NIGHT 시 사이클별 늑대 스폰. NIGHT 종료 시 정리 |
| `CombatSystem` | 플레이어 자동 조준 + hitScan 공격 라인 |
| `BuildingSystem` | 배치 검증·비용 차감·maxCount 체크·터렛/생산건물 update 라우팅 |
| `PlacementMode` | 마우스 따라다니는 고스트 + 좌클릭 배치 / 우클릭·ESC 취소 |

---

## 🎨 UI (`src/ui/`)

| 컴포넌트 | 위치 | 역할 |
|----------|------|------|
| `ResourceBar` | 상단 좌측 | W/S 인벤토리 (이벤트 갱신) |
| `HpBar` | 좌측 (resource bar 아래) | PLAYER, CORE HP 텍스트 |
| `PhaseTimer` | 상단 중앙 | "DAY 1 — 1:30" 페이즈+잔여시간 |
| `ReadyButton` | 하단 중앙 (BUILD만) | 클릭 시 NIGHT 전환 |
| `DevSkipButton` | 상단 우측 | 페이즈 즉시 스킵 (개발용) |
| `BuildMenu` | 하단 (DAY+BUILD) | 10 카드: 벽 / 터렛 / 기관총 / 발리스타 / 마법구슬 / 회전가시 / 제재소 / 채석장 / 대장간 / 공장 |

---

## 📡 이벤트 명세

> 모든 이벤트는 `scene.events.emit()` / `scene.events.on()` 사용.

| 이벤트 | 발행자 | 페이로드 | 구독자 |
|--------|--------|----------|--------|
| `tile:stateChanged` | TileMap | `{ tileX, tileY, oldState, newState }` | (디버그) |
| `tile:entered` | Player | `{ tileX, tileY }` | ResourceSystem (채집 취소) |
| `tile:unlocked` | ResourceSystem | `{ tileX, tileY, cost }` | ResourceBar |
| `player:moved` | Player | `{ pixelX, pixelY }` | (없음 currently) |
| `player:damaged` | Player | `{ amount, remainingHp }` | HpBar |
| `player:downed` | Player | `{ timerSeconds }` | HpBar |
| `player:revived` | Player | `{}` | HpBar |
| `resource:collected` | Player.addResource | `{ type, amount }` | ResourceBar |
| `resource:spent` | Player.trySpend | `{ cost }` | ResourceBar |
| `resource:insufficient` | Player.trySpend | `{ type, required, have }` | ResourceBar (빨간 플래시) |
| `phase:dayStart` | PhaseManager | `{ cycle }` | ResourceSystem, BuildMenu, ReadyButton (hide), ProductionBuilding |
| `phase:buildStart` | PhaseManager | `{ cycle }` | ResourceSystem, BuildMenu, ReadyButton (show), ProductionBuilding (정지) |
| `phase:nightStart` | PhaseManager | `{ cycle }` | WaveSpawner, ResourceSystem, BuildMenu (hide), PlacementMode (exit), ProductionBuilding (정지) |
| `phase:nightEnd` | PhaseManager | `{ cycle }` | WaveSpawner (정리), GameScene stats |
| `phase:buildEnd` | ReadyButton | `{}` | PhaseManager |
| `monster:spawned` | Monster | `{ monster: state }` | (없음) |
| `monster:died` | Monster | `{ monsterId, dropLocation }` | GameScene stats |
| `combat:damage` | Player/Turret/Monster | `{ target, amount, source }` | (디버그) |
| `building:built` | BuildingSystem | `{ building: state }` | GameScene stats |
| `building:destroyed` | Building | `{ buildingId, type }` | BuildingSystem (정리) |
| `core:damaged` | Core | `{ amount, remainingHp }` | HpBar |
| `core:destroyed` | Core | `{}` | PhaseManager → game:lost |
| `game:won` | PhaseManager | `{ cyclesCleared }` | GameScene → GameOverScene |
| `game:lost` | PhaseManager | `{ cycle, cause }` | GameScene → GameOverScene |

---

## 🎯 주요 패턴 / 제약

### 1. UI 버튼은 setInteractive 안 씀
- 이유: `setInteractive + setScrollFactor(0)` + 작은 카메라 bounds(960×960 < 캔버스 1280) 조합에서 hit-test 불발
- 대신 `scene.input.on('pointerdown')` + 좌표(`pointer.x/y`)로 버튼 사각형 hit 수동 판정
- 적용 컴포넌트: ReadyButton, DevSkipButton, BuildMenu, GameOverScene 버튼들, TitleScene 시작 버튼

### 2. 시스템 간 순환 의존은 setter 주입으로 해소
- `WaveSpawner.setBuildingSystem(bs)` — Monster가 벽 공격하기 위해 BuildingSystem 참조 필요
- `ResourceSystem.setPlacementMode(pm)` — 빌드 모드 활성 시 expansion 클릭 무시
- 이유: GameScene.create() 안에서 생성 순서 충돌 회피

### 3. 모든 밸런스 수치는 `src/config/*.ts`
- 하드코딩 절대 금지
- config 파일별: `game`/`map`/`player`/`time`/`resource`/`monsters`/`buildings`/`combat`

### 4. Scene 종료 시 cleanup 필수
- `GameScene.shutdown()`: `events.removeAllListeners()` + `time.removeAllEvents()` + `input.removeAllListeners()` + `input.keyboard?.removeAllKeys()` + `children.removeAll(true)`
- 이유: scene.start로 재시작 시 누적 리스너·GameObject 메모리 누수 방지

### 5. 페이즈별 동작 게이팅
- DAY: 채집·확장·건설 가능, 생산 건물 작동
- BUILD: 건설·확장 가능, 채집 X, 생산 건물 정지
- NIGHT: 위 전부 X, 전투만

### 6. 자원 채집 시 type 캡처 필수 (버그 회피)
- `decrementResource()`가 자원 소진 시 `tile.resource = null`로 만듦
- 호출 전에 타입 변수에 저장 후 `addResource()`에 전달해야 NaN 안 됨

### 7. 몬스터 슬로우 시스템 (Phase 2 step 3 도입)
- `Monster.applySlow({factor, durationMs}, currentTime)` 호출로 적용
- 강도(factor)가 더 강한 것(낮은 값)이 우선, 만료시각(`slowExpiresAt`)은 항상 max-갱신
- 매 update에서 만료 시 자동 해제 (`refreshSlow`)
- 이동 계산: `step = moveSpeed * slowFactor * (delta/1000)`
- 시각: 슬로우 중엔 옅은 청색(`WOLF_SLOW_COLOR`), 데미지 플래시(흰색)와 충돌 시 플래시 우선 (`isFlashing` 가드)
- 호출자: `AoeTurret` (광역), `RotatingSpikeTurret` (빔 적중)

---

## 🔑 핵심 데이터 모델 (요약)

### Tile
```ts
{
  tileX, tileY: number;
  state: 'FOG' | 'EXPLORED' | 'OWNED';
  resource: ResourceType | null;
  resourceAmount: number;
  building: BuildingType | null;
}
```

### PlayerState
```ts
{
  pixelX, pixelY, hp, maxHp;
  inventory: { WOOD, STONE, IRON, GOLD };
  isDown, downTimer;
  facing: 'up'|'down'|'left'|'right';
}
```

### MonsterState
```ts
{
  id, type, pixelX, pixelY, hp, maxHp;
  movePattern, attackPattern;
  currentTarget; moveSpeed; attackPower; attackCooldownMs; lastAttackTime;
}
```

### BuildingState (Turret/Production은 확장)
```ts
{
  id, type, tileX, tileY, hp, maxHp;
}
```

### PhaseState
```ts
{
  type: 'DAY' | 'BUILD' | 'NIGHT';
  timeLeftSeconds: number;  // BUILD는 -1
  cycle: number;
}
```

---

## 🛠 기술 스택

| 항목 | 선택 |
|------|------|
| 게임 엔진 | Phaser 3.90 |
| 언어 | TypeScript 5.6 |
| 번들러 | Vite 6.0 |
| 패키지 | npm |
| 저장소 | (Phase 1 MVP는 로컬 X) |
| 타깃 | 웹 (Phase 1) → Capacitor 모바일 → 토스인앱 → Steam |

---

## 📝 업데이트 규칙

이 문서는 **다음 경우에 업데이트**:
- 새 system/entity/UI 컴포넌트 파일 추가
- 시스템 의존성 변경 (생성자 시그니처 변경)
- 새 이벤트 추가/제거
- 새 패턴 도입 (예: setter 주입, 새 플러그인)

**업데이트 안 함**:
- config 수치 조정 → CHANGELOG에만
- 버그 수정 → CHANGELOG에만
- 기존 메서드 시그니처 미세 변경 → 그래프 영향 없으면 CHANGELOG에만
