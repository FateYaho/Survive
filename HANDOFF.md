# 🏠 집 Cowork 이어받기 가이드

> **작성일**: 2026-04-24 (기획 마무리 완료 시점)
> **다음 작업 위치**: 집 PC (USB로 폴더 통째로 옮김)
> **이 파일을 집 Cowork에게 가장 먼저 읽어달라고 할 것.**

---

## ✅ 기획 상태: **v1.1 완성 (본문 반영 완료)**

회사 PC에서 기획을 **전면 마무리**했음:
- GDD.md 본문이 **v1.1로 전면 갱신**됨 (Part 1~3 모두 병합)
- DECISIONS.md / OPEN_ISSUES.md 최신 상태
- 이제 코딩 시작할 준비 끝

---

## 🎯 집 Cowork에 복붙할 요청문

```
Cowork 안녕. 회사에서 기획 마무리하고 USB로 옮겨왔어.

먼저 맥락 파악 순서:
1. HANDOFF.md (이 파일)
2. CODE_SKELETON_NOTES.md (사전 작성된 코드 안내 — 회사에서 미리 작성해뒀음)
3. CLAUDE.md (프로젝트 전체 맥락)
4. docs/IMPL_PLAN.md (Phase 1 MVP 구현 계획)
5. docs/GDD.md (게임 디자인 — 필요 시 참조)
6. docs/OPEN_ISSUES.md (미해결 이슈)

**첫 할 일**: CODE_SKELETON_NOTES.md "집 첫 세션에서 할 일" 체크리스트 따라서:
- npm install
- npm run typecheck (에러 나면 수정)
- npm run dev → 브라우저에서 "Hello, 수호자여" 텍스트 확인
- git commit + push
- 그 다음 IMPL_PLAN.md 단계 1 시작

중간에 확인 필요한 거 있으면 꼭 물어봐 — 특히 포트/환경변수/API키는 절대 추정 금지.
```

---

## 📦 USB로 가져올 파일 체크리스트

`game-dev` 폴더 통째로 복사. 빠지면 안 되는 파일:

- [ ] `HANDOFF.md` (이 파일)
- [ ] `CLAUDE.md`
- [ ] `README.md`
- [ ] `SETUP.md`
- [ ] `.gitignore`
- [ ] `docs/GDD.md` ← **v1.1 완성본**
- [ ] `docs/IMPL_PLAN.md` ← **Phase 1 MVP 구현 계획**
- [ ] `docs/DECISIONS.md`
- [ ] `docs/OPEN_ISSUES.md`
- [ ] `docs/GDD_v1.1_patch.md` (아카이브)
- [ ] **`CODE_SKELETON_NOTES.md`** ← **🆕 사전 작성 코드 안내**
- [ ] **`index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`** ← **🆕 루트 세팅 파일**
- [ ] **`src/`** 하위 전부 (types/, config/, scenes/, entities/, systems/, ui/) ← **🆕 사전 작성 코드**
- [ ] `src/` (빈 폴더 + .gitkeep)
- [ ] `assets/` (빈 폴더 + .gitkeep)

**주의**: `.git/` 폴더는 **없어야 정상**. 회사에서 샌드박스 권한 이슈로 반쯤 망가진 걸 지웠음. 집에서 `git init -b main`으로 깨끗하게 시작.

---

## 📋 다음 할 일 (우선순위 순)

### 1️⃣ Git 초기화 + 첫 커밋

집 PC 터미널에서 `game-dev` 폴더로 이동 후:

```bash
# 1) git 초기화
git init -b main

# 2) 상태 확인 (node_modules/dist 등 아직 없음, 문서·src 있음)
git status

# 3) 첫 커밋
git add .
git commit -m "Initial commit: 기획 완료 + 코드 스켈레톤 사전 작성

- 기획 문서: GDD v1.1, IMPL_PLAN, DECISIONS, OPEN_ISSUES
- 코드 스켈레톤: types/, config/, scenes/, main.ts, index.html
- 세팅 파일: package.json, tsconfig.json, vite.config.ts
- 단계 0 검증 대기 (Hello World)"

# 4) GitHub Private Repo 생성·연결
gh repo create game-dev --private --source=. --push
# 또는 웹에서 만들고: git remote add origin ... && git push -u origin main
```

---

### 2️⃣ 의존성 설치 + 단계 0 검증

```bash
npm install
npm run typecheck   # TypeScript 에러 0 확인
npm run dev         # → http://localhost:5173
```

브라우저에서 **"Hello, 수호자여"** 텍스트 뜨면 성공. 에러 나면 `CODE_SKELETON_NOTES.md` "알려진 이슈 가능성" 섹션 참조.

---

### 3️⃣ 단계 0 검증 커밋

```bash
git add .
git commit -m "Phase 1 단계 0 검증 완료: Hello World 렌더 확인"
git push
```

---

### 4️⃣ Phase 1 MVP 구현 시작

GDD.md §20 Phase 1 체크리스트 참조:

- [ ] 30×30 고정 맵, 중앙 5×5 초기 공개
- [ ] 자원 2종 (나무, 돌)
- [ ] 페이즈 구조 (낮/밤/빌드) 완비
- [ ] 나무 계열 건물 2종 (연구실, 정령의 숲)
- [ ] 플레이어 조작 (WASD 이동, 자동 공격, 채집, 건설)
- [ ] 터렛 1종, 벽 1종
- [ ] 몬스터 1종 (늑대: 직진형)
- [ ] 타일 확장 (인접만)
- [ ] 영토 = 방어 영역 규칙
- [ ] 승리/패배 판정
- [ ] 5사이클 플레이 가능

**첫 스텝 추천**: 30×30 타일 맵 렌더링 (시각 확인) → WASD 이동 → 한 사이클 루프.

---

## 🟣 4/23 토스 세미나 후 확인 항목

세미나 다녀와서 `docs/OPEN_ISSUES.md` 🟣 플랫폼 전략 섹션 업데이트:

- [ ] 토스인앱 게임 등급분류 절차·비용
- [ ] 토스 SDK 연동 범위 (리더보드/광고/인앱결제)
- [ ] WebView 최대 번들 사이즈·성능 제약
- [ ] Phaser 3 호환 실사례
- [ ] 심사 난이도·소요 시간

---

## ⚠️ 집 Cowork가 헷갈릴 만한 포인트

1. **GDD.md는 v1.1.** DECISIONS/GDD_v1.1_patch는 변경 근거 참고용 (본문은 이미 최신).
2. **기초 자원 4종 (나무·돌·철·금)** — 수정(Crystal)은 토템 전용 재료. `enum ResourceType`에 CRYSTAL 넣지 말 것.
3. **공중 몬스터 없음 + 유닛 시스템 없음** — 박쥐 삭제, 모든 "유닛"은 터렛/시설로 통합.
4. **자동 조준 + 다운 부활** — Vampire Survivors 스타일. HP 0 → 30초 후 코어에서 자동 부활. 자원 손실 없음.
5. **플랫폼 전략 = 웹 우선** — Phase 3에서 Vercel/itch.io로 1차 출시. 모바일·토스인앱은 웹 반응 보고 Phase 4+ 결정.
6. **융합 테크 없음** — v1.1에서 제외. 각 계열 T0~T4 독립 트리만. Phase 5+ 재검토.
7. **수치는 placeholder 많음** — 코어 HP, 최종 보스 HP 등 TBD. `src/config/*.config.ts`에 `TBD_` 접두어 또는 `// TUNE_AFTER_PHASE1` 주석.
8. **Kai 선호 (userPreferences 중요)**:
   - 모르는 값 추정 금지 → placeholder 또는 질문
   - 포트/환경변수/DB 정보 절대 추정 금지
   - Word/PPT 만들기 전 text로 먼저 보여줄 것

---

## 📌 현재 프로젝트 상태 한눈에

| 항목 | 상태 |
|------|------|
| GDD v1.0 | ✅ 완료 |
| v1.1 결정사항 합의 | ✅ (DECISIONS.md) |
| v1.1 패치 Part 1~3 | ✅ 완료 |
| **GDD.md 본문 v1.1 반영** | ✅ **완료** (2026-04-24) |
| **IMPL_PLAN.md v0.2 풀 상세** | ✅ **완료** (2026-04-24) |
| **코드 스켈레톤 사전 작성** | ✅ **완료** (types·config·scenes·main.ts) |
| Git 초기화 | ❌ 집에서 |
| GitHub Private Repo | ❌ 집에서 |
| **npm install + 단계 0 검증** | ❌ 집에서 (Hello World 확인) |
| 토스 세미나 참석 | 📅 4/23 |
| Phase 1 MVP 단계 1+ 코딩 | ⏳ 검증 후 |

---

*기획은 끝났고, 이제 실제로 돌아가는 게 나올 차례. 집에서 Cowork 불러서 git init + Vite 세팅부터 시작하면 됨. 화이팅!*
