/**
 * 건물·터렛 관련 타입
 *
 * 관련 문서:
 * - GDD §6.4 (건물), §6.7 (방어 시설)
 * - IMPL_PLAN §2.6
 */

import type { TargetRef } from './monster';

/** 건물 타입 — Phase 1 MVP 범위 */
export enum BuildingType {
  /** 연구실 — T1 테크 해금 */
  RESEARCH_LAB = 'RESEARCH_LAB',
  /** 정령의 숲 — 나무 T2 해금, 시설 효과 */
  SPIRIT_FOREST = 'SPIRIT_FOREST',
  /** 벽 — 방어 장애물 */
  WALL = 'WALL',
  /** 기본 터렛 — 자동 공격 */
  BASIC_TURRET = 'BASIC_TURRET',
}

/** 모든 건물 공통 상태 */
export interface BuildingState {
  id: string;
  type: BuildingType;
  tileX: number;
  tileY: number;
  hp: number;
  maxHp: number;
}

/**
 * 터렛 전용 상태 (BuildingState 확장)
 * GDD §10.4 "방어 터렛 → 몬스터" 타깃팅 규칙 준수
 */
export interface TurretState extends BuildingState {
  /** 현재 고정된 타깃 (null이면 대기) */
  currentTarget: TargetRef | null;
  /** 공격 사거리 (픽셀) */
  attackRange: number;
  attackPower: number;
  /** 공격 쿨다운 (ms) */
  attackCooldownMs: number;
  /** 마지막 공격 시각 (ms) */
  lastAttackTime: number;
}
