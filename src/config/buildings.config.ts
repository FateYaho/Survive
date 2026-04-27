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

import { BuildingType, ResourceType, type SlowEffect } from '../types';

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

/** 단일 타깃 명중 시 주변에 추가 광역 피해 + 슬로우 (돌 발리스타) */
interface AoeTurretSpec extends TurretSpec {
  aoeRadius: number;
  /** 광역에 휩쓸린 몬스터에게 적용. 1차 타깃에도 적용. */
  slow: SlowEffect;
}

/** 사거리 내 모든 몬스터 동시 타격 (마법 구슬) */
interface MultiHitTurretSpec extends TurretSpec {
  hitsAllInRange: true;
}

/** 회전 빔 — attackPower/attackCooldownMs 미사용. dps × delta로 지속 피해. */
interface BeamTurretSpec extends BuildingSpec {
  repairCost: Cost;
  beam: {
    /** 빔 길이 (px) */
    radius: number;
    /** 빔 두께 (px). 몬스터-빔 수직거리 ≤ thickness/2 일 때 적중 */
    thickness: number;
    /** 회전속도 (rad/s, 양수=시계방향) */
    rotationSpeedRadPerSec: number;
    /** 적중 몬스터에게 초당 피해 */
    dps: number;
    slow: SlowEffect;
  };
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
      intervalMs: 8000, // 5000 → 8000 (Patch B 옵션 E — 생산 효율 다운)
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
      intervalMs: 12000, // 8000 → 12000 (Patch B 옵션 E — 생산 효율 다운)
    },
  } satisfies ProductionSpec,

  [BuildingType.FORGE]: {
    cost: {
      [ResourceType.WOOD]: 30,
      [ResourceType.STONE]: 50,
    },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
    maxCount: 1,
    production: {
      resource: ResourceType.IRON,
      amount: 1,
      intervalMs: 10000,
    },
  } satisfies ProductionSpec,

  [BuildingType.FACTORY]: {
    cost: {
      [ResourceType.WOOD]: 50,
      [ResourceType.STONE]: 50,
      [ResourceType.IRON]: 10,
    },
    hp: 150,
    sizeTiles: { width: 1, height: 1 },
    maxCount: 1,
    production: {
      resource: ResourceType.GOLD,
      amount: 1,
      intervalMs: 15000,
    },
  } satisfies ProductionSpec,

  [BuildingType.STONE_BALLISTA]: {
    cost: {
      [ResourceType.STONE]: 40,
      [ResourceType.WOOD]: 20,
    },
    repairCost: {
      [ResourceType.STONE]: 20,
      [ResourceType.WOOD]: 10,
    },
    hp: 100,
    attackPower: 6,
    attackRange: 140,
    attackCooldownMs: 1500,
    aoeRadius: 60,
    slow: { factor: 0.5, durationMs: 2000 },
    sizeTiles: { width: 1, height: 1 },
  } satisfies AoeTurretSpec,

  [BuildingType.MACHINE_GUN_TURRET]: {
    cost: {
      [ResourceType.IRON]: 40,
      [ResourceType.STONE]: 20,
    },
    repairCost: {
      [ResourceType.IRON]: 20,
      [ResourceType.STONE]: 10,
    },
    hp: 80,
    attackPower: 5,
    attackRange: 160,
    // 기본 터렛 800ms의 1/3 (≈ 267ms) → DPS ≈ 18.7
    attackCooldownMs: 267,
    sizeTiles: { width: 1, height: 1 },
  } satisfies TurretSpec,

  [BuildingType.MAGIC_ORB]: {
    cost: {
      [ResourceType.GOLD]: 20,
      [ResourceType.WOOD]: 30,
    },
    repairCost: {
      [ResourceType.GOLD]: 10,
      [ResourceType.WOOD]: 15,
    },
    hp: 60,
    attackPower: 4,
    attackRange: 140,
    attackCooldownMs: 1500,
    hitsAllInRange: true,
    sizeTiles: { width: 1, height: 1 },
  } satisfies MultiHitTurretSpec,

  [BuildingType.ROTATING_SPIKE_TURRET]: {
    cost: {
      [ResourceType.STONE]: 30,
      [ResourceType.IRON]: 30,
    },
    repairCost: {
      [ResourceType.STONE]: 15,
      [ResourceType.IRON]: 15,
    },
    hp: 120,
    sizeTiles: { width: 1, height: 1 },
    beam: {
      radius: 80,
      thickness: 16,
      rotationSpeedRadPerSec: Math.PI / 2, // 4초당 1회전 (시계방향)
      dps: 10,
      slow: { factor: 0.5, durationMs: 1500 },
    },
  } satisfies BeamTurretSpec,
} as const;
