/**
 * 플레이어 상태 타입
 *
 * 관련 문서:
 * - GDD §3 (플레이어 캐릭터)
 * - IMPL_PLAN §2.2
 */

import { ResourceType } from './tile';

/** 플레이어 인벤토리 — 자원별 보유량 */
export type Inventory = Record<ResourceType, number>;

export interface PlayerState {
  /** 현재 픽셀 좌표 (자유 이동) */
  pixelX: number;
  pixelY: number;

  hp: number;
  maxHp: number;

  inventory: Inventory;

  /** 다운 상태 — GDD §3.3, HP 0 시 true, 30초 후 자동 부활 */
  isDown: boolean;
  /** 다운 상태 남은 시간 (초) */
  downTimer: number;

  /** 스프라이트 방향 (단계 4 이후 애니메이션용) */
  facing: 'up' | 'down' | 'left' | 'right';
}

/** 빈 인벤토리 생성 헬퍼 — 모든 자원 0으로 초기화 */
export function createEmptyInventory(): Inventory {
  return {
    [ResourceType.WOOD]: 0,
    [ResourceType.STONE]: 0,
    [ResourceType.IRON]: 0,
    [ResourceType.GOLD]: 0,
  };
}
