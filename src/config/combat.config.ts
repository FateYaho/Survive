/**
 * 전투 시스템 설정
 *
 * 관련 문서:
 * - GDD §10.4 (타깃팅 규칙), §3 (플레이어 공격)
 * - IMPL_PLAN 단계 6
 */

export const COMBAT_CONFIG = {
  /** Phase 1은 hitScan(즉발). 투사체는 Phase 2+ */
  hitScanEnabled: true,

  /** 몬스터가 코어·건물 공격 시작 거리 (타일) */
  monsterAttackDistanceTiles: 1,

  /** 플레이어 자동 조준 사거리 (픽셀) — GDD §3.6 */
  playerAutoAimRangePx: 160,

  /** 피격 시 빨간 플래시 지속 시간 (ms) */
  damageFlashMs: 100,

  /** 코어 피격 시 화면 흔들림 (ms, 강도) */
  coreHitShake: {
    durationMs: 100,
    intensity: 0.005,
  },
} as const;

/**
 * 코어 HP — GDD §15 TBD, Phase 1 플레이 테스트로 확정
 * OPEN_ISSUES P0 항목
 * // TUNE_AFTER_PHASE1
 */
export const CORE_CONFIG = {
  initialHp: 500, // 초안 — 실측 검증 필요
  maxHp: 500,
} as const;
