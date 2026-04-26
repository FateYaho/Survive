/**
 * 몬스터 설정
 *
 * 관련 문서:
 * - GDD §10 (몬스터), §15.3 (스탯)
 * - IMPL_PLAN 단계 5
 *
 * ⚠️ 모든 수치 초안. Phase 1 플레이 테스트로 DPS 비율 검증 (§15.3, §15.6)
 * // TUNE_AFTER_PHASE1
 */

import { MonsterType, MovePattern, AttackPattern, ResourceType } from '../types';

export const MONSTER_CONFIG = {
  [MonsterType.WOLF]: {
    type: MonsterType.WOLF,
    hp: 20,
    attackPower: 5,
    /** 이동 속도 (픽셀/초) = 2타일/초 × 32 */
    moveSpeed: 64,
    /** 공격 사거리 (픽셀) — 근접 */
    attackRange: 24,
    attackCooldownMs: 1000,
    collisionRadius: 6,
    movePattern: MovePattern.STRAIGHT,
    attackPattern: AttackPattern.MELEE,
    /**
     * 처치 시 드롭 — Phase 1 기준 초안 // TUNE_AFTER_PHASE1
     * Phase 2+ 몬스터는 IRON/GOLD 키 추가 가능 (Partial<Record<ResourceType, number>>)
     */
    drop: {
      [ResourceType.WOOD]: 2,
      [ResourceType.STONE]: 1,
    } as Partial<Record<ResourceType, number>>,
  },
  // BOAR / SHADOW / GHOST는 Phase 2+에서 추가

  /** 스폰 설정 */
  spawn: {
    /**
     * 사이클별 스폰 수 (초안)
     * byCycle[0] = cycle 1, byCycle[4] = cycle 5
     */
    byCycle: [10, 15, 20, 25, 30] as const,

    /** 몬스터 사이 스폰 간격 (ms) — 버스트 방지 */
    spawnBurstIntervalMs: 500,

    /** Object Pool 최대 크기 (IMPL_PLAN §1.7) */
    poolMaxSize: 50,
  },
} as const;
