# 📜 ADR (Architecture Decision Records)

> 큰 설계 결정만 기록. 변경 로그는 [../CHANGELOG.md](../CHANGELOG.md), 현재 구조는 [../ARCHITECTURE.md](../ARCHITECTURE.md).

## 작성 규칙

- 파일명: `NNNN-짧은-제목.md` (NNNN은 4자리 zero-padded)
- 최신 번호 갱신용으로 이 README 위 인덱스 추가
- 형식: **Context** (배경/문제) / **Decision** (결정 내용) / **Consequences** (영향·트레이드오프)
- 짧게. 1~2 페이지면 충분
- "왜 이렇게 했는지" 6개월 뒤 자기가 봐도 이해되게

## 인덱스

| # | 제목 | 날짜 | 상태 |
|---|------|------|------|
| [0001](0001-phase-order.md) | 페이즈 순서 변경 (DAY → BUILD → NIGHT) | 2026-04-25 | 적용됨 |
| [0002](0002-vision-vs-expand-to-collect.md) | 시야 시스템 도입 + 채집 조건 완화 | 2026-04-25 | 적용됨 |
| [0003-economy-tier-scaling.md](0003-economy-tier-scaling.md) | 확장 비용 계단식 스케일링 | 2026-04-25 | 적용됨 |
| [0004](0004-meta-progression.md) | 메타 진행 모델 — 롤체식 수평 다양성 | 2026-04-27 | 적용됨 |
| [0005](0005-biome-system.md) | 바이옴 시스템 — 매 판 자원 분포 절차적 생성 | 2026-04-27 | 적용됨 |

## 새 ADR 만들 때

```
docs/adr/NNNN-슬러그.md
```

내용 템플릿:
```markdown
# ADR-NNNN: 제목

**날짜**: YYYY-MM-DD
**상태**: 적용됨 | 검토중 | 폐기됨 | 대체됨 (→ ADR-NNNN)

## Context (배경)
무엇이 문제였나? 왜 결정이 필요했나?

## Decision (결정)
구체적으로 뭘 하기로 했나?

## Consequences (영향)
- ✓ 좋은 점
- ✗ 나쁜 점
- 🔧 후속 작업 필요한 것
```
