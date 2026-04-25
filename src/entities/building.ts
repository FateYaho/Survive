/**
 * Building — 건물·벽·터렛의 공통 베이스
 *
 * 관련 문서:
 * - GDD §6.4 (건물), §6.7 (방어 시설)
 * - IMPL_PLAN §2.6, 단계 7
 *
 * Phase 1 MVP:
 * - 1타일 사각형 스프라이트, 건물 종류별 색상 구분
 * - takeDamage / destroy + `building:destroyed` 이벤트
 * - 몬스터가 벽/건물 공격은 Phase 2+ (단계 7은 벽 장애물로만)
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG, MAP_CONFIG, COMBAT_CONFIG } from '../config';
import { BuildingType, type BuildingState } from '../types';

export const BUILDING_COLORS: Record<BuildingType, number> = {
  [BuildingType.WALL]: 0x888888,
  [BuildingType.BASIC_TURRET]: 0xff8800,
  [BuildingType.LUMBER_MILL]: 0x8b5a2b, // 갈색 (나무)
  [BuildingType.QUARRY]: 0xbbbbbb, // 밝은 회색 (돌)
};

let nextBuildingId = 1;

const HP_BAR_W = 24;
const HP_BAR_H = 3;
const HP_BAR_OFFSET_Y = 16; // 건물 중심 위쪽

export class Building {
  protected readonly scene: Phaser.Scene;
  protected readonly state: BuildingState;
  protected readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    type: BuildingType,
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number
  ) {
    this.scene = scene;
    const spec = BUILDING_CONFIG[type];

    this.state = {
      id: `b${nextBuildingId++}`,
      type,
      tileX,
      tileY,
      hp: spec.hp,
      maxHp: spec.hp,
    };

    const size = Math.floor(MAP_CONFIG.tileSize * 0.85);
    this.sprite = scene.add.rectangle(
      pixelX,
      pixelY,
      size,
      size,
      BUILDING_COLORS[type]
    );
    this.sprite.setStrokeStyle(1, 0x000000, 0.5);
    this.sprite.setDepth(6); // 자원 마커(1)·코어(5) 위, 플레이어(10) 아래

    // HP 바 (항상 표시, Phase 1은 공격 안 받아서 full이지만 시각 확인용)
    this.hpBarBg = scene.add
      .rectangle(pixelX, pixelY - HP_BAR_OFFSET_Y, HP_BAR_W, HP_BAR_H, 0x000000, 0.6)
      .setDepth(7);
    this.hpBarFill = scene.add
      .rectangle(pixelX, pixelY - HP_BAR_OFFSET_Y, HP_BAR_W, HP_BAR_H, 0x44ff66, 1)
      .setDepth(8);
  }

  getState(): Readonly<BuildingState> {
    return this.state;
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite;
  }

  getTilePosition(): { tileX: number; tileY: number } {
    return { tileX: this.state.tileX, tileY: this.state.tileY };
  }

  getPosition(): { pixelX: number; pixelY: number } {
    return { pixelX: this.sprite.x, pixelY: this.sprite.y };
  }

  isAlive(): boolean {
    return !this.destroyed && this.state.hp > 0;
  }

  takeDamage(amount: number): void {
    if (this.destroyed) return;
    this.state.hp -= amount;
    this.refreshHpBar();

    this.sprite.setFillStyle(0xffffff);
    this.scene.time.delayedCall(COMBAT_CONFIG.damageFlashMs, () => {
      if (!this.destroyed) this.sprite.setFillStyle(BUILDING_COLORS[this.state.type]);
    });

    if (this.state.hp <= 0) this.destroy();
  }

  private refreshHpBar(): void {
    const ratio = Math.max(0, this.state.hp / this.state.maxHp);
    this.hpBarFill.setDisplaySize(HP_BAR_W * ratio, HP_BAR_H);
    // 왼쪽 정렬 유지 (origin 0.5라 중심 기준 움직임)
    this.hpBarFill.setX(
      this.sprite.x - HP_BAR_W / 2 + (HP_BAR_W * ratio) / 2
    );
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const { id, type } = this.state;
    this.sprite.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.scene.events.emit('building:destroyed', { buildingId: id, type });
  }
}
