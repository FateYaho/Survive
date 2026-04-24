/**
 * Core — 맵 중앙 수호 대상
 *
 * 관련 문서:
 * - GDD §4.1 (맵 중앙 배치), §12 (승/패)
 * - IMPL_PLAN §2.7, 단계 5·6 (전투 연동)
 *
 * Phase 1 MVP:
 * - 단계 4: 시각적 마커만
 * - 단계 6 (현재): takeDamage + 피격 시 화면 흔들림 + core:destroyed 이벤트
 */

import Phaser from 'phaser';
import { COMBAT_CONFIG, CORE_CONFIG, MAP_CENTER, MAP_CONFIG } from '../config';
import type { CoreState } from '../types';
import type { TileMap } from '../systems/tile-map';

const CORE_COLOR = 0x44aaff;
const CORE_STROKE = 0xffffff;

export class Core {
  private readonly scene: Phaser.Scene;
  private readonly state: CoreState;
  private readonly sprite: Phaser.GameObjects.Rectangle;
  private destroyed = false;

  constructor(scene: Phaser.Scene, tileMap: TileMap) {
    this.scene = scene;
    this.state = {
      tileX: MAP_CENTER.tileX,
      tileY: MAP_CENTER.tileY,
      hp: CORE_CONFIG.initialHp,
      maxHp: CORE_CONFIG.maxHp,
    };

    const { x, y } = tileMap.tileToPixel(MAP_CENTER.tileX, MAP_CENTER.tileY);
    const size = Math.floor(MAP_CONFIG.tileSize * 0.75);
    this.sprite = scene.add.rectangle(x, y, size, size, CORE_COLOR);
    this.sprite.setStrokeStyle(2, CORE_STROKE);
    this.sprite.setDepth(5);
  }

  getState(): Readonly<CoreState> {
    return this.state;
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
    this.state.hp = Math.max(0, this.state.hp - amount);

    // 화면 흔들림
    this.scene.cameras.main.shake(
      COMBAT_CONFIG.coreHitShake.durationMs,
      COMBAT_CONFIG.coreHitShake.intensity
    );

    // 빨간 플래시 틴트
    this.sprite.setFillStyle(0xff4444);
    this.scene.time.delayedCall(COMBAT_CONFIG.damageFlashMs, () => {
      if (!this.destroyed) this.sprite.setFillStyle(CORE_COLOR);
    });

    this.scene.events.emit('core:damaged', {
      amount,
      remainingHp: this.state.hp,
    });

    if (this.state.hp <= 0) {
      this.destroyed = true;
      this.sprite.setFillStyle(0x333333);
      this.scene.events.emit('core:destroyed', {});
    }
  }
}
