# 🏗 사전 작성된 코드 스켈레톤 안내

> **작성일**: 2026-04-24
> **상태**: Cowork(Claude)가 회사 PC에서 미리 작성한 초기 코드
> **집 Claude Code가 첫 세션에서 읽을 것**

---

## 📌 사용 버전 (중요)

**최종 선택 (2026-04-24 웹 확인 후)**: 안정성 중심 조합.

| 패키지 | 버전 | 선택 이유 |
|--------|------|----------|
| **Phaser** | `^3.90.0` | v3 최종 (2025-05 릴리즈). Phaser 4는 major 재작성·breaking change → 첫 게임엔 비추 |
| **TypeScript** | `^5.6.0` | 5.x 안정판. TS 6.0도 호환 가능하지만 5.x 유지 |
| **Vite** | `^6.0.0` | Vite 8은 Rolldown/Oxc 기반 (신규 빌드 엔진). 6이 안정 |
| **Node.js** | 18 이상 필요 | Vite 6 요구사항. Kai PC는 v24 — 문제 없음 |

### 2026-04 최신 대비 선택 근거

현재(2026-04-24) 진짜 최신:
- Phaser **4.0** 출시됨 — 전면 재작성, breaking change 다수 → **안 씀**
- Vite **8.0.9** — Rolldown 기반 전환 → 플러그인 생태계 불확실 → **Vite 6 사용**
- TypeScript **6.0.3** — 대부분 호환되나 5.6 충분 → **5.x 유지**

### ⚠️ 작성자(Claude) knowledge cutoff: **2025년 5월**

- Cowork Claude 학습 데이터는 2025년 5월까지
- 그 이후 나온 API·기능은 모름
- **Phaser 3·Vite 5·TS 5 범위에서 작성한 코드** → 이 버전 조합에서 안전

### 집 첫 세션 시 설치 확인

```bash
# 설치 (package.json 기반)
npm install

# 설치된 실제 버전 확인
npm list phaser vite typescript

# 만약 breaking change 이슈 있으면:
npm install phaser@3.90 vite@6 typescript@5.6  # 명시적 고정
```

### Phaser 4 언제 고려?
- Phase 6+ 정식 출시 (Steam·모바일 앱스토어) 검토 시점
- 그때 Phaser 4 생태계 성숙했는지 확인 후 판단
- Phase 1~5는 **Phaser 3 고정**

---

## 📋 이 파일이 있는 이유

집 PC 세팅 시간을 줄이려고, Cowork에서 **실행 불필요한 안전한 코드**만 미리 작성해뒀음:

- 타입 정의 (컴파일 시 사용, 런타임 로직 없음)
- Config 상수 (순수 값)
- Phaser 기본 세팅 보일러플레이트 (공식 문서 표준 패턴)
- index.html, package.json, tsconfig.json, vite.config.ts

**주의**: Cowork 샌드박스에서 `npm run dev` 실행·브라우저 확인 불가. 그래서 **아직 한 번도 실행 검증 안 됨.** 집에서 처음 돌릴 때 에러 날 가능성 있음.

---

## 📂 미리 작성된 파일 목록

```
game-dev/
├── index.html                 ← Phaser 마운트용 (#game-container)
├── package.json               ← 의존성 명시 (phaser, vite, typescript)
├── tsconfig.json              ← TypeScript strict 설정
├── vite.config.ts             ← Vite + @/ alias 설정
│
└── src/
    ├── main.ts                ← Phaser 게임 인스턴스 생성
    │
    ├── types/                 ← 모든 도메인 타입 정의
    │   ├── tile.ts            (TileState, ResourceType, Tile, MapConfig)
    │   ├── building.ts        (BuildingType, BuildingState, TurretState)
    │   ├── player.ts          (PlayerState, Inventory, createEmptyInventory)
    │   ├── monster.ts         (MonsterType, MovePattern, AttackPattern, MonsterState, TargetRef)
    │   ├── phase.ts           (PhaseType, PhaseState)
    │   ├── core.ts            (CoreState)
    │   └── index.ts           (barrel)
    │
    ├── config/                ← 모든 수치 설정 (TBD 주석 포함)
    │   ├── game.config.ts     (캔버스 크기, FPS, 디버그)
    │   ├── map.config.ts      (30×30, tileSize=32)
    │   ├── player.config.ts   (HP, 이동 속도, 다운 타이머)
    │   ├── time.config.ts     (낮/밤/빌드 길이)
    │   ├── resource.config.ts (채집 시간·비용, 확장 비용)
    │   ├── monsters.config.ts (WOLF 스탯, 사이클별 스폰)
    │   ├── buildings.config.ts(건물 4종 스펙)
    │   ├── combat.config.ts   (CORE_CONFIG 포함)
    │   └── index.ts           (barrel)
    │
    ├── scenes/                ← Phaser Scene 3개
    │   ├── boot-scene.ts      ← 빈 → PreloadScene 전환
    │   ├── preload-scene.ts   ← 빈 (단계 4에서 Kenney 로드 추가)
    │   ├── game-scene.ts      ← ★ 단계 0 스텁: "Hello, 수호자여" 텍스트
    │   └── index.ts           (barrel)
    │
    ├── entities/              ← 빈 폴더 (단계 2부터 Player, Monster, Turret 추가)
    ├── systems/               ← 빈 폴더 (단계 1부터 TileMap, ResourceSystem, ...)
    └── ui/                    ← 빈 폴더 (단계 3부터 ResourceBar, PhaseTimer, ...)
```

---

## 🏠 집 첫 세션에서 Claude Code가 할 일

### 1️⃣ 의존성 설치

```bash
npm install
```

→ `node_modules/` 생성. 약 1~2분.

### 2️⃣ TypeScript 컴파일 검증

```bash
npm run typecheck
```

→ 에러 0개면 OK. 에러 있으면 수정.

**흔한 에러 예상**:
- import path 오타 → 수정
- strict mode 위반 → null 체크 추가
- circular import → type-only import로 변경

### 3️⃣ Dev 서버 실행

```bash
npm run dev
```

→ 브라우저가 자동으로 안 열리면 http://localhost:5173 접속.

### 4️⃣ 검증: 검은 캔버스에 "Hello, 수호자여" 보이는지

**성공 기준**:
- 검은 화면 (1280×720, 창 크기 맞춰 축소)
- 중앙에 흰색 텍스트 "Hello, 수호자여"
- 콘솔 에러 0개
- FPS 60 유지

**실패 시 트러블슈팅**:
- 흰 화면 → 콘솔 확인, `#game-container` 없음이면 index.html 점검
- 모듈 에러 → import 경로 확인, `@/` alias 동작 확인
- Phaser 로딩 실패 → `npm install phaser` 재시도
- 포트 충돌 (5173 사용 중) → `vite.config.ts` 에서 포트 변경

### 5️⃣ Git commit

```bash
git add .
git commit -m "Phase 1 단계 0: Phaser 초기 세팅 완료

- 타입·Config 파일 전체 사전 작성
- Hello World 검증 Scene
- Vite + TypeScript + Phaser 3 초기 구성"
git push
```

### 6️⃣ 단계 1 시작

> Claude Code에 요청:
> "IMPL_PLAN.md 단계 1 타일 맵 렌더링 시작. 티켓 1.1부터 1.7까지 순서대로. 각 티켓 구현 전에 상세 스펙 text로 먼저 보여줘."

---

## ⚠️ 알려진 이슈 가능성

Cowork 샌드박스에서 실행 검증 안 했으므로 아래 이슈 가능성 있음:

### 이슈 1: Phaser 버전 (`^3.85.0`)
- 내 knowledge cutoff 기준 합리적 버전
- 더 최신 버전 있으면 `npm install phaser@latest` 로 업그레이드
- 주요 API 변경 없으면 코드 수정 불필요

### 이슈 2: Vite 버전 (`^5.0.0`)
- 5.x 또는 6.x 모두 동작 예상
- `npm install vite@latest` 로 최신 확인

### 이슈 3: TypeScript strict 에러
- Strict 모드라서 null·undefined 엄격
- 단계 1부터 실제 로직 구현 시 Claude Code가 수정하면 됨
- 현재 스켈레톤은 strict 준수 확인됨 (로직 미니멀이라)

### 이슈 4: `src/scenes/game-scene.ts` 현재 GAME_CONFIG 임포트
- `import { GAME_CONFIG } from '../config';`
- barrel export 경유라 순환 import 없음 확인
- 만약 에러 나면 직접 import: `'../config/game.config'`

### 이슈 5: `circular dependency between tile.ts ↔ building.ts`
- Tile.building → BuildingType (type only)
- TurretState → TargetRef (type only)
- `import type` 사용해서 런타임 순환 없음
- 컴파일 에러 나면 type-only import 강제

---

## 🔜 단계 1 진입 전 Claude Code 확인 사항

단계 1 시작하기 전에 **스켈레톤 검증 단계 완료**:
- [ ] `npm install` 성공
- [ ] `npm run typecheck` 에러 0
- [ ] `npm run dev` 성공 → "Hello, 수호자여" 화면 확인
- [ ] 첫 git commit + push 완료

이거 끝나면 → `IMPL_PLAN.md` 단계 1 티켓 1.1 시작.

---

## 📝 이 파일 유지 정책

- **단계 0 검증 완료 후**: 이 파일 삭제 or `docs/archived/CODE_SKELETON_NOTES.md` 로 이동
- **이슈 발견 시**: 이 파일에 기록 남긴 뒤 수정 (다른 환경 세팅 시 참고)
