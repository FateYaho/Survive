/**
 * 몬스터 관련 타입
 *
 * 관련 문서:
 * - GDD §10 (몬스터 시스템)
 * - IMPL_PLAN §2.3
 */

/** 몬스터 종류 — Phase 1은 늑대만, 나머지는 Phase 2+ */
export enum MonsterType {
  WOLF = 'WOLF',
  BOAR = 'BOAR', // Phase 2+
  SHADOW = 'SHADOW', // Phase 2+ (박쥐 대체, GDD §10.1 v1.1)
  GHOST = 'GHOST', // Phase 2+
}

/** 이동 패턴 — v1.1에서 공중형 삭제 (§10.2) */
export enum MovePattern {
  /** 직진형: 코어 향해 최단 거리 */
  STRAIGHT = 'STRAIGHT',
  /** 추적형: 플레이어 추적 (Phase 2+) */
  CHASING = 'CHASING',
}

/** 공격 패턴 */
export enum AttackPattern {
  /** 근접 */
  MELEE = 'MELEE',
  /** 원거리 (Phase 2+) */
  RANGED = 'RANGED',
  /** 자폭 (Phase 2+) */
  EXPLOSIVE = 'EXPLOSIVE',
}

/**
 * 몬스터·터렛 타깃 참조 — GDD §10.4 3주체 타깃팅 규칙
 * kind 필드로 판별
 */
export type TargetRef =
  | { kind: 'player' }
  | { kind: 'core' }
  | { kind: 'building'; buildingId: string }
  | { kind: 'turret'; turretId: string };

export interface MonsterState {
  /** 고유 ID (스폰 시 생성) */
  id: string;
  type: MonsterType;

  pixelX: number;
  pixelY: number;

  hp: number;
  maxHp: number;

  movePattern: MovePattern;
  attackPattern: AttackPattern;

  /**
   * 영토 경계 진입 시 고정된 공격 대상
   * - 타깃 사망 또는 사거리 이탈 시에만 재탐색 (매 프레임 X)
   */
  currentTarget: TargetRef | null;

  moveSpeed: number; // 픽셀/초
  attackPower: number;
  attackCooldownMs: number;
  lastAttackTime: number;
}
