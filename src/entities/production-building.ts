/**
 * ProductionBuilding — 주기적 자원 생산 건물 (LumberMill / Quarry)
 *
 * 관련 문서:
 * - docs/ECONOMY_CONFIG_FINAL.md (생산량·주기)
 * - GDD §6.4
 *
 * 동작:
 * - DAY 페이즈 중에만 active (NIGHT·BUILD는 정지)
 * - `production.intervalMs` 간격으로 player.addResource 호출
 * - 최대 개수 제한은 BuildingSystem에서 enforce
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG } from '../config';
import { BuildingType, PhaseType, ResourceType } from '../types';
import { Building } from './building';
import type { Player } from './player';

const PULSE_SCALE = 1.12;
const PULSE_MS = 120;

type ProdType = BuildingType.LUMBER_MILL | BuildingType.QUARRY;

export class ProductionBuilding extends Building {
  private readonly player: Player;
  private readonly intervalMs: number;
  private readonly amount: number;
  private readonly resource: ResourceType;
  private accumulatedMs: number = 0;
  private active: boolean = true;

  constructor(
    scene: Phaser.Scene,
    type: ProdType,
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number,
    player: Player,
    initialPhase: PhaseType
  ) {
    super(scene, type, tileX, tileY, pixelX, pixelY);
    this.player = player;

    const spec = BUILDING_CONFIG[type];
    this.intervalMs = spec.production.intervalMs;
    this.amount = spec.production.amount;
    this.resource = spec.production.resource;
    this.active = initialPhase === PhaseType.DAY;

    scene.events.on('phase:dayStart', () => {
      this.active = true;
      this.accumulatedMs = 0;
    });
    scene.events.on('phase:buildStart', () => {
      this.active = false;
    });
    scene.events.on('phase:nightStart', () => {
      this.active = false;
    });
  }

  update(_time: number, delta: number): void {
    if (!this.isAlive() || !this.active) return;
    this.accumulatedMs += delta;
    while (this.accumulatedMs >= this.intervalMs) {
      this.accumulatedMs -= this.intervalMs;
      this.player.addResource(this.resource, this.amount);
      this.pulse();
    }
  }

  /** 시각 피드백: 스프라이트 잠깐 확대 */
  private pulse(): void {
    const sprite = this.getSprite();
    this.scene.tweens.add({
      targets: sprite,
      scale: PULSE_SCALE,
      duration: PULSE_MS,
      yoyo: true,
      ease: 'Sine.Out',
    });
  }
}
