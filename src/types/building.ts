/**
 * 건물·터렛 관련 타입
 *
 * 관련 문서:
 * - GDD §6.4 (건물), §6.7 (방어 시설)
 * - IMPL_PLAN §2.6
 */

/** 건물 타입 — Phase 1 MVP + Phase 2 step 2 (생산) + step 3 (특수 터렛) */
export enum BuildingType {
  /** 벽 — 방어 장애물 */
  WALL = 'WALL',
  /** 기본 터렛 — 자동 공격 */
  BASIC_TURRET = 'BASIC_TURRET',
  /** 제재소 — 주기적 나무 생산 (최대 1개) */
  LUMBER_MILL = 'LUMBER_MILL',
  /** 채석장 — 주기적 돌 생산 (최대 1개) */
  QUARRY = 'QUARRY',
  /** 대장간 — 주기적 철 생산 (최대 1개) */
  FORGE = 'FORGE',
  /** 공장 — 주기적 금 생산 (최대 1개) */
  FACTORY = 'FACTORY',
  /** 돌 발리스타 — 단일 타깃 명중 시 주변 광역 피해 + 슬로우 */
  STONE_BALLISTA = 'STONE_BALLISTA',
  /** 기관총 터렛 — 연사속도 3배 단일 고DPS */
  MACHINE_GUN_TURRET = 'MACHINE_GUN_TURRET',
  /** 마법 구슬 — 사거리 내 모든 몬스터 동시 타격 */
  MAGIC_ORB = 'MAGIC_ORB',
  /** 회전 가시 포탑 — 빔 회전, 닿는 몬스터에 지속 피해 + 슬로우 */
  ROTATING_SPIKE_TURRET = 'ROTATING_SPIKE_TURRET',
}

/** 슬로우 효과 명세 — Monster.applySlow 인자 */
export interface SlowEffect {
  /** 이동속도 배율 (0.5 = 50% 감속) */
  factor: number;
  /** 지속시간 (ms) */
  durationMs: number;
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
