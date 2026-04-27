/**
 * 타일·맵·자원 관련 타입
 *
 * 관련 문서:
 * - GDD §4 (맵·영토), §5 (자원)
 * - IMPL_PLAN §2.1
 */

import type { BuildingType } from './building';

/** 타일 상태 — GDD §4.2 */
export enum TileState {
  /** 미탐색 (안개) */
  FOG = 'FOG',
  /** 탐색됨, 영토 아님 */
  EXPLORED = 'EXPLORED',
  /** 내 영토 (채집·건설 가능) */
  OWNED = 'OWNED',
}

/**
 * 기초 자원 4종 — GDD §5.1 v1.1
 * 수정(Crystal)은 기초 자원에서 제외, 토템 전용 재료 (§7)
 */
export enum ResourceType {
  WOOD = 'WOOD',
  STONE = 'STONE',
  IRON = 'IRON', // Phase 2+
  GOLD = 'GOLD', // Phase 3+
}

export interface Tile {
  tileX: number;
  tileY: number;
  state: TileState;
  /** 자원 타일이면 자원 종류, 아니면 null */
  resource: ResourceType | null;
  /** 남은 채집 가능량 (0이면 resource null 처리) */
  resourceAmount: number;
  /** 건설된 구조물 타입, 없으면 null */
  building: BuildingType | null;
}

/** 맵 설정 — IMPL_PLAN §2.1, Phase 1 MVP는 30x30 고정 */
export interface MapConfig {
  /** 맵 가로/세로 타일 수 (정사각형) */
  size: number;
  /** 타일 한 변 픽셀 크기 */
  tileSize: number;
  /** 초기 공개 영역 (중앙 N×N OWNED) */
  initialRevealSize: number;
}
