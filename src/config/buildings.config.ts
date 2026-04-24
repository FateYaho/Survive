/**
 * 건물·터렛 설정
 *
 * 관련 문서:
 * - GDD §6.4 (건물), §6.7 (방어 시설)
 * - IMPL_PLAN 단계 7
 *
 * ⚠️ 모든 수치 초안. Phase 1~3 실측 튜닝 대상 // TUNE_AFTER_PHASE1
 */

import { BuildingType, ResourceType } from '../types';

/** 자원 비용 매핑 타입 */
type Cost = Partial<Record<ResourceType, number>>;

interface BuildingSpec {
  cost: Cost;
  hp: number;
  sizeTiles: { width: number; height: number };
}

interface TurretSpec extends BuildingSpec {
  attackPower: number;
  attackRange: number;
  attackCooldownMs: number;
}

export const BUILDING_CONFIG = {
  [BuildingType.RESEARCH_LAB]: {
    cost: {
      [ResourceType.WOOD]: 50,
      [ResourceType.STONE]: 30,
    },
    hp: 200,
    sizeTiles: { width: 1, height: 1 },
  } satisfies BuildingSpec,

  [BuildingType.SPIRIT_FOREST]: {
    cost: {
      [ResourceType.WOOD]: 100,
      [ResourceType.STONE]: 50,
    },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
    /**
     * 시설 효과: 주변 나무 채집 +20%
     * Phase 1에선 flag만, 실제 효과 적용은 Phase 2 가공 자원 도입 시
     */
    effect: 'wood_collect_bonus_20' as const,
  },

  [BuildingType.WALL]: {
    cost: {
      [ResourceType.WOOD]: 10,
    },
    hp: 100,
    sizeTiles: { width: 1, height: 1 },
  } satisfies BuildingSpec,

  [BuildingType.BASIC_TURRET]: {
    cost: {
      [ResourceType.WOOD]: 20,
      [ResourceType.STONE]: 10,
    },
    hp: 80,
    attackPower: 8,
    /** 공격 사거리 (픽셀) — 5타일 */
    attackRange: 160,
    attackCooldownMs: 800,
    sizeTiles: { width: 1, height: 1 },
  } satisfies TurretSpec,
} as const;
