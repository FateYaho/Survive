/**
 * 페이즈·사이클 타입
 *
 * 관련 문서:
 * - GDD §8 (페이즈 구조)
 * - IMPL_PLAN §2.4
 */

export enum PhaseType {
  /** 낮 — 자원 파밍, 영토 확장 */
  DAY = 'DAY',
  /** 밤 — 몬스터 웨이브 방어 */
  NIGHT = 'NIGHT',
  /** 빌드 페이즈 — 시간 제한 없음, 사고·계획 */
  BUILD = 'BUILD',
}

export interface PhaseState {
  type: PhaseType;
  /**
   * 남은 시간 (초)
   * - DAY/NIGHT: 양수 값 감소
   * - BUILD: -1 (무제한)
   */
  timeLeftSeconds: number;
  /** 현재 사이클 번호 (1부터 시작, Phase 1 MVP는 최대 5) */
  cycle: number;
}
