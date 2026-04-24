/**
 * 코어 (중앙 수호 대상) 타입
 *
 * 관련 문서:
 * - GDD §4.1 (맵 중앙 배치), §15 (HP TBD)
 * - IMPL_PLAN §2.7
 */

export interface CoreState {
  /** 맵 중앙 좌표 (Phase 1 MVP는 15, 15 고정) */
  tileX: number;
  tileY: number;
  /** 코어 HP — GDD §15 OPEN_ISSUES P0 TBD, Phase 1 플레이 테스트로 확정 */
  hp: number;
  maxHp: number;
}
