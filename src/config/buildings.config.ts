/**
 * 건물·터렛·생산 설정 (2026-04-25 Phase 1 재설계)
 *
 * 관련 문서:
 * - docs/ECONOMY_CONFIG_FINAL.md (최종 수치)
 * - docs/DIRECTION_BRIEF.md (방향성)
 * - GDD §6.4 / §6.7
 *
 * Phase 1 MVP 결정:
 * - 방어 철학: **하이브리드** (터렛 주력 킬 + 벽 동선 통제)
 * - 생산 건물 LUMBER_MILL / QUARRY 추가 (각 최대 1개)
 * - RESEARCH_LAB / SPIRIT_FOREST 는 Phase 1 MVP에서 제거 (Phase 2+에서 재도입)
 */

import { BuildingType, ResourceType } from '../types';

type Cost = Partial<Record<ResourceType, number>>;

interface BuildingSpec {
  cost: Cost;
  hp: number;
  sizeTiles: { width: number; height: number };
  /** 최대 건설 개수 (undefined = 무제한) */
  maxCount?: number;
}

interface TurretSpec extends BuildingSpec {
  attackPower: number;
  attackRange: number;
  attackCooldownMs: number;
  /** 수리 비용 (건설비의 약 50%) */
  repairCost: Cost;
}

interface ProductionSpec extends BuildingSpec {
  production: {
    resource: ResourceType;
    amount: number;
    intervalMs: number;
  };
}

export const BUILDING_CONFIG = {
  [BuildingType.WALL]: {
    cost: {
      [ResourceType.WOOD]: 15, // 10 → 15 (밸런스 D)
    },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
  } satisfies BuildingSpec,

  [BuildingType.BASIC_TURRET]: {
    cost: {
      [ResourceType.WOOD]: 30, // 20 → 30 (밸런스 D)
      [ResourceType.STONE]: 15, // 10 → 15 (밸런스 D)
    },
    repairCost: {
      [ResourceType.WOOD]: 15, // 10 → 15 (건설비의 50% 유지)
      [ResourceType.STONE]: 8,
    },
    hp: 80,
    attackPower: 8,
    attackRange: 160,
    attackCooldownMs: 800,
    sizeTiles: { width: 1, height: 1 },
  } satisfies TurretSpec,

  [BuildingType.LUMBER_MILL]: {
    cost: {
      [ResourceType.WOOD]: 40,
      [ResourceType.STONE]: 5,
    },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
    maxCount: 1,
    production: {
      resource: ResourceType.WOOD,
      amount: 2,
      intervalMs: 5000,
    },
  } satisfies ProductionSpec,

  [BuildingType.QUARRY]: {
    cost: {
      [ResourceType.WOOD]: 15,
      [ResourceType.STONE]: 20,
    },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
    maxCount: 1,
    production: {
      resource: ResourceType.STONE,
      amount: 2,
      intervalMs: 8000,
    },
  } satisfies ProductionSpec,
} as const;
