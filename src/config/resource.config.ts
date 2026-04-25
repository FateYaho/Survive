/**
 * 자원 채집·확장 설정
 *
 * 관련 문서:
 * - GDD §5 (자원), §4.5 (확장 비용)
 * - IMPL_PLAN 단계 3
 */

import { ResourceType } from '../types';

export const RESOURCE_CONFIG = {
  /** 1회 채집 소요 시간 (ms) — GDD §5.2 */
  collectTimeMs: {
    [ResourceType.WOOD]: 1000,
    [ResourceType.STONE]: 1500,
    [ResourceType.IRON]: 2000, // Phase 2+
    [ResourceType.GOLD]: 3000, // Phase 3+
  } as Record<ResourceType, number>,

  /** 1회 채집당 획득량 (재설계 후 3→2 — DAY 수입 33% 컷) */
  collectAmount: {
    [ResourceType.WOOD]: 2,
    [ResourceType.STONE]: 2,
    [ResourceType.IRON]: 1,
    [ResourceType.GOLD]: 1,
  } as Record<ResourceType, number>,

  /** 타일당 초기 자원량 (재설계 12→8) */
  initialResourcePerTile: 8,

  /**
   * 자원 타일 생성 밀도 (전체 타일 중 비율)
   * Phase 1 기준 초안 — 실측 튜닝
   */
  spawnDensity: 0.15,

  /** 나무 : 돌 비율 (재설계: 나무 65% — 나무 더 많게) */
  woodStoneRatio: 0.65,

  /** 자원 타일 간 최소 간격 (뭉치지 않게) */
  minSpawnGapTiles: 2,

  /**
   * Phase 1 시작 인벤토리 (유지)
   */
  startingInventory: {
    [ResourceType.WOOD]: 30,
    [ResourceType.STONE]: 15,
  } as Partial<Record<ResourceType, number>>,
} as const;

/**
 * 확장 비용 — 누적 확장 횟수 기반 계단식 스케일링 (2026-04-25 재설계)
 * 초반은 싸고, 영토 넓어질수록 비싸짐.
 *
 * @param expansionsDone 플레이어가 이미 확장한 타일 개수 (초기 영토 제외)
 */
export function getExpansionCost(
  expansionsDone: number
): Partial<Record<ResourceType, number>> {
  if (expansionsDone < 8) return { [ResourceType.WOOD]: 3, [ResourceType.STONE]: 1 };
  if (expansionsDone < 16) return { [ResourceType.WOOD]: 8, [ResourceType.STONE]: 3 };
  if (expansionsDone < 24) return { [ResourceType.WOOD]: 15, [ResourceType.STONE]: 6 };
  return { [ResourceType.WOOD]: 25, [ResourceType.STONE]: 10 };
}
