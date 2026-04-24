/**
 * 자원 채집·확장 설정
 *
 * 관련 문서:
 * - GDD §5 (자원), §4.5 (확장 비용)
 * - IMPL_PLAN 단계 3
 */

import { ResourceType } from '../types';

export const RESOURCE_CONFIG = {
  /** 1회 채집 소요 시간 (ms) — GDD §5.2 초안 */
  collectTimeMs: {
    [ResourceType.WOOD]: 1000,
    [ResourceType.STONE]: 1500,
    [ResourceType.IRON]: 2000, // Phase 2+
    [ResourceType.GOLD]: 3000, // Phase 3+
  } as Record<ResourceType, number>,

  /** 1회 채집당 획득량 */
  collectAmount: {
    [ResourceType.WOOD]: 2,
    [ResourceType.STONE]: 2,
    [ResourceType.IRON]: 1,
    [ResourceType.GOLD]: 1,
  } as Record<ResourceType, number>,

  /** 타일당 초기 자원량 (고갈 시 resource null 전환) */
  initialResourcePerTile: 10,

  /**
   * 자원 타일 생성 밀도 (전체 타일 중 비율)
   * Phase 1 기준 초안 — 실측 튜닝
   */
  spawnDensity: 0.15,

  /** 나무 : 돌 비율 (Phase 1은 1:1) */
  woodStoneRatio: 0.5,

  /** 자원 타일 간 최소 간격 (뭉치지 않게) */
  minSpawnGapTiles: 2,

  /**
   * Phase 1 인접 확장 비용 — GDD §4.5
   * Phase 2부터 거리 기반 비용표 적용
   */
  expansionCost: {
    [ResourceType.WOOD]: 10,
    [ResourceType.STONE]: 5,
  } as Partial<Record<ResourceType, number>>,

  /**
   * Phase 1 시작 인벤토리 — 중앙 5×5에 자원이 없는 bootstrap 대응 (~2칸 확장 가능)
   * Phase 2+ 재검토 필요 // TUNE_AFTER_PHASE1
   */
  startingInventory: {
    [ResourceType.WOOD]: 20,
    [ResourceType.STONE]: 10,
  } as Partial<Record<ResourceType, number>>,
} as const;
