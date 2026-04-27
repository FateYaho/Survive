/**
 * 페이즈 시간 설정
 *
 * 관련 문서:
 * - GDD §15.1 (시간 구조), §8 (페이즈 구조)
 * - IMPL_PLAN 단계 4
 */

export const PHASE_CONFIG = {
  /**
   * 낮 페이즈 길이 (ms) — 사이클별 차등 (GDD §15.1)
   * Phase 1 MVP는 5사이클이라 early만 실제 사용
   */
  dayDurationMs: {
    /** 1~3 사이클: 1분 (Patch B 옵션 G — 90s → 60s 컷) */
    early: 60_000,
    /** 4~9 사이클: 2.5분 */
    mid: 150_000,
    /** 10~15 사이클: 3분 */
    late: 180_000,
  },

  /** 밤 페이즈 길이 (ms) — 전 사이클 공통 1분 */
  nightDurationMs: 60_000,

  /** 빌드 페이즈 — 무제한 (플레이어 버튼 클릭 시 종료) */

  /** Phase 1 MVP 최대 사이클 (GDD §20) */
  maxCycles: 5,
} as const;

/** 사이클 번호에 따른 낮 길이 반환 */
export function getDayDurationMs(cycle: number): number {
  if (cycle <= 3) return PHASE_CONFIG.dayDurationMs.early;
  if (cycle <= 9) return PHASE_CONFIG.dayDurationMs.mid;
  return PHASE_CONFIG.dayDurationMs.late;
}
