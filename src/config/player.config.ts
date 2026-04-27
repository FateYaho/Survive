/**
 * 플레이어 설정
 *
 * 관련 문서:
 * - GDD §3 (플레이어 캐릭터), §15 (핵심 수치)
 * - IMPL_PLAN 단계 2
 *
 * ⚠️ 모든 수치는 초안. Phase 1 MVP 플레이 테스트 후 튜닝 (§15.1)
 * // TUNE_AFTER_PHASE1
 */

export const PLAYER_CONFIG = {
  /** 초기 HP — TBD, GDD §15.2 */
  initialHp: 100,
  maxHp: 100,

  /** 공격력 — 무기별 배율 적용 전 기준값 */
  attackPower: 10,

  /** 공격 속도 (초당 공격 횟수) */
  attackSpeed: 1.0,

  /**
   * 이동 속도 (픽셀/초)
   * = 4타일/초 × 32px/타일 (GDD 기준값, MAP_CONFIG.tileSize 변경 시 재계산 필요)
   */
  moveSpeed: 128,

  /** 공격 사거리 (픽셀) — 5타일 상당, TBD */
  attackRange: 160,

  /** 다운 상태 타이머 (초) — GDD §3.3 v1.1, TBD */
  downTimerSeconds: 30,

  /** 충돌 원 반경 (픽셀) */
  collisionRadius: 8,

  /** 시야 반경 (타일, 체비셰프) — 주변이 EXPLORED로 자동 공개됨 */
  visionRadiusTiles: 4,

  /** 스프라이트 — 단계 2~3은 프리미티브, 단계 4에서 Kenney 스프라이트로 교체 */
  sprite: {
    width: 16,
    height: 16,
    /** 임시 색상 (녹색 사각형) */
    initialColor: 0x44ff44,
  },
} as const;
