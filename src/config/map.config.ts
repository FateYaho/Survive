/**
 * 맵 설정
 *
 * 관련 문서:
 * - GDD §4 (맵·영토)
 * - IMPL_PLAN 단계 1
 */

import type { MapConfig } from '../types';

export const MAP_CONFIG = {
  /** Phase 1 MVP 고정 30×30 — GDD §4.1 v1.1 */
  size: 30,
  /**
   * 타일 한 변 픽셀 크기
   * TBD: 16/32/48 중 실측 후 확정 (Phase 1 튜닝 대상)
   * 기본 32 시작 → 화면에 30×32 = 960px, 1280×720 캔버스 여유
   */
  tileSize: 32,
  /** 초기 공개 중앙 영역 크기 (2026-04-25 재설계: 5 → 4) */
  initialRevealSize: 4,
} as const satisfies MapConfig;

/** 맵 전체 픽셀 크기 (파생) */
export const MAP_PIXEL_SIZE = MAP_CONFIG.size * MAP_CONFIG.tileSize;

/** 맵 중앙 타일 좌표 (Phase 1: 코어 위치) */
export const MAP_CENTER = {
  tileX: Math.floor(MAP_CONFIG.size / 2),
  tileY: Math.floor(MAP_CONFIG.size / 2),
} as const;
