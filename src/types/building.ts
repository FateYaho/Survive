/**
 * 건물·터렛 관련 타입
 *
 * 관련 문서:
 * - GDD §6.4 (건물), §6.7 (방어 시설)
 * - IMPL_PLAN §2.6
 */

/** 건물 타입 — Phase 1 MVP 범위 (2026-04-25 재설계) */
export enum BuildingType {
  /** 벽 — 방어 장애물 */
  WALL = 'WALL',
  /** 기본 터렛 — 자동 공격 */
  BASIC_TURRET = 'BASIC_TURRET',
  /** 제재소 — 주기적 나무 생산 (최대 1개) */
  LUMBER_MILL = 'LUMBER_MILL',
  /** 채석장 — 주기적 돌 생산 (최대 1개) */
  QUARRY = 'QUARRY',
}

/** 모든 건물 공통 상태 */
export interface BuildingState {
  id: string;
  type: BuildingType;
  tileX: number;
  tileY: number;
  hp: number;
  maxHp: number;
}

/**
 * 터렛 전용 상태 (BuildingState 확장)
 * GDD §10.4 "방어 터렛 → 몬스터" 타깃팅 규칙 준수
 */
export interface TurretState extends BuildingState {
  /** 공격 사거리 (픽셀) */
  attackRange: number;
  attackPower: number;
  /** 공격 쿨다운 (ms) */
  attackCooldownMs: number;
  /** 마지막 공격 시각 (ms) */
  lastAttackTime: number;
}
