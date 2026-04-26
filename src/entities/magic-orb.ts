/**
 * MagicOrb — 사거리 내 모든 몬스터 동시 타격 터렛 (마법 구슬)
 *
 * 관련 문서:
 * - GDD §6.7 (방어 시설), §6.3 마법(금) 계열 — "원소 공격"
 * - docs/CHANGELOG.md 2026-04-27 [FEATURE] Phase 2 step 3
 *
 * 동작:
 * - 쿨다운 충족 시 사거리 내 살아있는 모든 몬스터에 동일 피해
 * - 사거리 내 몬스터가 0이면 쿨다운 갱신 X (낭비 방지)
 *
 * 시각:
 * - 발사 시 사거리 원 보라색 펄스 + 각 몬스터 위에 짧은 별 마커
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG } from '../config';
import { BuildingType } from '../types';
import { Building } from './building';
import type { Monster } from './monster';
import type { WaveSpawner } from '../systems/wave-spawner';

const PULSE_COLOR = 0xaa66ff;
const PULSE_MS = 220;

export class MagicOrb extends Building {
  private readonly waves: WaveSpawner;
  private readonly attackRange: number;
  private readonly attackRangeSq: number;
  private readonly attackPower: number;
  private readonly attackCooldownMs: number;
  private lastAttackTime: number = 0;
  private readonly fx: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    waves: WaveSpawner,
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number
  ) {
    super(scene, BuildingType.MAGIC_ORB, tileX, tileY, pixelX, pixelY);
    this.waves = waves;

    const spec = BUILDING_CONFIG[BuildingType.MAGIC_ORB];
    this.attackRange = spec.attackRange;
    this.attackRangeSq = spec.attackRange * spec.attackRange;
    this.attackPower = spec.attackPower;
    this.attackCooldownMs = spec.attackCooldownMs;

    this.fx = scene.add.graphics();
    this.fx.setDepth(20);
  }

  update(time: number, _delta: number): void {
    if (!this.isAlive()) return;
    if (time - this.lastAttackTime < this.attackCooldownMs) return;

    const p = this.getPosition();
    const targets: Monster[] = [];
    for (const m of this.waves.getMonsters()) {
      if (!m.isAlive()) continue;
      const mp = m.getPosition();
      const dsq = (mp.pixelX - p.pixelX) ** 2 + (mp.pixelY - p.pixelY) ** 2;
      if (dsq <= this.attackRangeSq) targets.push(m);
    }
    if (targets.length === 0) return;

    this.lastAttackTime = time;
    for (const m of targets) {
      m.takeDamage(this.attackPower);
      this.scene.events.emit('combat:damage', {
        target: m.getState().id,
        amount: this.attackPower,
        source: this.state.id,
      });
    }

    this.flashPulse();
  }

  private flashPulse(): void {
    const p = this.getPosition();
    this.fx.clear();
    this.fx.lineStyle(3, PULSE_COLOR, 0.8);
    this.fx.strokeCircle(p.pixelX, p.pixelY, this.attackRange);
    this.scene.time.delayedCall(PULSE_MS, () => this.fx.clear());
  }

  override destroy(): void {
    this.fx.destroy();
    super.destroy();
  }
}
