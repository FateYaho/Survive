# 🏠 집 Cowork에 시킬 요청 가이드

> 이 프로젝트 폴더를 집 PC로 옮긴 후, Claude Desktop의 Cowork에게 시킬 작업 가이드입니다.

---

## 📦 1단계: 파일 위치 확인

이 폴더(`game-dev`)를 집 PC의 원하는 위치에 복사하세요.

**Windows 예시**:
```
C:\projects\game-dev\
```

**macOS 예시**:
```
~/projects/game-dev/
```

**현재 폴더에 있어야 할 파일들**:
- ✅ `CLAUDE.md`
- ✅ `README.md`
- ✅ `.gitignore`
- ✅ `SETUP.md` (이 파일)
- ✅ `docs/GDD.md`

---

## 🤖 2단계: Cowork에게 시킬 요청문

Claude Desktop 앱을 열고:

1. **"Cowork"** 탭 선택
2. **"Projects"** → **"+"** → **"Import a project"**
3. 위에서 복사한 `game-dev` 폴더 선택
4. 프로젝트 이름 입력 (예: "게임 개발" 또는 "Survival Roguelike")

그런 다음 **첫 대화**에서 아래 요청문을 그대로 복붙하세요:

---

### 📋 복붙용 요청문

```
안녕 Claude, 새 게임 개발 프로젝트를 시작할거야. 

먼저 다음 파일들을 순서대로 읽고 프로젝트 맥락을 파악해줘:
1. CLAUDE.md (프로젝트 현재 상태와 작업 가이드)
2. docs/GDD.md (게임 디자인 문서 v1.0)

읽은 후에 아래 작업을 진행해줘:

## 작업 1: Git 초기화 + GitHub 연결
1. 이 폴더를 git 저장소로 초기화
2. 현재 파일들을 첫 커밋으로 기록 (커밋 메시지: "Initial commit: 기획 완성 (GDD v1.0)")
3. GitHub에 "game-dev"라는 이름의 Private Repo를 만들어야 해
   - GitHub CLI(gh)가 설치되어 있으면 `gh repo create` 로 자동 생성해도 돼
   - 없으면 나한테 알려줘. 내가 웹에서 만들고 URL 줄게
4. Remote 연결 후 push

## 작업 2: Phaser 3 + Vite 프로젝트 초기화
1. `npm create vite@latest . -- --template vanilla-ts` 로 Vite + TypeScript 세팅
   (현재 폴더에 바로 설치, 기존 파일은 유지)
2. `npm install phaser` 로 Phaser 3 설치
3. 기본 폴더 구조 생성:
   - src/scenes/
   - src/entities/
   - src/systems/
   - src/config/
   - src/assets/
4. `src/main.ts` 에서 Phaser 게임 인스턴스 초기화
5. 빈 화면(검은 캔버스)이라도 뜨게 "Hello World" 씬 만들기
6. `npm run dev` 로 로컬 서버 실행해서 정상 작동 확인

## 작업 3: 작업 완료 후 할 일
1. CLAUDE.md의 "현재 진행 상태" 섹션 업데이트
2. CLAUDE.md의 "작업 기록" 섹션에 오늘 작업 추가
3. git commit + push

작업하다가 확인이 필요한 부분 있으면 중간에 물어봐줘. 
내 설정(userPreferences)에 따라:
- 모르는 값이나 확인 안 된 정보는 절대 추정하지 말고 물어볼 것
- 특히 포트 번호, 환경변수 같은 건 반드시 확인
- 기존 코드베이스가 아직 없으니 새로 만드는 건 괜찮아
```

---

## 🎯 이게 왜 이렇게 구성됐는지

**한 번에 너무 많이 시키지 않나요?** 싶을 수 있는데, 사실 이건 **"Phaser Hello World"까지의 최소 세트**예요. 각 작업이 독립적이지 않고 순서대로 연결돼야 하거든요.

**Cowork가 중간에 물어볼 법한 것들**:
- GitHub 사용자명 (Repo 만들 때 필요)
- `gh` CLI 설치 여부
- Vite 템플릿 선택 옵션 (vanilla-ts 명시해뒀으니 괜찮을 듯)

---

## 🚨 만약 문제가 생기면

### 상황 1: "gh CLI 없다"고 함
- GitHub 웹에서 직접 만드세요: github.com → New repository → Private 선택
- Repo URL 복사해서 Cowork에게 주면 계속 진행 가능

### 상황 2: `npm create vite@latest` 가 현재 폴더에 설치 안 하려고 함
- Cowork한테 이렇게 말하세요:
  > "일단 임시 폴더에 Vite 프로젝트 만들고, 그 안의 파일들을 현재 폴더로 이동한 후 임시 폴더 삭제해줘"

### 상황 3: 포트 충돌 (5173 등이 이미 쓰이고 있음)
- Cowork가 물어볼 거예요. 다른 포트(예: 3000, 5174) 알려주면 됩니다

### 상황 4: Node.js 버전 문제
- Node 18 이상이 필요합니다
- `node -v` 로 확인. 낮으면 업데이트 후 재시도

---

## ✅ 1단계 완료 후 확인할 것

작업 끝나면 다음이 가능해야 해요:

- [ ] `npm run dev` 실행 시 브라우저에서 빈 화면(또는 Hello World)이 뜸
- [ ] GitHub에 Private Repo가 생성됨
- [ ] `git status` 깨끗함 (모두 커밋됨)
- [ ] CLAUDE.md의 "현재 진행 상태" 갱신됨

---

## 🎮 다음 단계 (1단계 끝난 후)

Phaser + Vite 세팅이 끝나면, 다음 작업을 Cowork에게 시키면 됩니다:

```
다음 작업:
30x30 타일 맵을 Phaser로 렌더링해줘.
- 각 타일은 16x16 픽셀
- 중앙 5x5만 밝게 보이고, 나머지는 안개(회색)로 덮임
- 타일 좌표를 콘솔에 표시하는 디버그 모드도 같이

구현 전에 설정 파일 구조 제안해주고, 내 확인 받은 후 진행해줘.
GDD의 섹션 4 (맵 & 영토 시스템) 참조할 것.
```

이런 식으로 **GDD 섹션을 참조하라고 명시**하면 Cowork가 기획과 일치하게 작업해요.

---

## 💡 Cowork 효율적으로 쓰는 팁

1. **큰 작업은 쪼개기**: "게임 만들어줘" X, "타일 맵 먼저" O
2. **GDD 섹션 참조**: "GDD 섹션 6 참고해서..." 라고 하면 정확도 높음
3. **설정 파일 먼저**: 수치·상수는 코드 전에 config 파일로
4. **작업 후 CLAUDE.md 업데이트**: "오늘 한 일 CLAUDE.md에 반영해줘" 한마디면 끝
5. **커밋 메시지 시키기**: "git commit 메시지 제안해줘" 도 OK

---

*이 파일은 첫 세팅 끝나면 삭제해도 됩니다.*
