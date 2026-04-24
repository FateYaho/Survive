# 🎮 영토 개척 생존기 (가제)

> **이 파일을 가장 먼저 읽어주세요.** 이 파일은 Cowork/Claude Code가 프로젝트 맥락을 이해하기 위한 핵심 문서입니다.

---

## 📌 프로젝트 개요

- **장르**: 탑다운 서바이벌 + 타워디펜스 + 로그라이크
- **참고 게임**: Dome Keeper (가장 유사), Slay the Spire (빌드 다양성)
- **타겟 플랫폼**: 웹 브라우저 (PC 우선)
- **타겟 유저**: 개인 취미 + 포트폴리오 프로젝트
- **개발자**: Kai (혼자, 처음 만드는 게임)

## 🎯 한 줄 요약

> 낮엔 영토를 넓히며 자원을 캐고, 밤엔 몰려오는 적으로부터 코어를 지켜라. 수집한 자원으로 특화 테크를 타며 매번 다른 빌드로 생존하는 로그라이크 서바이벌.

---

## 📚 필수 문서

작업 시작 전 반드시 읽을 것:

1. **`docs/GDD.md`** — 게임 디자인 문서 **(v1.1 본문 반영 완료)**. 이것이 게임의 "성경"
2. **`docs/IMPL_PLAN.md`** — **Phase 1 MVP 구현 계획** (아키텍처·데이터 모델·의존성·단계별 티켓·이벤트 명세)
3. **`docs/OPEN_ISSUES.md`** — 미해결 이슈 중앙 트래커 (Phase별 결정 대기 항목)
4. **`docs/DECISIONS.md`** — v1.1 확정 결정사항 변경 근거
5. **`docs/GDD_v1.1_patch.md`** — v1.0→v1.1 Before→After 기록용 (아카이브)
6. **이 CLAUDE.md 파일** — 현재 진행 상태 및 작업 컨텍스트

> ✅ **GDD.md v1.1 본문 반영 완료** (2026-04-24). Part 1~3 패치 전부 병합됨. 이제 GDD.md만 보면 됨. `DECISIONS.md`·`GDD_v1.1_patch.md`는 변경 근거 참고용으로 보존.

---

## 🛠 기술 스택

| 항목 | 선택 |
|------|------|
| 게임 엔진 | **Phaser 3** |
| 언어 | **TypeScript** |
| 번들러 | **Vite** |
| 패키지 매니저 | npm |
| 저장소 | 로컬스토리지 (MVP) |
| 배포 | Vercel 또는 Netlify (정적 호스팅) |
| 버전 관리 | Git + GitHub (Private Repo) |
| 모바일 래핑 | **Capacitor** (Phase 4~) |
| 토스인앱 래핑 | **WebView 기반** (Phase 5~) |
| Steam 래핑 | Electron (Phase 6+, 미정) |

### 플랫폼 출시 순서 (길 A 확정, 2026-04-22)

1. **Primary**: 웹 (Vercel/Netlify, itch.io) — Phase 1~3 재미 검증
2. **Secondary**: 모바일 앱 (Capacitor → iOS/Android 스토어) — Phase 4
3. **Secondary**: **토스인앱** (WebView 기반, Phaser 호환 확인됨) — Phase 5
4. **Tertiary**: Steam (Electron 래핑 or Godot 재작성 고민) — Phase 6+

### 모바일 친화 코딩 가이드라인 (Phase 1부터 반영)

- **해상도**: 16:9 기준 + 스케일 컨테이너로 여백 처리 (다양한 폰 비율)
- **UI 터치 크기**: 버튼·인터랙션 요소 **최소 44×44 px**
- **입력 추상화**: `InputManager` 레이어로 키보드/마우스 ↔ 터치/조이스틱 교체 가능하게
- **성능 목표**: **30fps** (모바일 저사양 가정)
- **세이브**: 1사이클만 해도 진행도 저장 (모바일 짧은 세션 대응)

### 토스인앱 개발 참고 링크 (집 Cowork에서 활용)

- 개발자 센터: https://developers-apps-in-toss.toss.im/
- 콘솔: https://apps-in-toss.toss.im/
- 게임 검수 체크리스트: https://developers-apps-in-toss.toss.im/checklist/app-game.html
- Claude Code용 공식 플러그인: `/plugin marketplace add toss/apps-in-toss-skills`
- MCP 서버 (집 PC 세팅 시): `brew tap toss/tap && brew install ax` → `claude mcp add --transport stdio apps-in-toss ax mcp start`
- llms.txt 문서 인덱싱용: https://developers-apps-in-toss.toss.im/llms.txt

---

## 📅 현재 진행 상태

### 완료 ✅
- [x] 기획 완성 (GDD v1.0 작성)
- [x] 경쟁 분석 완료 (Dome Keeper 벤치마킹)
- [x] 기술 스택 결정
- [x] 프로젝트 폴더 초기 구조 생성
- [x] **GDD v1.0 전면 검토 완료** (2026-04-22)
- [x] **v1.1 결정사항 합의** (DECISIONS.md · OPEN_ISSUES.md 작성)
- [x] **GDD v1.1 패치안 Part 1~3 작성 완료**
- [x] **GDD.md 본문 v1.1 반영 완료** (2026-04-24) ← **기획 마무리 지점**
- [x] **`npm install` + Hello World 실행 검증** (2026-04-24, 코워크 PC)
- [x] **단계 1: 30×30 TileMap 렌더링 + fog + 디버그 완료** (2026-04-24)
- [x] **단계 2: 플레이어 + WASD 이동 + 카메라 follow 완료** (2026-04-24)
- [x] **단계 3: 자원 채집(F) + 영토 확장(클릭) + ResourceBar UI 완료** (2026-04-24)
- [x] **단계 4: PhaseManager + PhaseTimer + ReadyButton 완료** (2026-04-24, 단계 4.0 에셋 도입은 스킵)
- [x] **Core 시각화 + DevSkipButton(개발용 페이즈 스킵) 추가** (2026-04-24)
- [x] **단계 5: Monster + WaveSpawner 완료** (2026-04-24, 이동만 — 전투는 단계 6)
- [x] **단계 6: CombatSystem + HP + 다운/부활 + 코어 피격 완료** (2026-04-24)
- [x] **단계 7: BuildingSystem + Turret + BuildMenu + 벽/건물 HP바 + 몬스터 건물 공격 완료** (2026-04-24)
- [x] **단계 8: 사이클 승패 + GameOverScene + TitleScene + 통계 완료** (2026-04-24) 🎉
- [x] **Phase 1 MVP 전체 완성** (2026-04-24) — 단계 0~8 한 세션 내 연속 진행

### 진행 중 🔄
- [ ] GitHub Private Repo 생성 및 연결 (집에서)
- [ ] 토스 세미나 참석 (4/23) → 플랫폼 세부 확인

### 다음 할 일 📋
1. `git init -b main` + 첫 커밋 (집 PC)
2. Phase 1 MVP 전체 플레이 테스트 + 밸런스 튜닝 (몬스터 수·HP·공격력·자원 비용 등)
3. Kenney 에셋 도입 (Rectangle → Sprite)
4. Phase 2 계획 수립 (GDD §20 참조)
4. 단계 6: CombatSystem (자동 조준, 다운, 코어)
5. 단계 7: BuildingSystem + Turret (빌드 페이즈 UI)
6. 단계 8: 사이클·승패 판정 + 재시작
7. `git init -b main` + 첫 커밋 (집 PC)

---

## 🎨 게임 핵심 설계 (요약)

자세한 내용은 `docs/GDD.md` 참조. 여기는 빠른 참조용.

### 5가지 Core Pillars (게임의 정체성)
1. **수평적 특화** — 선형 테크 트리 X, 계열별 깊이
2. **능동적 맵 설계** — 토템으로 자원 유도
3. **리듬감 있는 긴장** — 낮(계획) ↔ 밤(실행)
4. **매 런의 다양성** — 랜덤성 유지
5. **파밍의 탐험적 즐거움** — 이걸 해치는 시스템은 배제

### 페이즈 구조
```
☀️ 낮 (파밍) → 🌙 밤 (전투) → 🧘 빌드 페이즈 (사고) → 다음 사이클
```

### 4개 테크 계열
- 🪵 나무 (자연/생명) - 플레이어 딜러, 시설 탱커
- 🪨 돌 (골렘/대지) - 플레이어 탱커, 시설 딜러
- ⚙️ 철 (기계/산업) - 자동화 중심
- ✨ 마법 (아케인) - 광역 원소 공격

### 승리/패배 조건
- **승리**: 15사이클 최종 보스(4부위 약점) 처치
- **패배**: 코어 HP 0 (유일한 패배 조건)

---

## 📐 MVP 범위 (Phase 1)

**목표**: "낮에 확장, 밤에 방어, 빌드 페이즈 고민"이 재밌는지 검증

- 30x30 고정 맵 (중앙 5x5만 초기 공개)
- 자원 2종 (나무, 돌)
- 나무 계열 건물 2종 (연구실, 정령의 숲)
- 몬스터 1종 (늑대)
- 5사이클 플레이 가능

**범위 절제 원칙**: 4계열 전부 구현 욕심 내지 말 것. 나무 계열부터 완성.

---

## 🧑‍💻 코딩 컨벤션 (초안, 구현 중 확정)

- 타일 좌표: `{ x: number, y: number }` 객체
- 자원 타입: `enum ResourceType { WOOD, STONE, IRON, GOLD }` (수정은 토템 전용 재료, §7 참조. v1.1에서 기초 자원 4종으로 축소)
- 상수는 별도 config 파일로 분리 (밸런싱 용이)
  - 예: `src/config/time.config.ts`, `src/config/resources.config.ts`
- 파일명: `kebab-case` (예: `tile-map.ts`)
- 클래스명: `PascalCase`
- 함수·변수: `camelCase`

---

## 📂 예상 폴더 구조

```
game-dev/
├── CLAUDE.md              ← 이 파일 (항상 최신 상태 유지)
├── README.md              ← 프로젝트 소개
├── .gitignore
├── package.json           ← npm 세팅 후 생성
├── vite.config.ts         ← Vite 세팅 후 생성
├── tsconfig.json          ← TypeScript 세팅
├── index.html             ← 엔트리 HTML
├── docs/
│   ├── GDD.md             ← 게임 디자인 문서 (v1.1) ← **본문 작업용**
│   ├── IMPL_PLAN.md       ← Phase 1 MVP 구현 계획 (아키텍처·타입·의존성·티켓)
│   ├── DECISIONS.md       ← v1.1 확정 결정사항 (근거)
│   ├── OPEN_ISSUES.md     ← 미해결 이슈 중앙 트래커
│   └── GDD_v1.1_patch.md  ← v1.0→v1.1 Before→After 기록 (아카이브)
├── src/
│   ├── main.ts            ← 엔트리 포인트
│   ├── scenes/            ← Phaser 씬들
│   ├── entities/          ← 플레이어, 몬스터 등
│   ├── systems/           ← 게임 시스템 (자원, 건설 등)
│   ├── config/            ← 설정 상수
│   └── assets/            ← 이미지, 사운드
└── public/                ← 정적 파일
```

---

## 🔁 다른 PC에서 작업 재개 시 체크리스트

1. `git pull` 로 최신 상태 동기화
2. 이 `CLAUDE.md` 파일 읽기 (현재 상태 파악)
3. `docs/GDD.md` 참조 (기획 복습)
4. 최근 커밋 메시지 확인 (`git log --oneline -10`)
5. "다음 할 일" 섹션부터 시작

---

## 📝 작업 기록 (Worklog)

> 큰 작업 완료 시마다 날짜 + 내용 추가.
> 이 기록이 다른 PC에서 맥락 이어가는 데 도움 됩니다.

- **2026-04-22**: 기획 완성. GDD v1.0 작성 완료.
- **2026-04-22**: 프로젝트 초기 구조 생성 (CLAUDE.md, docs/GDD.md, README.md).
- **2026-04-22**: GDD v1.0 전면 검토. 22개 이슈 식별 → Kai와 논의하며 v1.1 방향 합의.
  - 주요 결정: 자원 5→4종(수정 삭제·토템 재료화), T0~T4 체계 신설, 가공 자원 시스템(Phase 2+), 유닛 소환 삭제(터렛으로 통합), 공중 몬스터 제거, 사망 페널티 C안(다운+부활), 자동 조준, 맵 30×30 통일.
  - 산출물: `DECISIONS.md`, `OPEN_ISSUES.md`, `GDD_v1.1_patch.md`(Part 1/3 완료).
- **2026-04-22**: 플랫폼 전략 "길 A" 확정. 웹 1차 → Capacitor 모바일 → 토스인앱 WebView → Steam 검토. CLAUDE.md에 모바일 친화 가이드라인·토스인앱 참고 링크 반영.
- **2026-04-24**: GDD v1.1 패치안 Part 2/3, Part 3/3 완성.
  - Part 2: §6 T0~T4·3범주 연구·터렛 특수 스킬·융합 테크 제외 / §7 수정=토템 재료 / §8 자발적 종료 유도 연출 / §10 박쥐→그림자·타깃팅 3주체 규칙
  - Part 3: §12 4부위 HP TBD·클리어 경로 3→2개 / §15 실측 튜닝 정책·시설 DPS 신규 / §19 플랫폼 배포 전략 / §20 Phase 3 웹 1차 출시
- **2026-04-24**: **GDD.md 본문 v1.1 반영 완료** — Part 1~3 전부 본문에 병합. `GDD_v1.1_patch.md`는 아카이브 상태로 보존. 기획 마무리 지점.
- **2026-04-24**: **`docs/IMPL_PLAN.md` v0.1 뼈대 작성 완료** — Phase 1 MVP 구현 계획. 아키텍처 원칙(Scene 내 상태·Scene Events·Vite HMR 재빌드), 데이터 모델(7개 도메인 타입), 의존성 그래프, 단계 0~8 Task 브레이크다운(단계 0·1 상세·2~8 개요), 이벤트 명세 초안, 수용 기준 템플릿.
- **2026-04-24**: **`docs/IMPL_PLAN.md` v0.2 풀 상세화 완료** — 5개 섹션 보강:
  - §1.6 Phaser 구체 설정 / §1.7 성능 가이드 / §1.8 에셋 전략 / §1.9 리스크 체크포인트
  - **단계 2~8 전부 티켓 레벨 상세화** (Config·클래스·로직·Done 기준)
  - §6.5 플레이 테스트 체크리스트 (재미·밸런스·Phase 2 진입 기준)
  - 총 ~1300줄. Claude Code가 문서만 보고 단계별 즉시 진행 가능한 수준.
- **2026-04-24**: **코드 스켈레톤 사전 작성 완료** (Cowork에서 실행 검증 없이 안전한 파일만):
  - 루트: `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`
  - `src/types/` 6개 파일 + barrel (Tile, Building, Player, Monster, Phase, Core)
  - `src/config/` 8개 파일 + barrel (game, map, player, time, resource, monsters, buildings, combat)
  - `src/scenes/` 3개 파일 + barrel (Boot, Preload, Game) — GameScene은 단계 0 Hello World 스텁
  - `src/main.ts` (Phaser 게임 인스턴스 초기화)
  - 안내: `CODE_SKELETON_NOTES.md` (집 첫 세션 체크리스트, 예상 이슈, 트러블슈팅)
  - **집 PC 첫 세션 예상**: `npm install` → `npm run dev` → "Hello, 수호자여" 확인 → git commit. 10~15분 예상.
- **2026-04-24**: **코워크 PC 첫 실행 + 단계 0 검증** — `npm install` 완료(17 packages), `npm run dev` → "Hello, 수호자여" 렌더 확인. 경미한 타입 에러 1건 수정 (`events.off()` → `removeAllListeners()`).
- **2026-04-24**: **단계 1 완료** — 30×30 TileMap 렌더링.
  - 신규: `src/systems/tile-map.ts`, `src/systems/index.ts`
  - 수정: `src/scenes/game-scene.ts` (TileMap 연동 + 카메라 setBounds·centerOn + F1 격자 토글 + 마우스 호버 좌표 표시)
  - Done 기준 전부 충족: 30×30 격자, 중앙 5×5 OWNED(초록), 주변 FOG(짙은 회색), 이벤트(`tile:stateChanged`) 발행, 좌표 변환(tile↔pixel), 타입체크 통과, 콘솔 에러 0.
  - 카메라 줌: 1.5 시도했으나 상단 잘림으로 1.0 유지 (TODO: 플레이어 합류 후 재튜닝). `MAP_CONFIG.tileSize`는 32 유지.
- **2026-04-24**: **단계 2 완료** — 플레이어 + WASD 이동.
  - 신규: `src/entities/player.ts` (Player 클래스), `src/entities/index.ts`
  - 수정: `game-scene.ts` (Player 생성, `cam.startFollow` lerp 0.1, update 루프)
  - Done 기준 충족: WASD+화살표, 대각선 정규화(`Math.hypot`), 맵 경계 clamp, 카메라 부드럽게 follow, 타일 경계 넘을 때만 `player:moved`·`tile:entered` 이벤트 발행.
- **2026-04-24**: **단계 3 완료** — 자원 채집 + 영토 확장.
  - 신규: `src/systems/resource-system.ts`, `src/ui/resource-bar.ts`, `src/ui/index.ts`
  - 수정: `tile-map.ts` (spawnResources 밀도 15%·최소 간격 2칸, 자원 마커 Graphics 레이어, `hasOwnedAdjacent`/`findCollectibleNear`/`decrementResource`), `player.ts` (`addResource`/`trySpend`, 시작 인벤토리 WOOD 20·STONE 10), `resource.config.ts` (startingInventory 추가), `game-scene.ts` (ResourceSystem·ResourceBar 연동 + 디버그 HUD 채집 진행률)
  - 결정: Bootstrap은 **A안(시작 인벤토리 지급)**. 자원 마커는 OWNED 타일에서만 보이고 FOG는 숨김. 확장은 인접 4방향만(대각선 불가).
- **2026-04-24**: **단계 4 완료** — 페이즈 루프.
  - 신규: `src/systems/phase-manager.ts`, `src/ui/phase-timer.ts`, `src/ui/ready-button.ts`
  - 수정: `resource-system.ts` (DAY 페이즈에만 채집/확장 허용), `game-scene.ts` (연동 + 페이즈 전환 콘솔 로그)
  - 단계 4.0(Kenney 에셋)은 스킵 — 루프 먼저 돌리고 아트는 나중에 일괄 교체 결정.
- **2026-04-24**: **Core 시각화 + 개발용 페이즈 스킵 버튼** 추가.
  - 신규: `src/entities/core.ts` (파란 사각형 마커, 중앙 고정 HP 100 상태 보유, applyDamage는 단계 6 연동 예정)
  - 신규: `src/ui/dev-skip-button.ts` (상단 우측 "⏭ 다음 페이즈", 튜닝/디버그용)
- **2026-04-24**: **🎉 단계 8 완료 — Phase 1 MVP 전체 완성!**
  - 신규: `src/scenes/title-scene.ts` (타이틀 + 시작 버튼), `src/scenes/game-over-scene.ts` (승/패 메시지 + 통계 + 재시작/타이틀 버튼)
  - 수정: `phase-manager.ts` (maxCycles(5) 완주 시 game:won, core:destroyed 구독 시 game:lost, ended 플래그), `game-scene.ts` (통계 카운터, game:won/lost 구독 + GameOverScene 전환, restart 시 상태 초기화, shutdown에 children/input/keyboard 정리), `preload-scene.ts` (GameScene 직행 → TitleScene), `main.ts` (TitleScene + GameOverScene 등록), `scenes/index.ts`
  - Scene cleanup 패턴 확립: removeAllListeners + removeAllEvents + input.removeAllListeners + keyboard.removeAllKeys + children.removeAll(true).
  - **한 세션(2026-04-24)에 단계 0~8 전부 연속 진행 성공**. IMPL_PLAN 예상 27~39시간 작업량을 Claude Code 협업으로 압축.
- **2026-04-24**: **단계 7 완료** — 건설 + 터렛 + 벽 공격 (IMPL_PLAN Phase 2 항목 선행 도입).
  - 신규: `src/entities/building.ts` (HP 바 포함), `src/entities/turret.ts` (자동 사격, 주황 라인), `src/systems/building-system.ts` (placement validation + 터렛 라우팅 + getBuildingAt), `src/systems/placement-mode.ts` (고스트 프리뷰 + 좌클릭 배치 + 우클릭·ESC 취소), `src/ui/build-menu.ts` (BUILD 전용 하단 4카드)
  - 수정: `monster.ts` (다음 타일에 건물 있으면 공격으로 전환 — IMPL_PLAN이 Phase 2로 미뤘지만 테스트 재미 위해 단순 구현), `wave-spawner.ts` (BuildingSystem setter 주입으로 순환 의존 해결), `player.ts` (`resource:spent` 이벤트 추가), `resource-bar.ts` (`resource:spent` 구독으로 소비 시 UI 갱신)
  - 버그 수정: 건설 시 ResourceBar 미갱신 → `resource:spent` 이벤트 도입으로 해결.
  - 결정: 모든 건물 타입이 몬스터 경로 블로킹 (Phase 1 단순화).
- **2026-04-24**: **단계 6 완료** — 전투 시스템.
  - 신규: `src/systems/combat-system.ts` (플레이어 자동 조준 160px·1초 쿨·노란 라인 80ms), `src/ui/hp-bar.ts` (PLAYER/CORE 텍스트 HP, 30% 미만 빨강)
  - 수정: `core.ts` (CORE_CONFIG 500 HP로 교체, takeDamage + 화면 흔들림 + core:destroyed), `player.ts` (takeDamage + 플래시 + 다운 30초 + 자동 부활), `monster.ts` (타깃 락킹 · 근접 공격 1초 쿨 · 흰 플래시 on takeDamage), `wave-spawner.ts` (Monster에 Player 참조 주입), `game-scene.ts` (CombatSystem·HpBar 연동)
  - 결정: 타깃 락킹은 GDD §10.4 단순화 버전 — "타깃 사망 시에만 재탐색". 영토 경계 진입 기반 재탐색은 Phase 2+.
- **2026-04-24**: **단계 5 완료** — 몬스터 스폰 + 이동.
  - 신규: `src/entities/monster.ts` (WOLF 빨간 14×14, 직선 이동, takeDamage/destroy 스텁), `src/systems/wave-spawner.ts` (NIGHT 시 사이클별 10/15/20/25/30마리, 0.5s 버스트 스폰, BUILD 진입 시 전부 정리)
  - 수정: `resource-system.ts` (UI 상단 영역 클릭 무시), `game-scene.ts` (WaveSpawner 연동, HUD에 몬스터 카운트)
  - 결정: Object Pool 패턴은 MVP 생략 — Set<Monster>로 관리. 30마리 수준은 성능 이슈 없음. 필요 시 Phase 2 전환.
  - 버튼 이슈: `setInteractive + setScrollFactor(0)` + 작은 카메라 bounds 조합에서 hit-test 불발 확인. **모든 UI 버튼은 `scene.input.on('pointerdown')` + 스크린 좌표 수동 판정 패턴 사용** (DevSkipButton / ReadyButton 둘 다 재작성).

---

## ⚠️ 중요 규칙 (Claude 작업 시 지킬 것)

1. **GDD 우선**: 코드가 GDD와 충돌하면 GDD를 따를 것. GDD 자체를 바꿀 일이면 먼저 사용자와 확인.
2. **Core Pillars 사수**: 5가지 Core Pillars를 훼손하는 변경은 하지 말 것.
3. **수치는 설정 파일로**: 밸런싱 숫자는 하드코딩 금지. config 파일로 분리.
4. **MVP 범위 지킬 것**: "추가하면 좋을 것 같은 기능" 스스로 추가하지 말 것. 사용자와 확인 후 진행.
5. **작업 완료 시 이 파일 업데이트**: "현재 진행 상태" + "작업 기록" 섹션 최신화.
6. **추정 금지**: DB 접속 정보, 환경변수, 포트 번호, 외부 API 같은 값은 절대 추정하지 말 것. 반드시 사용자에게 확인.

---

## 🎨 아트 & 사운드 (Phase 1 임시)

- **아트**: Kenney.nl 무료 픽셀 팩 사용 (16×16 타일 기준)
- **사운드**: freesound.org 또는 Kenney 사운드 팩
- 정식 커스텀 아트는 Phase 3 이후

---

## 🔗 유용한 링크

- [Phaser 3 공식 문서](https://phaser.io/phaser3)
- [Phaser 3 예제](https://phaser.io/examples/v3.85.0)
- [Vite 공식 문서](https://vitejs.dev)
- [Kenney 에셋](https://kenney.nl/assets)
- [itch.io 에셋](https://itch.io/game-assets)

---

*이 문서는 프로젝트의 살아있는 나침반입니다. 큰 변경이 있을 때마다 업데이트하세요.*
