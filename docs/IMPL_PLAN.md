# 🏗 IMPL_PLAN.md — Phase 1 MVP 구현 계획

> **작성일**: 2026-04-24
> **상태**: **v0.2 (풀 상세 — 층 1~6 전부 + 단계 0~8 티켓 레벨 + 플레이 테스트 체크리스트)**
> **사용법**: Claude Code 실행 시 자동 로딩. 각 단계 시작 전 해당 섹션 티켓 순서대로 진행. 궁금하면 "티켓 N.M 세부 구현 전에 text로 확인" 요청.

---

## 📚 관련 문서

- `docs/GDD.md` — 게임 디자인 문서 v1.1 (성경)
- `docs/OPEN_ISSUES.md` — 미해결 이슈 중앙 트래커
- `docs/DECISIONS.md` — v1.1 확정 결정사항 근거
- `CLAUDE.md` — 프로젝트 맥락·규칙

---

## 🎯 Phase 1 MVP 스코프 요약

**목표**: "낮엔 확장, 밤엔 방어, 빌드 페이즈 고민"이 재밌는지 검증

| 항목 | 스코프 |
|------|--------|
| 맵 | 30×30 고정, 중앙 5×5 초기 공개 |
| 자원 | 2종 (🪵 나무, 🪨 돌) |
| 건물 | 나무 계열 2종 (연구실, 정령의 숲) + 벽 + 기본 터렛 |
| 몬스터 | 1종 (🐺 늑대, 직진형) |
| 사이클 | 5사이클 플레이 가능 |
| 플랫폼 | PC 웹 가로 1280×720 기준 (모바일 Phase 4+) |
| 플레이어 이동 | 자유 이동 (픽셀 단위) |
| 공격 | 자동 조준 (Vampire Survivors 스타일) |
| 사망 | 다운 상태 30초 → 자동 부활 (TBD) |

**범위 절제 원칙**: 4계열 욕심 금지. 나무 계열만 완성. 토템·가공 자원·메타 성장은 Phase 2+.

---

# 🧱 층 1. 아키텍처 원칙

## 1.1 상태 관리 — **Scene 내 보관**

모든 게임 상태는 `GameScene` 내부 필드에 보관. 전역 싱글톤 금지.

```ts
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private core!: Core;
  private tileMap!: TileMap;
  private resources!: ResourceSystem;
  private phase!: PhaseManager;
  private combat!: CombatSystem;
  private waves!: WaveSpawner;
  private ui!: UIManager;

  create() {
    // 시스템 인스턴스 초기화 순서 = 의존성 순서
    this.tileMap = new TileMap(this);
    this.player = new Player(this, this.tileMap);
    // ...
  }
}
```

**이유**: Phaser 표준 패턴. 디버깅 시 Scene 객체 하나만 추적하면 됨.

## 1.2 이벤트 통신 — **Phaser Scene Events**

시스템끼리 직접 참조 최소화. `scene.events.emit/on` 활용.

```ts
// 발행자
this.scene.events.emit('resource:collected', { type: ResourceType.WOOD, amount: 2 });

// 구독자 (어느 시스템이든)
this.scene.events.on('resource:collected', (data) => {
  this.ui.updateResourceBar(data.type, data.amount);
});
```

이벤트 이름 규칙: `<domain>:<action>` — 예: `phase:dayStart`, `combat:damage`, `tile:unlocked`.

전체 이벤트 명세는 **층 5** 참조.

## 1.3 Config 관리 — **Vite HMR 재빌드**

수치는 전부 `src/config/*.config.ts` 파일로 분리. 수정 시 Vite가 자동 재빌드 (1~2초).

```ts
// src/config/player.config.ts
export const PLAYER_CONFIG = {
  // TBD: Phase 1 실측 후 튜닝 (// TUNE_AFTER_PHASE1)
  hp: 100,
  attackPower: 10,
  attackSpeed: 1.0,
  moveSpeed: 128,  // 픽셀/초 (= 4타일/초 × TILE_SIZE)
  attackRange: 160,  // TBD
  downTimerSeconds: 30,  // TBD
} as const;
```

런타임 핫 리로드는 Phase 3+에서 필요해지면 검토.

## 1.4 TBD 수치 규칙

Kai 선호 **"모르는 값 추정 금지"** 원칙을 코드로 강제.

- **명시 없는 수치**: `TBD_` 접두어 또는 `// TUNE_AFTER_PHASE1` 주석 필수
- **임시 초안 수치**: 주석으로 "GDD §N.N 초안, 실측 튜닝" 명기
- **추정 금지**: 프레임워크 API·Phaser 동작 관련 몰라도 임의 구현 금지. 모르면 문서 확인·질문

## 1.5 코딩 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 | `kebab-case` | `tile-map.ts`, `phase-manager.ts` |
| 클래스명 | `PascalCase` | `TileMap`, `PhaseManager` |
| 함수·변수 | `camelCase` | `collectResource`, `currentPhase` |
| 상수 | `UPPER_SNAKE_CASE` | `TILE_SIZE`, `MAP_SIZE` |
| Enum | `PascalCase` 타입 + `UPPER_CASE` 값 | `enum TileState { FOG, EXPLORED, OWNED }` |
| 좌표 | `{ x: number, y: number }` 객체 | 타일 인덱스와 픽셀 좌표 구분: `tileX/tileY` vs `pixelX/pixelY` |

## 1.6 Phaser 구체 설정

### 사용 패키지 버전 (2026-04-24 확정)

- **Phaser**: `^3.90.0` (v3 최종. Phaser 4는 breaking change 있어 Phase 1~5 범위에선 비채택)
- **TypeScript**: `^5.6.0`
- **Vite**: `^6.0.0` (Vite 8 Rolldown 전환은 플러그인 생태계 성숙 대기)
- **Node.js**: 18+ 필요

Phaser 4 전환은 Phase 6+ 정식 출시 검토 시점에 재판단.

### 게임 인스턴스 (`main.ts`)

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/boot-scene';
import { PreloadScene } from './scenes/preload-scene';
import { GameScene } from './scenes/game-scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,          // WebGL 우선, 실패 시 Canvas
  parent: 'game-container',   // index.html div id
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,                // 창 크기 맞춰 비율 유지
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },  // 탑다운이라 중력 없음
      debug: false,       // 개발 시 true 전환 (충돌 박스 보임)
    },
  },
  scene: [BootScene, PreloadScene, GameScene],
};

new Phaser.Game(config);
```

### Scene 구성 (전체)
1. `BootScene` — 가벼움. 로딩 바용 최소 에셋만
2. `PreloadScene` — 모든 게임 에셋 로드
3. `TitleScene` — 메인 메뉴 (단계 8에서 추가)
4. `GameScene` — 메인 게임
5. `GameOverScene` — 패배·승리 (단계 8)

### 물리 엔진: Arcade 고정
- Matter는 복잡한 물리 필요 시. Phase 1엔 Arcade 충분
- 충돌 체크 · 속도 벡터 · 단순 overlap만 쓸 거라 Arcade가 빠름

### FPS
- 목표 60 (디폴트)
- 모바일 대응(Phase 4+)에서 30 하한
- 측정: `this.game.loop.actualFps` 또는 Chrome DevTools

## 1.7 성능 가이드라인

### 타일 렌더
- **Graphics 한 번 그리고 재사용** (`setInteractive()` 후 상태 변경 시만 갱신)
- 매 프레임 `.clear().fillRect()` 반복 금지
- fog 오버레이는 **별도 레이어**: `tile:stateChanged` 이벤트에서만 업데이트

### 오브젝트 풀링
- 몬스터: 밤마다 20~30마리 생성·제거 반복 → **Object Pool 패턴 권장** (단계 5에서 적용)
- Phaser의 `Group` + `group.get()` 활용

### 이벤트 리스너 cleanup
- Scene 종료(`shutdown()`) 시 `this.events.off()` 호출 필수
- 안 하면 Scene 재시작 때 중복 실행 → 메모리 누수

### 성능 함정
- **매 프레임 sort**: 몬스터 배열 정렬 `update()` 매번 X → 이벤트 기반 재탐색
- **`Math.sqrt` 남발**: 거리 비교는 `distanceSquared` 사용 (sqrt 불필요)
- **매 프레임 `setText()`**: 수치 변경 시만 호출

### 동시 엔티티 한계 (Phase 1)
- 플레이어 1 + 코어 1 + 몬스터 20~30 + 터렛 10~15 + 건물 5~10 ≈ **50~60 오브젝트**
- Arcade로 여유. 실측은 단계 5~7에서

## 1.8 에셋 전략

### 단계별 도입 시점

| 단계 | 에셋 |
|------|------|
| 0~1 | 프리미티브 (`Graphics` 사각형) |
| 2~3 | 플레이어는 16×16 녹색 사각형 유지 |
| **4 진입 전** | **Kenney 팩 도입** (타일·캐릭터·몬스터) |
| 5~8 | 도입한 팩 사용, 필요 시 추가 |

### Kenney 팩 후보 (단계 4 진입 시 선택)

- **Tiny Dungeon** (https://kenney.nl/assets/tiny-dungeon) — 16×16, 캐릭터·몬스터·타일 포함. **추천**
- 1-Bit Pack — 단색 미니멀 (대안)
- Roguelike Caves & Dungeons — 더 풍부

### PreloadScene 로딩 예시

```ts
preload() {
  this.load.spritesheet('tiles', 'assets/kenney/tiles.png', {
    frameWidth: 16, frameHeight: 16
  });
  this.load.spritesheet('characters', 'assets/kenney/characters.png', {
    frameWidth: 16, frameHeight: 16
  });
  this.load.audio('hit', 'assets/sfx/hit.mp3');
}
```

### 에셋 폴더 구조

```
public/assets/
├── kenney/
│   ├── tiles.png
│   ├── characters.png
│   └── LICENSE.txt    ← 라이선스 파일 보존
├── sfx/
│   ├── hit.mp3
│   └── collect.mp3
└── bgm/               ← Phase 4+ (BGM은 Phase 1 스킵)
```

### 라이선스
- Kenney = **CC0** (상업 이용 자유, 표기 의무 없음)
- 관례상 `README.md` 크레딧 섹션에 출처 명기 권장

## 1.9 리스크 체크포인트

각 단계에서 막힐 가능성 높은 지점 미리 식별.

### 단계 1 (타일 맵)
- ⚠️ **Graphics vs Tilemap API**: Phase 1엔 Graphics가 단순. Tilemap은 에셋 도입(단계 4) 시 전환
- ⚠️ **좌표계 혼동**: `tileX/tileY` (0~29) vs `pixelX/pixelY` (0~959). 변환 함수부터 검증

### 단계 2 (플레이어 이동)
- ⚠️ **자유 이동 + 타일 판정**: 플레이어 픽셀 좌표 → "어느 타일" 계산 매번. `pixelToTile()` 정확도 중요
- ⚠️ **delta time 사용**: `update(time, delta)` — delta (ms) 곱해서 프레임 독립적 이동
- ⚠️ **대각선 속도**: 정규화 안 하면 √2배 빠름. 방향 벡터 정규화 필수

### 단계 3 (자원·확장)
- ⚠️ **인접 판정**: 4방향만 (상하좌우). 대각선 제외 (GDD §4.5)
- ⚠️ **자원 타일 배치**: 랜덤 + 최소 간격 2칸 (뭉치지 않게)
- ⚠️ **채집 중 이동**: 다른 타일 이동 시 채집 취소? 유지? → Phase 1엔 **취소** (단순)

### 단계 4 (페이즈 루프)
- ⚠️ **BUILD 타이머 없음**: 다른 페이즈는 자동 전환, BUILD는 버튼. 전환 로직 분기
- ⚠️ **Kenney 에셋 교체**: 단계 4.0으로 분리. 1~2시간 별도 확보
- ⚠️ **Scene 재시작 cleanup**: 이벤트·타이머 `off()` 필수

### 단계 5 (몬스터)
- ⚠️ **벽 무시**: Phase 1 직진형은 벽 무시 가정. 단계 7에서 벽 추가 시 재설계
- ⚠️ **20마리 동시 AI**: 매 update 타깃 재탐색 X. 타깃 고정 규칙 철저 (§10.4)
- ⚠️ **Object Pool**: 단순 destroy·create 반복하면 GC 부담. 풀 패턴 도입

### 단계 6 (전투)
- ⚠️ **자동 조준 비용**: 몬스터 20마리면 매 공격마다 20번 거리 계산. `attackSpeed=1/초` 라 괜찮지만 측정 필요
- ⚠️ **투사체 vs hitScan**: Phase 1엔 **hitScan(즉발)** 권장. 투사체는 Phase 2+
- ⚠️ **다운 타이머**: `this.time.delayedCall(30000, ...)`. Scene pause 중 동작 확인 필요
- ⚠️ **코어 공격 판정**: 몬스터가 코어 "근접"의 정의 (충돌 반경 or 타일 인접)

### 단계 7 (건설·터렛)
- ⚠️ **빌드 모드 전환**: 건설 모드 진입·종료 토글. 이동·공격 비활성화
- ⚠️ **CombatSystem 통합**: 이미 몬스터 관리하는데 터렛 추가. 이벤트 꼬이지 않게
- ⚠️ **건물 중첩 금지**: `Tile.building !== null` 체크
- ⚠️ **벽 + 몬스터 경로**: 벽 생기면 직진형 몬스터 꽉 막힘 → Phase 1엔 벽 파괴(멧돼지 Phase 2+)라 OK

### 단계 8 (승패·재시작)
- ⚠️ **Scene shutdown 메모리 누수**: 모든 이벤트 `off()`, 타이머 `removeAllEvents()`
- ⚠️ **게임 오버 vs 승리 순서**: `coreHp <= 0` 먼저 체크. cycle 증가 전에

### 공통
- ⚠️ **TypeScript strict mode**: Vite 기본값. null/undefined 처리 엄격
- ⚠️ **Phaser 타입**: `@types/phaser` 불필요 (자체 제공). `import Phaser from 'phaser'`

---

# 📦 층 2. 데이터 모델

타입 정의는 `src/types/` 아래. 각 도메인별 분리.

## 2.1 Tile & Map

```ts
// src/types/tile.ts
export enum TileState {
  FOG = 'FOG',          // 미탐색 (회색 오버레이)
  EXPLORED = 'EXPLORED', // 탐색됨, 영토 아님
  OWNED = 'OWNED',       // 내 영토 (채집·건설 가능)
}

export enum ResourceType {
  WOOD = 'WOOD',
  STONE = 'STONE',
  IRON = 'IRON',   // Phase 2+
  GOLD = 'GOLD',   // Phase 3+
}

export interface Tile {
  tileX: number;
  tileY: number;
  state: TileState;
  resource: ResourceType | null;
  resourceAmount: number;  // 남은 채집 가능량
  building: BuildingType | null;  // 건설된 구조물
}

export interface MapConfig {
  size: number;       // 30 (Phase 1 고정)
  tileSize: number;   // TBD: 32 권장, Phase 1 세팅 시 확정
  initialRevealSize: number;  // 5 (중앙 5×5)
}
```

## 2.2 Player

```ts
// src/types/player.ts
export interface PlayerState {
  pixelX: number;
  pixelY: number;
  hp: number;
  maxHp: number;
  inventory: Inventory;
  isDown: boolean;
  downTimer: number;  // 초 단위 남은 시간
  facing: 'up' | 'down' | 'left' | 'right';  // 스프라이트 방향
}

export type Inventory = Record<ResourceType, number>;
```

## 2.3 Monster

```ts
// src/types/monster.ts
export enum MonsterType {
  WOLF = 'WOLF',       // Phase 1
  // BOAR, SHADOW, GHOST — Phase 2+
}

export enum MovePattern {
  STRAIGHT = 'STRAIGHT',  // 코어 향해 최단
  CHASING = 'CHASING',    // 플레이어 추적 (Phase 2+)
}

export enum AttackPattern {
  MELEE = 'MELEE',
  RANGED = 'RANGED',      // Phase 2+
  EXPLOSIVE = 'EXPLOSIVE', // Phase 2+
}

export interface MonsterState {
  id: string;  // 고유 ID (스폰 시 생성)
  type: MonsterType;
  pixelX: number;
  pixelY: number;
  hp: number;
  maxHp: number;
  movePattern: MovePattern;
  attackPattern: AttackPattern;
  currentTarget: TargetRef | null;  // 3주체 타깃팅 규칙 (GDD §10.4)
  moveSpeed: number;
  attackPower: number;
  attackCooldown: number;
}

export type TargetRef =
  | { kind: 'player' }
  | { kind: 'core' }
  | { kind: 'building'; buildingId: string }
  | { kind: 'turret'; turretId: string };
```

## 2.4 Phase & Cycle

```ts
// src/types/phase.ts
export enum PhaseType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
  BUILD = 'BUILD',
}

export interface PhaseState {
  type: PhaseType;
  timeLeftSeconds: number;  // DAY/NIGHT만 해당, BUILD는 -1 (무제한)
  cycle: number;            // 1~5
}
```

## 2.5 Resource & Inventory

Tile 내 자원은 §2.1 `Tile.resource`. 플레이어 인벤토리는 §2.2 `PlayerState.inventory`. 추가 타입 없음.

## 2.6 Turret & Building

```ts
// src/types/building.ts
export enum BuildingType {
  RESEARCH_LAB = 'RESEARCH_LAB',   // 연구실
  SPIRIT_FOREST = 'SPIRIT_FOREST', // 정령의 숲
  WALL = 'WALL',
  BASIC_TURRET = 'BASIC_TURRET',
}

export interface BuildingState {
  id: string;
  type: BuildingType;
  tileX: number;
  tileY: number;
  hp: number;
  maxHp: number;
}

export interface TurretState extends BuildingState {
  currentTarget: TargetRef | null;  // "처음 타깃 고정" 규칙 (GDD §10.4)
  attackRange: number;  // 픽셀
  attackPower: number;
  attackCooldown: number;  // 초
  lastAttackTime: number;
}
```

## 2.7 Core

```ts
// src/types/core.ts
export interface CoreState {
  tileX: number;  // 맵 중앙 (15, 15)
  tileY: number;
  hp: number;  // TBD: GDD §15 OPEN_ISSUES P0
  maxHp: number;
}
```

---

# 🕸 층 3. 시스템 의존성 그래프

```
┌──────────────┐
│  TileMap     │  무의존. 격자 데이터 + fog 렌더
└──────┬───────┘
       │
       ▼
┌──────────────┐   ┌──────────────┐
│  Player      │   │  Core        │  TileMap에 위치만 의존
│ (TileMap 참조)│   │ (TileMap 참조)│
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  │
┌──────────────┐          │
│ ResourceSys  │          │
│ (Tile·Player)│          │
└──────┬───────┘          │
       │                  │
       ▼                  │
┌──────────────────────────────┐
│  PhaseManager                │  시간 흐름만 담당. 이벤트 발행
│  (이벤트: phase:dayStart 등)  │
└──────┬───────────────────────┘
       │ phase:nightStart
       ▼
┌──────────────┐
│ WaveSpawner  │  PhaseManager 이벤트 구독
│ (TileMap 참조)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Monster     │  스폰됨. TileMap·Player·Core 참조
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  CombatSystem                        │  3주체 타깃팅 규칙 조율
│  (Player ↔ Monster ↔ Turret)         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Turret      │  CombatSystem 위에 얹힘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  UIManager   │  위 전부의 이벤트 구독만. 양방향 X
└──────────────┘
```

### 각 시스템 책임 (1줄)

| 시스템 | 책임 |
|--------|------|
| `TileMap` | 30×30 격자 데이터·렌더·fog·타일 상태 변경 |
| `Player` | 위치·이동·HP·인벤토리·다운 상태 |
| `Core` | 중앙 코어 HP·파괴 판정 |
| `ResourceSystem` | 채집 로직 + 인벤토리 변경 |
| `PhaseManager` | 낮/밤/빌드 타이머 + 페이즈 전환 이벤트 |
| `WaveSpawner` | 밤 시작 시 몬스터 스폰 |
| `Monster` | 이동 패턴·타깃팅·공격 |
| `CombatSystem` | 자동 조준·대미지 계산·HP 차감 조율 |
| `Turret` | 자동 공격 + 타깃 고정 |
| `UIManager` | 자원 바·페이즈 타이머·HP 바·빌드 메뉴 |

---

# 🎟 층 4. 단계별 Task 브레이크다운

## 단계 0: 프로젝트 세팅 (집 PC 첫 세션)

### 0.1 Git 초기화
```bash
cd ~/projects/game-dev  # USB 옮긴 위치
git init -b main
git add .
git commit -m "Initial commit: GDD v1.1 + 프로젝트 문서"
```

### 0.2 GitHub Private Repo 생성·연결
```bash
gh repo create game-dev --private --source=. --push
# 또는 웹에서 만든 뒤
git remote add origin https://github.com/<계정>/game-dev.git
git push -u origin main
```

### 0.3 Vite + TypeScript 세팅
```bash
npm create vite@latest . -- --template vanilla-ts
# 기존 파일 유지 여부 프롬프트 "Ignore files and continue" 선택
npm install
```

### 0.4 Phaser 3 설치
```bash
npm install phaser
```

### 0.5 기본 폴더 구조
```
src/
├── main.ts
├── config/
├── types/
├── scenes/
├── entities/
├── systems/
├── ui/
└── assets/
```

### 0.6 `index.html` + `main.ts` Hello World
- 검은 캔버스 (1280×720) 뜨기만 하면 Done
- `npm run dev` → 브라우저에 빈 화면 뜨면 OK

### Done 기준
- [ ] `git log --oneline` 에 첫 커밋 보임
- [ ] GitHub Repo URL 접속 가능
- [ ] `npm run dev` 실행 시 에러 없이 1280×720 검은 캔버스 뜸
- [ ] TypeScript 컴파일 에러 없음

---

## 단계 1: 30×30 타일 맵 렌더링

**목표**: 눈에 보이는 세계 만들기

### 1.1 Types 정의
- `src/types/tile.ts` — `TileState`, `ResourceType`, `Tile`, `MapConfig` (층 2.1 참조)

### 1.2 Config 파일
- `src/config/map.config.ts`
  ```ts
  export const MAP_CONFIG = {
    size: 30,
    tileSize: 32,  // TBD: 16/32/48 중 실제로 렌더해보고 결정
    initialRevealSize: 5,
  } as const;
  ```

### 1.3 `TileMap` 클래스 (`src/systems/tile-map.ts`)
- `constructor(scene: Phaser.Scene)`
- `private tiles: Tile[][]` — 2D 배열
- `generateMap()`: 30×30 초기화, 중앙 5×5는 `OWNED`, 나머지 `FOG`
- `getTile(tileX, tileY): Tile | null`
- `setTileState(tileX, tileY, state): void` (이벤트 발행: `tile:stateChanged`)
- `tileToPixel(tileX, tileY): { x, y }` / `pixelToTile(x, y): { tileX, tileY }`

### 1.4 렌더링
- `TileMap.render()` — `Phaser.GameObjects.Graphics` 사용
- 각 타일: 32×32 사각형
- 색상 규칙:
  - `OWNED` → 밝은 초록 (`0x4a7c3a`)
  - `EXPLORED` → 중간 회색 (`0x666666`)
  - `FOG` → 짙은 회색 (`0x333333`)
- 타일 경계선 (옵션, 디버그용)

### 1.5 Fog 오버레이
- 초기 상태: 중앙 5×5만 `OWNED`, 나머지 `FOG`
- `FOG` 타일은 짙은 회색 + 약간의 반투명 오버레이

### 1.6 카메라 설정
- `this.cameras.main.setBounds(0, 0, 30 * 32, 30 * 32)`
- 초기 위치: 맵 중앙
- `setZoom(1)` 기본 (화면에 30×32=960 < 1280, 여유)

### 1.7 디버그 모드
- 마우스 호버 시 타일 좌표 콘솔 표시 (Phase 1만 임시)
- `F1` 키로 격자선 on/off

### Done 기준
- [ ] 브라우저에 30×30 격자 보임
- [ ] 중앙 5×5 초록, 나머지 짙은 회색
- [ ] `MAP_CONFIG.tileSize` 변경 시 재빌드로 타일 크기 반영
- [ ] FPS 60 유지 (Chrome DevTools 확인)
- [ ] 콘솔 에러 0

### 예상 시간: 2~3시간

---

## 단계 2: 플레이어 + WASD 이동

**목표**: 캐릭터가 화면에서 부드럽게 움직임

### 2.1 Config 파일
- `src/config/player.config.ts`
```ts
export const PLAYER_CONFIG = {
  initialHp: 100,          // 초안 // TUNE_AFTER_PHASE1
  maxHp: 100,
  attackPower: 10,         // 초안
  attackSpeed: 1.0,        // 공격/초
  moveSpeed: 128,          // 픽셀/초 = 4타일/초 × 32
  attackRange: 160,        // 5타일 상당 TBD
  downTimerSeconds: 30,    // TBD (GDD §3.3)
  collisionRadius: 8,
  sprite: {
    width: 16, height: 16,
    initialColor: 0x44ff44, // 녹색 사각형 (단계 2~3, 단계 4에서 스프라이트 교체)
  },
} as const;
```

### 2.2 Player 엔티티 (`src/entities/player.ts`)
- class `Player`
  - constructor(scene: GameScene, tileMap: TileMap, startTileX: number, startTileY: number)
  - private state: PlayerState (타입 층 2.2 참조)
  - private sprite: Phaser.GameObjects.Rectangle (단계 4에서 Sprite로 교체)
  - private cursors, private wasdKeys (Phaser key objects)
  - update(time: number, delta: number): WASD 입력 처리 + 이동 + 경계 체크
  - public getState(), public getTilePosition()

### 2.3 입력 처리
- WASD + 화살표 둘 다 지원
- `scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)` 등
- 방향 vector 계산 → **정규화** (대각선도 같은 속도)
- `pixelX += vx * moveSpeed * (delta / 1000)`

### 2.4 맵 경계 clamp
- 맵 픽셀 크기: `MAP_CONFIG.size * MAP_CONFIG.tileSize` = 30 × 32 = 960
- `pixelX`, `pixelY` ∈ `[spriteHalfSize, mapPixelSize - spriteHalfSize]`

### 2.5 카메라 follow
- `this.cameras.main.startFollow(playerSprite)`
- `setLerp(0.1, 0.1)` — 부드럽게
- `setBounds(0, 0, 960, 960)` — 맵 밖으로 카메라 안 나가게

### 2.6 이벤트 발행 (최소한만)
- `player:moved` — **타일 경계 넘을 때만** 발행 (매 프레임 X)
- `tile:entered { tileX, tileY }` — 새 타일 진입 감지 (단계 3 채집에서 사용)

### Done 기준
- [ ] WASD·화살표 키로 상하좌우·대각선 이동
- [ ] 대각선 이동 속도가 직선과 동일
- [ ] 맵 경계에서 멈춤 (안 뚫림)
- [ ] 카메라가 부드럽게 따라감
- [ ] FPS 60 유지
- [ ] 콘솔 에러 0

### 예상 시간: 1~2시간

---

## 단계 3: 자원 채집 + 영토 확장

**목표**: 낮 페이즈 핵심 루프 작동

### 3.1 Config 파일
- `src/config/resource.config.ts`
```ts
export const RESOURCE_CONFIG = {
  collectTimeMs: {          // GDD §5.2 초안
    [ResourceType.WOOD]: 1000,
    [ResourceType.STONE]: 1500,
  },
  collectAmount: {          // 1회 채집당 획득
    [ResourceType.WOOD]: 2,
    [ResourceType.STONE]: 2,
  },
  initialResourcePerTile: 10,    // 타일당 초기 자원량 (초안)
  spawnDensity: 0.15,            // 전체 타일 중 자원 비율 (초안)
  woodStoneRatio: 0.5,           // 나무:돌 = 1:1

  expansionCost: {               // Phase 1: 인접만 (GDD §4.5)
    wood: 10,
    stone: 5,
  },
} as const;
```

### 3.2 자원 타일 스폰
- `TileMap.generateMap()` 내부에 통합
- 중앙 5×5(OWNED) 제외 나머지 25×25에서 랜덤 배치
- 최소 간격 2칸 (뭉치지 않게)
- Tile.resource + Tile.resourceAmount 설정

### 3.3 ResourceSystem 클래스 (`src/systems/resource-system.ts`)
- constructor(scene: GameScene, tileMap: TileMap, player: Player)
- private isCollecting: boolean = false
- private collectTimer: number = 0
- private collectingTile: Tile | null = null
- update(time, delta):
  1. F 키 눌림 확인
  2. 플레이어 위치 타일 or 인접 4방향 자원 타일 탐색
  3. 타이머 진행 → 완료 시 획득
- public tryCollect(): void
- public tryUnlockTile(tileX, tileY): boolean

### 3.4 F 키 채집 로직
- 플레이어 현재 타일 + 4방향 중 자원 있는 타일 찾기
- 찾으면 `collectTimer` 증가
- `collectTimeMs` 도달 → `tile.resourceAmount -= collectAmount`
- `resourceAmount <= 0` → `tile.resource = null`
- 이벤트: `resource:collected { type, amount }`
- 플레이어가 이동하면 채집 취소

### 3.5 타일 확장 (클릭)
- 입력: 마우스 클릭 → 타일 좌표 계산 (`pixelToTile`)
- 조건:
  1. 대상 타일이 EXPLORED 또는 FOG
  2. 인접 4방향에 OWNED 타일 존재
  3. 플레이어 인벤토리 `wood >= 10 && stone >= 5`
- 충족 시: 자원 차감 → 타일 OWNED 전환 → `tile:unlocked`
- 부족 시: `resource:insufficient` 이벤트 + UI 플래시

### 3.6 ResourceBar UI (`src/ui/resource-bar.ts`)
- 상단 좌측 고정 (scrollFactor 0)
- 포맷: `🪵 340  🪨 120`
- `resource:collected` 구독 → 숫자 갱신 + 획득 시 짧은 tween 강조
- `resource:insufficient` 구독 → 해당 자원 텍스트 빨간 플래시

### Done 기준
- [ ] 자원 타일 위·인접에서 F 키 → 채집 타이머 진행
- [ ] 타이머 완료 시 인벤토리 증가
- [ ] 타일 자원 고갈 시 resource null 변경
- [ ] 이동 시 채집 취소
- [ ] 영토 인접(4방향) EXPLORED/FOG 타일 클릭 시 해금
- [ ] 대각선 타일은 확장 불가
- [ ] 자원 부족 시 "부족" 시각 피드백

### 예상 시간: 3~4시간

---

## 단계 4: 낮/밤/빌드 페이즈 루프

> ⚠️ **이 단계 진입 전: Kenney 에셋 도입 (단계 4.0)**

### 4.0 Kenney 에셋 도입 (별도 태스크, 1~2시간)
- **Kenney Tiny Dungeon** 다운로드 → `public/assets/kenney/`
- `PreloadScene` 에 spritesheet 로드 (§1.8 참조)
- TileMap: Graphics → Sprite 전환 (각 타일 하나씩 또는 Phaser Tilemap)
- Player: Rectangle → Sprite 교체
- 몬스터용 프레임 index 메모 (단계 5에서 사용)

### 4.1 Config 파일
- `src/config/time.config.ts`
```ts
export const PHASE_CONFIG = {
  dayDurationMs: {
    early: 90_000,   // 1~3 사이클: 1.5분 (GDD §15.1)
    mid: 150_000,    // 4~9: 2.5분 (Phase 1은 5사이클이라 early만 사용)
    late: 180_000,   // 10~15: 3분
  },
  nightDurationMs: 60_000,  // 1분 (전 사이클 공통)
  // BUILD: 무제한
  maxCycles: 5,     // Phase 1 MVP (GDD §20 Phase 1)
} as const;
```

### 4.2 PhaseManager (`src/systems/phase-manager.ts`)
- class PhaseManager
  - private state: PhaseState
  - constructor(scene: GameScene)
  - start(): void — Day 1 시작
  - update(delta): 낮/밤 타이머 감소
  - transitionTo(nextPhase): 상태 전환 + 이벤트 발행
  - getPhaseDuration(cycle, phase): 사이클·페이즈별 기간
- 이벤트:
  - `phase:dayStart { cycle }`
  - `phase:nightStart { cycle }`
  - `phase:buildStart { cycle }`
  - 구독: `phase:buildEnd` (UI 버튼)

### 4.3 PhaseTimer UI (`src/ui/phase-timer.ts`)
- 상단 중앙 고정 (`scrollFactor: 0`)
- 표시: `☀️ 낮 1 — 1:30` 식
- 페이즈별 색상:
  - 낮: 주황 (`#ff9944`)
  - 밤: 파랑 (`#4477ff`)
  - 빌드: 녹색 (`#44cc88`)
- 남은 시간 **1초 단위** 갱신 (매 프레임 X)

### 4.4 "준비 완료" 버튼
- BUILD 페이즈에만 표시
- 화면 중앙 하단 고정
- `setInteractive()` + `on('pointerdown', ...)`
- 클릭 시 `phase:buildEnd` 이벤트 발행

### 4.5 전환 로직
```
GameScene.create() → PhaseManager.start() → 'phase:dayStart' (cycle=1)
낮 종료 (타이머 0) → 'phase:nightStart'
밤 종료 (타이머 0) → 'phase:buildStart'
빌드 버튼 클릭 → 'phase:buildEnd' → cycle++ → 'phase:dayStart'
cycle > maxCycles 처리는 단계 8에서 승리 조건으로
```

### Done 기준
- [ ] 낮 90초 후 자동 밤 시작
- [ ] 밤 60초 후 빌드 페이즈
- [ ] 빌드 버튼 클릭 → 다음 낮
- [ ] UI에 페이즈·남은 시간 정확
- [ ] 페이즈 전환 이벤트 콘솔 로그 확인
- [ ] Kenney 에셋 도입 완료

### 예상 시간: 2~3시간 + 단계 4.0 에셋 도입 1~2시간

---

## 단계 5: 몬스터 스폰 + 이동

**목표**: 늑대가 밤에 나타나 코어로 전진

### 5.1 Config 파일
- `src/config/monsters.config.ts`
```ts
export const MONSTER_CONFIG = {
  [MonsterType.WOLF]: {
    hp: 20,                  // 초안 // TUNE_AFTER_PHASE1
    attackPower: 5,          // 초안
    moveSpeed: 64,           // 픽셀/초 = 2타일/초
    attackRange: 24,         // 근접
    attackCooldownMs: 1000,
    collisionRadius: 6,
  },
  spawn: {
    // 사이클별 스폰 수 (초안, 실측 튜닝)
    byCycle: [10, 15, 20, 25, 30],  // cycle 1~5
    spawnBurstIntervalMs: 500,       // 몬스터 사이 스폰 간격
  },
} as const;
```

### 5.2 Monster 엔티티 (`src/entities/monster.ts`)
- class Monster
  - constructor(scene, tileMap, core, spawnTileX, spawnTileY, type)
  - private state: MonsterState
  - private sprite
  - update(delta): 직진형 이동 + 타깃 공격 (단계 6)
  - takeDamage(amount): HP 차감, 0 시 `combat:death` + destroy
  - getState(), getSprite()

### 5.3 WaveSpawner (`src/systems/wave-spawner.ts`)
- constructor(scene, tileMap, monsterPool)
- `phase:nightStart` 이벤트 구독
- spawnWave(cycle): config 기반 수량
- 스폰 위치: 맵 가장자리 랜덤 (EXPLORED 또는 FOG 타일)
- 몬스터 간 간격: `spawnBurstIntervalMs` 사용 (버스트 방지)
- 이벤트: `monster:spawned`

### 5.4 직진형 이동 로직
- 타깃: 코어 위치 (Phase 1 단계 5~6 초반)
- 방향 벡터 = `(core.pixelPos - monster.pixelPos)` 정규화
- `pixelPos += dir * moveSpeed * (delta/1000)`
- 도달 판정은 단계 6에서 (공격 로직 포함)

### 5.5 Object Pool 패턴
- Phaser `Group` 사용: `this.physics.add.group({ classType: Monster, maxSize: 50 })`
- `group.get(x, y)` 로 풀에서 꺼냄
- `destroy()` 대신 `setActive(false).setVisible(false)` 로 반환
- 밤 종료 `phase:buildStart` → 전체 반환

### Done 기준
- [ ] `phase:nightStart` → 사이클별 수량 스폰 (분산)
- [ ] 모든 늑대가 코어 방향 이동
- [ ] 밤 종료 시 전부 풀로 반환
- [ ] 20~30마리 동시 FPS 유지

### 예상 시간: 3~4시간

---

## 단계 6: 자동 공격 + HP 전투

**목표**: 실제로 싸움 발생. 공격·피격·HP·다운 상태 작동.

### 6.1 Config
- 플레이어/몬스터 config는 단계 2·5에서 이미 정의
- 신규: `src/config/combat.config.ts`
```ts
export const COMBAT_CONFIG = {
  hitScanEnabled: true,     // Phase 1은 즉발 (투사체 X)
  monsterAttackDistanceTiles: 1,  // 코어·건물 공격 시작 거리
  playerAutoAimRange: 160,  // 플레이어 자동 조준 사거리 (픽셀)
  playerDamageFlashMs: 100, // 피격 시 빨간 플래시 시간
} as const;
```

### 6.2 CombatSystem (`src/systems/combat-system.ts`)
- **전투 조율자**. Player·Monster·Turret 상호작용 여기서
- constructor(scene, player, core, monsterGroup, turretGroup)
- update(delta):
  1. 플레이어 자동 공격 (가장 가까운 몬스터)
  2. 몬스터 각자 타깃 처리 + 공격
  3. 터렛은 단계 7에서 추가

### 6.3 플레이어 자동 조준
- 공격 쿨다운 관리: `lastAttackTime`
- `findNearestMonster(player, monsters)`: `distanceSquared` 비교
- 사거리 내면 hitScan 공격 → `monster.takeDamage()`
- 시각 이펙트: 플레이어 → 몬스터 짧은 라인 0.1초 (단계 4 이후)

### 6.4 몬스터 타깃팅 (GDD §10.4 엄수)
- 영토 경계 진입 시점에 "가장 가까운 공격 대상" 고정 (player | core | building)
- 저장: `MonsterState.currentTarget: TargetRef`
- **타깃 사망·사거리 이탈 시에만** 재탐색 (매 프레임 X)
- 사거리 내 도달 → 공격 쿨다운 체크 → 대미지

### 6.5 대미지 처리
- `player.takeDamage(amount)` → HP 차감
  - HP 0 시 `player:downed` 이벤트, 조작 비활성화, sprite 회색
  - `this.time.delayedCall(PLAYER_CONFIG.downTimerSeconds * 1000, revive)`
  - 부활: HP 100%, sprite 복원, `player:revived`
- `monster.takeDamage(amount)` → HP 0 시 `combat:death` + pool 반환
- `core.takeDamage(amount)` → HP 0 시 `core:destroyed` (단계 8 게임 오버)

### 6.6 시각 피드백 (간단)
- 몬스터 피격: 빨간 tween 플래시 (`sprite.setTint(0xff0000)` → `clearTint()`)
- 코어 피격: 화면 짧은 흔들림 (`this.cameras.main.shake(100, 0.005)`)
- 플레이어 피격: 화면 가장자리 빨간 비네트 (단계 6 후반)

### Done 기준
- [ ] 플레이어가 사거리 내 몬스터 자동 공격
- [ ] 몬스터 HP 0 시 제거
- [ ] 몬스터가 플레이어·코어 공격 (거리 고정 타깃)
- [ ] 플레이어 HP 0 시 다운 30초 → 부활
- [ ] 코어 HP 0 시 `core:destroyed` 트리거
- [ ] 20+ 몬스터 동시 전투 FPS 유지

### 예상 시간: 4~5시간

---

## 단계 7: 건설 + 터렛 방어

**목표**: 빌드 페이즈에서 건물·벽·터렛 건설. 터렛 자동 사격.

### 7.1 Config
- `src/config/buildings.config.ts`
```ts
export const BUILDING_CONFIG = {
  [BuildingType.RESEARCH_LAB]: {
    cost: { wood: 50, stone: 30 },
    hp: 200,
    sizeTiles: { width: 1, height: 1 },  // Phase 1엔 1×1 고정
  },
  [BuildingType.SPIRIT_FOREST]: {
    cost: { wood: 100, stone: 50 },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
    effect: 'wood_collect_bonus_20',  // 단계 7엔 flag만, 실제 효과는 Phase 2
  },
  [BuildingType.WALL]: {
    cost: { wood: 10 },
    hp: 100,
    sizeTiles: { width: 1, height: 1 },
  },
  [BuildingType.BASIC_TURRET]: {
    cost: { wood: 20, stone: 10 },
    hp: 80,
    attackPower: 8,          // 초안
    attackRange: 160,        // 5타일
    attackCooldownMs: 800,
    sizeTiles: { width: 1, height: 1 },
  },
} as const;
```

### 7.2 BuildingSystem (`src/systems/building-system.ts`)
- placeBuilding(type, tileX, tileY): boolean
  - 전제 체크: 영토(OWNED), 건물 없음(`tile.building === null`), 자원 충분
  - 자원 차감 → Tile.building 설정 → Building 인스턴스 생성
  - 이벤트: `building:built`
- destroyBuilding(buildingId): void
  - Tile.building = null, 이벤트 `building:destroyed`

### 7.3 Turret 엔티티 (`src/entities/turret.ts`)
- Building 베이스 + 전투 기능
- private target: Monster | null
- update(delta):
  1. 타깃 없으면 사거리 내 가장 가까운 몬스터 탐색 → **고정**
  2. 타깃 사거리 이탈·사망 → null 리셋
  3. 쿨다운 체크 → hitScan 공격
- 몬스터와 동일 규칙 (§10.4 "방어 터렛 → 몬스터" 항)

### 7.4 BuildMenu UI (`src/ui/build-menu.ts`)
- BUILD 페이즈에만 표시
- 하단 패널: 건물 카드 4개 (연구실/정령의 숲/벽/터렛)
- 각 카드: 아이콘 + 이름 + 비용 표시
- 카드 클릭 → **배치 모드** 진입 (`buildMode.enter(buildingType)`)
- 배치 모드:
  - 마우스 커서 따라 반투명 미리보기 sprite
  - 유효 타일 (OWNED·빈 타일·자원 충분) → 녹색 tint
  - 무효 → 빨간 tint
  - 좌클릭: 배치 / 우클릭 or ESC: 취소

### 7.5 건물·벽 물리 충돌
- Arcade Physics static body 추가
- 몬스터가 벽에 접촉 시 정지 (pathfinding 없는 직진형이라 벽 앞에서 막힘)
- **주의**: 단계 7에선 몬스터가 벽 "공격" 안 함 (Phase 2 멧돼지에서 도입). 단계 7은 벽 단순 장애물
- 건물 HP 0 시 `building:destroyed` + sprite 제거 + Tile.building = null

### 7.6 빌드 모드 중 다른 입력 차단
- BUILD 페이즈 진입 시 플레이어 이동·채집 비활성화
- 일반 DAY 페이즈 돌아가면 활성화

### Done 기준
- [ ] BUILD 페이즈에서 메뉴 열림, DAY/NIGHT에선 숨김
- [ ] 4종 건물 건설 가능 (비용·영토 체크)
- [ ] 자원 부족 시 건설 불가 + 시각 피드백
- [ ] 벽이 몬스터 경로 막음
- [ ] 터렛이 NIGHT에 자동 사격 (고정 타깃)
- [ ] 건물·벽 파괴 시 사라짐

### 예상 시간: 5~6시간

---

## 단계 8: 5사이클 루프 완성 + 승패 판정

**목표**: 한 판 플레이 가능. 승리·패배 화면. 재시작.

### 8.1 사이클 관리 (PhaseManager 확장)
- private cycle: number = 0 (첫 dayStart에서 1로)
- 매 DAY 시작 시 `cycle++`
- `cycle > maxCycles` && coreAlive → `game:won` 이벤트
- `core:destroyed` 이벤트 → `game:lost`

### 8.2 GameScene 승패 처리
- `this.events.on('game:won', () => this.scene.start('GameOverScene', { won: true, cycle, stats }))`
- `this.events.on('game:lost', (data) => this.scene.start('GameOverScene', { won: false, cycle, cause: data.cause }))`

### 8.3 GameOverScene (`src/scenes/game-over-scene.ts`)
- init(data): 승패·통계 받음
- 화면:
  - 승리: "수호자여, 어둠을 물리쳤다!" + 통계 (건설 수, 처치 수)
  - 패배: "코어가 파괴되었습니다 — cycle N"
- 버튼: "다시 하기" → `scene.start('GameScene')` / "타이틀로" → `scene.start('TitleScene')`

### 8.4 TitleScene (`src/scenes/title-scene.ts`)
- 게임 타이틀 (가제: "영토 개척 생존기") 중앙 표시
- "시작" 버튼 → GameScene
- "크레딧" 버튼 → 간단 텍스트 팝업 (Kenney 에셋·Phaser 등)

### 8.5 Scene cleanup (메모리 누수 방지)
- GameScene `shutdown()` 에서:
  ```ts
  this.events.off();          // 모든 리스너 제거
  this.time.removeAllEvents();
  // 모든 커스텀 group·pool destroy
  ```
- 이벤트 리스너 중복 방지 (`on()` 전 `off()` 관례)

### 8.6 통계 수집 (간단)
- GameScene에 private stats: { buildingsBuilt: 0, monstersKilled: 0, cyclesCleared: 0 }
- 각 이벤트 구독하며 카운트
- 게임 오버 시 `GameOverScene`에 전달

### Done 기준
- [ ] TitleScene → GameScene 시작 가능
- [ ] 5사이클 완주 시 승리 화면
- [ ] 코어 파괴 시 패배 화면
- [ ] "다시 하기" 버튼 작동 (새 런 시작)
- [ ] "타이틀로" 버튼 작동
- [ ] 5회 반복 플레이 후 브라우저 메모리 증가 < 10MB
- [ ] 콘솔 에러 0 (Scene 전환 시에도)

### 예상 시간: 2~3시간

---

## 📊 Phase 1 MVP 전체 예상

| 단계 | 예상 시간 |
|------|----------|
| 0. 세팅 | 1~2시간 |
| 1. 타일 맵 | 2~3시간 |
| 2. 플레이어 이동 | 1~2시간 |
| 3. 자원·확장 | 3~4시간 |
| **4.0 Kenney 에셋 도입** | **1~2시간 (별도)** |
| 4. 페이즈 루프 | 2~3시간 |
| 5. 몬스터 (+ Object Pool) | 3~4시간 |
| 6. 전투 (자동 조준·다운·코어) | 4~5시간 |
| 7. 건설·터렛 (+ 빌드 모드 UI) | 5~6시간 |
| 8. 루프 완성 (승/패·재시작·Scene cleanup) | 2~3시간 |
| **+ 플레이 테스트·튜닝** | **3~5시간** |
| **총** | **27~39시간** |

주말 이틀 집중 + 평일 저녁 2~3시간 ≈ **2~4주** 안에 Phase 1 MVP 완성 가능.

> 💡 예상 시간은 Claude Code 활용 기준. 혼자 찾아가며 하면 2~3배 가능.

---

# 📡 층 5. 이벤트 명세 (초안)

| 이벤트 이름 | 발행자 | 페이로드 | 구독자 |
|------------|--------|----------|--------|
| `tile:stateChanged` | TileMap | `{ tileX, tileY, oldState, newState }` | UI, ResourceSystem |
| `tile:unlocked` | ResourceSystem | `{ tileX, tileY, cost }` | TileMap, UI |
| `resource:collected` | ResourceSystem | `{ type, amount }` | UI |
| `resource:insufficient` | ResourceSystem | `{ type, required, have }` | UI |
| `player:moved` | Player | `{ pixelX, pixelY }` | 카메라, CombatSystem |
| `player:damaged` | CombatSystem | `{ amount, source }` | UI, Player |
| `player:downed` | Player | `{ timerSeconds }` | UI |
| `player:revived` | Player | `{}` | UI |
| `phase:dayStart` | PhaseManager | `{ cycle }` | Player, UI |
| `phase:nightStart` | PhaseManager | `{ cycle }` | WaveSpawner, UI |
| `phase:buildStart` | PhaseManager | `{ cycle }` | UI |
| `phase:buildEnd` | UI (버튼) | `{}` | PhaseManager |
| `monster:spawned` | WaveSpawner | `{ monster: MonsterState }` | CombatSystem |
| `monster:died` | CombatSystem | `{ monsterId, dropLocation }` | ResourceSystem (드랍) |
| `combat:damage` | CombatSystem | `{ target, amount, source }` | UI |
| `building:built` | BuildingSystem | `{ building: BuildingState }` | UI, CombatSystem |
| `building:destroyed` | CombatSystem | `{ buildingId, type }` | UI |
| `core:damaged` | CombatSystem | `{ amount, remainingHp }` | UI |
| `core:destroyed` | CombatSystem | `{}` | GameScene (게임 오버) |
| `game:won` | GameScene | `{ cyclesCleared }` | UI |
| `game:lost` | GameScene | `{ cycle, cause }` | UI |

> 단계 진행하면서 이벤트 추가·변경 시 이 표 갱신 필수.

---

# ✅ 층 6. 수용 기준 템플릿

각 단계·티켓이 따라야 할 체크리스트 공통 틀.

### 기능 요구
- [ ] 명시된 동작이 브라우저에서 실제로 작동
- [ ] 콘솔 에러 0개
- [ ] TypeScript 컴파일 에러 0개

### 코드 품질
- [ ] 파일 위치·네이밍 컨벤션 (§1.5) 준수
- [ ] 수치는 `src/config/*.config.ts` 에 분리
- [ ] TBD 값은 `TBD_` 접두어 또는 주석 표시
- [ ] 시스템 간 직접 참조 최소화 (이벤트 활용)

### 성능
- [ ] FPS 30+ 유지 (Chrome DevTools Performance 탭)
- [ ] 메모리 누수 체크 (Scene 재시작 시 이벤트 리스너 cleanup)

### 버전 관리
- [ ] 단계별 git commit (작은 단위로 쪼개기)
- [ ] 커밋 메시지 규칙: `[단계 N.M] 설명`

### 문서화
- [ ] 새 시스템 추가 시 이 문서 층 3 의존성 그래프 갱신
- [ ] 새 이벤트 추가 시 층 5 이벤트 명세 갱신
- [ ] 단계 완료 시 `CLAUDE.md` 작업 기록 추가

## 6.5 Phase 1 완료 시 플레이 테스트 체크리스트

단계 8 Done 이후 전체 플레이 검증용.

### 기능 검증
- [ ] TitleScene → 새 런 시작 가능
- [ ] 5사이클 완주 가능 (승리 화면)
- [ ] 코어 HP 0 시 패배 화면
- [ ] "다시 하기" 작동
- [ ] 런마다 자원 배치 다름 (랜덤 시드)

### 재미 검증 (MVP 핵심 목적)
- [ ] **"밤이 무서운가"** — 몬스터 오는 긴장감 있는가
- [ ] **"빌드 페이즈에서 고민되는가"** — 자원 배분 선택이 어려운가
- [ ] **"낮 파밍이 할 일 있는가"** — 단순 노동 아닌가
- [ ] 5사이클 완주가 30~60분 내 (설계 목표)
- [ ] 30분 후에도 지루하지 않음 (플레이어 3명 내외 테스트 권장)

### 밸런스 검증 (§15.4 황금 비율)
- [ ] 1사이클 자원 획득 ≈ 해당 사이클 테크 업글 비용 × 1.5배
- [ ] 몬스터 DPS vs 플레이어+시설 DPS 비율 적절 (§15.3)
  - Phase 1엔 수치 없이 체감 확인 → OPEN_ISSUES에 기록
- [ ] 다운 상태 30초 체감 (짧은지 긴지 플레이어 피드백)

### 기술 검증
- [ ] FPS 60 유지 (몬스터 30마리 + 터렛 10개 동시)
- [ ] 메모리 누수 체크: 5회 반복 플레이 후 Chrome Task Manager 탭 메모리 증가 < 10MB
- [ ] Scene 재시작 후 기능 정상 (이벤트 중복 발행 X)
- [ ] 모바일 Chrome(가로 1280×720) 접속 시 UI 깨짐 없음 (해상도 대응 확인 — Phase 4+ 본격은 아님)

### 피드백 수집
- [ ] 플레이 테스트 결과 기록 파일 생성: `docs/PLAYTEST_PHASE1.md`
- [ ] 튜닝 필요한 수치 목록 → `OPEN_ISSUES.md` P0 항목 해결 또는 후속 P1로 이월
- [ ] "Phase 2 전에 수정해야 할 것" 목록 정리

### Phase 2 진입 판단 기준
플레이 테스트 후 아래 중 **하나라도** 해당하면 Phase 1 연장 (재튜닝):
- 5사이클 완주율 < 50% (너무 어려움)
- 30분 경과 시 "지루하다" 피드백 다수
- Core Pillar 5개 중 하나라도 훼손된 느낌 (GDD §1.5)

모든 기준 통과하면 → **Phase 2 시작** (돌·철·금 계열, 가공 자원, 토템 등)

---

# 📎 부록 A. Phaser 3 핵심 API 참고

참고용 (세부는 구현 시 공식 문서·예제 확인).

| 용도 | API |
|------|-----|
| Scene 구조 | `preload()`, `create()`, `update(time, delta)` |
| 스프라이트 | `this.add.sprite(x, y, 'key')`, `this.physics.add.sprite(...)` |
| 물리 | Arcade Physics (`this.physics.add.collider`, `overlap`) |
| 입력 | `this.input.keyboard.createCursorKeys()`, `this.input.on('pointerdown', ...)` |
| 이벤트 | `this.scene.events.emit/on/off` |
| 그래픽 | `this.add.graphics()` + `fillRect`, `strokeRect` |
| 텍스트 | `this.add.text(x, y, '...', { fontSize, color })` |
| 타이머 | `this.time.delayedCall(ms, callback)`, `this.time.addEvent({ delay, callback, loop })` |
| 애니메이션 | `this.anims.create(...)`, `sprite.play('key')` |
| 트윈 | `this.tweens.add({ targets, ..., duration })` |
| 카메라 | `this.cameras.main.startFollow(target)`, `setBounds`, `setZoom` |

---

# 📎 부록 B. MVP 스코프 경계 — **안 하는 것**

유혹 많지만 Phase 1에선 **절대 건드리지 말 것**:

- ❌ 돌·철·금 계열 건물·테크
- ❌ 가공 자원 시스템
- ❌ 토템 시스템
- ❌ 수정 채집
- ❌ 바이오옴 랜덤 생성
- ❌ 거리 기반 확장 비용 (인접만)
- ❌ 테마 웨이브·최종 보스
- ❌ 유물·도감·메타 성장
- ❌ 캐릭터 해금 (광부 1명 고정)
- ❌ 난이도 슬라이더
- ❌ 상점·1회용 아이템
- ❌ BGM·세밀한 사운드 (기본 SE만 옵션)
- ❌ 커스텀 아트 (Kenney 무료 팩만)
- ❌ 세이브/로드 (한 판 끝나면 리셋)
- ❌ 모바일 터치 입력 (키보드+마우스만)

이거 지키는 게 곧 "MVP 완성"의 핵심.

---

# 📝 변경 이력

- **2026-04-24 (v0.1)**: 뼈대 작성 — 층 1~3 상세, 층 4 단계 1 상세·2~8 개요, 층 5·6 초안
- **2026-04-24 (v0.2)**: 보강 완료 —
  - §1.6 Phaser 구체 설정 (main.ts 구성·Scene 목록·Arcade·FPS)
  - §1.7 성능 가이드라인 (렌더·풀링·이벤트 cleanup·함정)
  - §1.8 에셋 전략 (단계별 도입 시점·Kenney 팩·로딩·라이선스)
  - §1.9 리스크 체크포인트 (8단계별 막힐 지점)
  - **§4 단계 2~8 전부 티켓 레벨 상세화** (Config·시스템·로직·Done 기준)
  - §6.5 플레이 테스트 체크리스트 (기능·재미·밸런스·기술·Phase 2 진입 기준)

---

# 🔜 다음 액션

1. **집 PC 세션 시작 시**: Claude Code에게 "IMPL_PLAN.md 읽고 단계 0부터 시작" 지시
2. **단계 1 진입 전**: "단계 1의 티켓 1.1~1.7 중 1.1부터 세부 스펙 text로 먼저 제안" 요청 → 컨펌 후 구현
3. **단계 1 완료 후**: `CLAUDE.md` 작업 기록에 추가 + 단계 2 티켓 상세화 요청
4. **각 단계 완료 후 문서 갱신**: 의존성 그래프·이벤트 명세·Done 체크
