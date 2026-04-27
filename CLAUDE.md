# 🎮 영토 개척 생존기 (가제)

> **이 파일은 새 세션 시작 시 가장 먼저 읽는 입구입니다.**
> 게임이 뭔지 + 지금 뭐 하고 있는지 + 어떤 파일 봐야 하는지 + 자주 하는 작업 + 절대 규칙 — 이 5가지가 다 들어 있습니다.

---

## 📌 게임 한 줄 요약

낮엔 영토를 넓히며 자원을 캐고, 밤엔 몰려오는 적으로부터 코어를 지킨다.
**탑다운 서바이벌 + 타워디펜스 + 로그라이크**. Phaser 3 + TypeScript + Vite.

**개발자**: Kai (혼자, 비개발자, 첫 게임 개발. Claude Code 협업).

---

## 📅 지금 어디까지 했나 (2026-04-27)

- ✅ **Phase 1 MVP 코드 완성** (단계 0~8). 타이틀 → 게임 → 승패 → 재시작 전체 루프 작동.
- ✅ **Phase 2 step 1~3 머지 완료**:
  - step 1: 4종 자원(나무/돌/철/금) 일반화 + ResourceBar 통일
  - step 2: 대장간(FORGE) + 공장(FACTORY) 추가 — 철·금 생산 라인
  - step 3: 특수 터렛 4종(돌 발리스타·기관총·마법 구슬·회전 가시) + 슬로우 시스템
- ✅ **Patch B 옵션 E+G 적용**: 제재소 5s→8s, 채석장 8s→12s, DAY(early) 90s→60s
- ✅ **Phase 2+ 디자인 방향성 결정** (2026-04-27 세션):
  - ADR-0004: 메타 진행 모델 (롤체식 수평 다양성, BM 안 박음, 한 판 내 캐릭터 성장 O)
  - ADR-0005: 바이옴 시스템 (시드 기반 절차적, 매 판 자원 분포 변동, 풍부도 그라데이션)
  - 추가 결정 → `docs/OPEN_ISSUES.md` "ADR-0006 박을 때 정식 옮김" 메모 (1티어/2티어 자원 구조 6종, 캐릭터 성장 (iii) 모델, 4계열 보호 메카닉, FORGE/FACTORY 처리 등)
- 🛑 **Survive 일시 동결 검토**: 디자인 인플레이션 인지 (매 결정마다 새 시스템 추가 → 비개발자 첫 게임 스코프 초과 우려). **랜디(랜덤 디펜스) 새 프로젝트 먼저** 빠른 학습 사이클 돌리고 복귀 검토.
- 📋 **다음 세션 시작점**: (A) 랜디 새 프로젝트 시작 (새 GDD 초안부터) / (B) Survive 다시 (우선순위·스코프 결정부터) — 그때 결정

> 자세한 변경 이력은 [docs/CHANGELOG.md](docs/CHANGELOG.md). 결정 근거는 [docs/adr/](docs/adr/).

---

## 📚 어떤 파일 봐야 하나 (모르면 읽어, 추측 X)

| 알고 싶은 것 | 보는 파일 |
|------------|----------|
| **지금 코드 어떻게 생겼나** (시스템·이벤트·의존성·패턴) | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **언제 뭐가 왜 바뀌었나** (역순) | [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| **왜 이 설계를 골랐나** (큰 결정) | [docs/adr/](docs/adr/) |
| **게임 디자인 전체** (성경) | [docs/GDD.md](docs/GDD.md) |
| **Phase 1 구현 계획** (단계별 티켓) | [docs/IMPL_PLAN.md](docs/IMPL_PLAN.md) |
| **밸런스 계산 가이드** | [docs/BALANCE_CALC.md](docs/BALANCE_CALC.md) |
| **방향성 결정 메모** | [docs/DIRECTION_BRIEF.md](docs/DIRECTION_BRIEF.md) |
| **Phase 2 미해결 이슈** | [docs/OPEN_ISSUES.md](docs/OPEN_ISSUES.md) |
| **밸런스 마지막 적용 수치** | [docs/ECONOMY_CONFIG_FINAL.md](docs/ECONOMY_CONFIG_FINAL.md) |
| 실제 수치 | `src/config/*.ts` |
| 게임 코드 | `src/` (entities · systems · scenes · ui · types) |

---

## 🛠 자주 하는 작업 (스킬북)

> 사용자 요청 보고 어떻게 처리할지 모를 때 여기 먼저 봐.

### 🟢 1. "게임 켜줘 / 서버 켜"
```bash
npm run dev    # http://localhost:5173/
```
Vite HMR로 코드 바꾸면 자동 리로드. 백그라운드 실행 권장.

### 🟢 2. "밸런스 X 조정 / XX가 너무 비싸/싸/적어/많아"
1. [docs/BALANCE_CALC.md](docs/BALANCE_CALC.md) 읽고 현재 수치 + 계산법 파악
2. `src/config/*.ts` 해당 파일 수정 (절대 코드 안에 하드코딩 X)
3. **`docs/CHANGELOG.md` 맨 위에 `[BALANCE]` 항목 추가**
4. `npm run typecheck` 통과 확인

### 🔴 3. "버그가 있어 / X가 작동 안 해"
1. 어떤 시스템 담당인지 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)에서 찾기
2. 원인 파악 → 수정
3. **`docs/CHANGELOG.md` 맨 위에 `[BUG FIX]` 항목 추가** (무엇 + 왜 망가졌는지 / 어디서 / 관련)
4. 재발 방지 패턴이면 `docs/ARCHITECTURE.md` "주요 패턴" 섹션에도 추가

### 🟡 4. "새 기능 추가 / 새 시스템 추가"
1. [docs/GDD.md](docs/GDD.md)·[docs/IMPL_PLAN.md](docs/IMPL_PLAN.md)에서 스펙 확인
2. **MVP 범위 초과면 사용자에게 먼저 확인** (스스로 추가 X)
3. 코드 작성
4. **CHANGELOG에 `[FEATURE]` 항목** + **새 파일·시스템·이벤트면 ARCHITECTURE 업데이트**
5. **트레이드오프 큰 결정이면 `docs/adr/NNNN-*.md` 새 ADR 작성**

### 🟢 5. "지금 뭐 하고 있었지? / 어디까지 했지?"
1. 이 파일 "지금 어디까지 했나" 섹션
2. [docs/CHANGELOG.md](docs/CHANGELOG.md) 최근 5~10개 항목
3. `git log --oneline -10`

### 🟡 6. "이 코드 왜 이래? / 왜 이렇게 짠 거야?"
1. `git log -p <파일>` — 누가 언제 왜 바꿨는지
2. [docs/adr/](docs/adr/) — 큰 설계 결정 근거 검색
3. [docs/CHANGELOG.md](docs/CHANGELOG.md) — 변경 이력 검색 (Ctrl+F 파일명)
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) "주요 패턴" 섹션 (예: UI 버튼 hit-test 이슈 등)

### 🟡 7. "git 커밋 / 푸시"
- 의미 단위로 커밋. 메시지에 **왜** 적기.
- 형식: `종류: 한 줄 요약` (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `balance:` 등)
- 끝에 `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- **git config는 절대 수정 X** (사용자 동의 없이). `git -c user.name="FateYaho" -c user.email="FateYaho@users.noreply.github.com"` 플래그로 per-command 커밋
- Repo: https://github.com/FateYaho/Survive
- 푸시는 사용자 명시적 요청 시만

### 🟢 8. "타입체크 / 빌드"
```bash
npm run typecheck   # tsc --noEmit
npm run build       # 프로덕션 빌드 (tsc + vite build)
npm run preview     # 빌드 결과 미리보기
```

### 🔴 9. "Phase 2 시작 / 다음 페이즈로"
[docs/GDD.md](docs/GDD.md) §20 (Phase별 범위) + [docs/OPEN_ISSUES.md](docs/OPEN_ISSUES.md) Phase 2 항목 + [docs/DIRECTION_BRIEF.md](docs/DIRECTION_BRIEF.md) 읽기. **큰 작업이라 먼저 사용자와 방향 확인.**

### 🟡 10. "테스트해보자 / 플레이해줘"
- UI 변경이면 직접 브라우저(`localhost:5173`)에서 사용자가 확인. AI는 화면 못 봄.
- 콘솔 로그 확인하려면 사용자에게 F12 → Console 탭 보라고 안내.
- DevSkipButton(상단 우측 ⏭) 사용해 페이즈 빨리 넘기기.

---

## ⚠️ 절대 규칙

### 🎯 게임 디자인
1. **GDD 우선**: 코드와 GDD 충돌 시 GDD 따름. GDD 자체 변경은 사용자 컨펌.
2. **Core Pillars 사수** (5가지, GDD §0):
   ① 수평적 특화 (선형 X)  ② 능동적 맵 설계  ③ 리듬감 있는 긴장 (낮↔밤)  ④ 매 런 다양성  ⑤ 파밍의 탐험적 즐거움
3. **MVP 범위 절제**: "있으면 좋을 것 같은" 기능 스스로 추가 X. 반드시 사용자와 확인.

### 💻 코드 작성
4. **수치는 config로**: 밸런싱 숫자 절대 하드코딩 X. `src/config/*.ts`만 수정.
5. **추정 X**: 환경변수·포트·API 경로·외부 값 절대 추정 X. 모르면 사용자에게 물어봄.
6. **파일명 `kebab-case`, 클래스 `PascalCase`, 함수/변수 `camelCase`**.

### 🗂 기록 시스템 (빼먹으면 디버깅 토큰 폭발 — 반드시)
7. **모든 코드 변경 → `docs/CHANGELOG.md` 맨 위에 항목 추가**
   - config 한 줄 바꿔도 기록
   - 형식: `## YYYY-MM-DD\n### [TAG] 한줄요약\n- 무엇/왜/파일/관련` (CHANGELOG 헤더 참조)
   - TAG: `[BUG FIX]`, `[FEATURE]`, `[BALANCE]`, `[REFACTOR]`, `[REMOVE]`, `[DOC]`, `[ARCH]`, `[CONFIG]`, `[FIX-FEEDBACK]`
8. **새 시스템·파일·이벤트·의존성 → `docs/ARCHITECTURE.md` 업데이트**
   - 단순 수치 조정·버그 수정은 ARCHITECTURE 갱신 X (CHANGELOG에만)
9. **큰 설계 결정 (트레이드오프) → `docs/adr/NNNN-제목.md` 새 ADR**
10. **`CLAUDE.md`는 가급적 수정 X**. 이건 입구·규칙 파일. 진행상태·이력은 CHANGELOG/ARCHITECTURE/ADR로.
11. **세션 시작 흐름**: 이 파일 → 필요 시 ARCHITECTURE → 필요 시 CHANGELOG 최근 N개

---

## 🎨 게임 핵심 요약 (빠른 참조)

### 페이즈 흐름 (현재 코드)
```
DAY (90s, 채집·확장·건설) → BUILD (무제한, 건설·정비, '준비' 버튼)
                              → NIGHT (60s, 전투) → DAY (cycle+1)
```
- 5사이클 NIGHT 전부 버티면 **승리**
- 코어 HP 0이면 **패배**

### Phase 1 MVP 범위 (현재)
- 30×30 맵, 중앙 4×4 초기 영토
- 자원: 나무·돌 (Iron·Gold는 Phase 2+)
- 건물: 벽 / 터렛 / 제재소(나무 자동 생산) / 채석장(돌 자동 생산) — 각 maxCount 별도
- 몬스터: 늑대 1종 (사이클별 10/15/20/25/30 마리)
- 시야: 플레이어 주변 4타일 자동 EXPLORED

### 4개 테크 계열 (Phase 2+ 예정, **현재 Phase 1엔 나무 계열만**)
🪵 나무 (자연/생명) · 🪨 돌 (대지/탱커) · ⚙️ 철 (산업/자동화) · ✨ 마법 (광역 원소)

### 핵심 기술 패턴 (자주 쓰임)
- **모든 UI 버튼**: `setInteractive` 안 씀. `scene.input.on('pointerdown')` + 좌표 수동 판정
  - 이유: `setInteractive + setScrollFactor(0)` + 작은 카메라 bounds 조합에서 hit-test 불발
- **시스템 간 순환 의존**: setter 주입 (`waves.setBuildingSystem(bs)`, `resources.setPlacementMode(pm)` 등)
- **자원 채집 시**: `decrementResource()` 호출 전에 `tile.resource` 변수에 캡처 (호출 후 null 됨, NaN 방지)

---

## 💻 기술 스택 / 플랫폼

- **엔진**: Phaser 3.90  /  **언어**: TypeScript 5.6  /  **번들러**: Vite 6.0  /  **패키지**: npm
- **캔버스**: 16:9 (1280×720)
- **출시 순서** (길 A): 웹 (Vercel/itch) → Capacitor 모바일 → 토스인앱 → Steam (Phase 6+)
- **모바일 친화** (Phase 1부터 반영): 터치 44×44 px, 30fps 타겟, 1사이클마다 세이브

### 토스인앱 참고 (Phase 5)
- 개발자 센터: https://developers-apps-in-toss.toss.im/
- 콘솔: https://apps-in-toss.toss.im/
- llms.txt: https://developers-apps-in-toss.toss.im/llms.txt

---

*이 파일이 길어지면 분리 신호. 항상 "한 화면에 들어오는 입구"로 유지.*
