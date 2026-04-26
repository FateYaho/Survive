/**
 * AoeTurret — 단일 타깃 명중 시 주변 광역 피해 + 슬로우 (돌 발리스타)
 *
 * 관련 문서:
 * - GDD §6.7 (방어 시설), §6.3 돌 계열 — "광역 공격"
 * - docs/CHANGELOG.md 2026-04-27 [FEATURE] Phase 2 step 3
 *
 * 동작:
 * - 기본 터렛처럼 가장 가까운 몬스터 락킹 + 쿨다운 충족 시 사격
 * - 명중한 위치 기준 `aoeRadius` 내 모든 몬스터에게 동일 피해 + 슬로우
 * - 1차 타깃에도 슬로우 적용
 *
 * 시각:
 * - 타깃까지 회색 라인 + AoE 반경 원형 플래시
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG } from '../config';
import { BuildingType } from '../types';
import { Building } from './building';
import type { Monster } from './monster';
import type { WaveSpawner } from '../systems/wave-spawner';

const SHOT_LINE_COLOR = 0xaaaaaa;
const AOE_FLASH_COLOR = 0xddddaa;
const SHOT_LINE_MS = 100;
const AOE_FLASH_MS = 200;

export class AoeTurret extends Building {
  private readonly waves: WaveSpawner;
  private readonly attackRangeSq: number;
  private readonly attackPower: number;
  private readonly attackCooldownMs: number;
  private readonly aoeRadius: number;
  private readonly aoeRadiusSq: number;
  private readonly slowFactor: number;
  private readonly slowDurationMs: number;
  private lastAttackTime: number = 0;
  private target: Monster | null = null;
  private readonly fx: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    waves: WaveSpawner,
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number
  ) {
    super(scene, BuildingType.STONE_BALLISTA, tileX, tileY, pixelX, pixelY);
    this.waves = waves;

    const spec = BUILDING_CONFIG[BuildingType.STONE_BALLISTA];
    this.attackRangeSq = spec.attackRange * spec.attackRange;
    this.attackPower = spec.attackPower;
    this.attackCooldownMs = spec.attackCooldownMs;
    this.aoeRadius = spec.aoeRadius;
    this.aoeRadiusSq = spec.aoeRadius * spec.aoeRadius;
    this.slowFactor = spec.slow.factor;
    this.slowDurationMs = spec.slow.durationMs;

    this.fx = scene.add.graphics();
    this.fx.setDepth(20);
  }

  update(time: number, _delta: number): void {
    if (!this.isAlive()) return;

    if (this.target && (!this.target.isAlive() || this.distSqTo(this.target) > this.attackRangeSq)) {
      this.target = null;
    }
    if (!this.target) this.target = this.findNearest();
    if (!this.target) return;

    if (time - this.lastAttackTime < this.attackCooldownMs) return;
    this.lastAttackTime = time;

    const tp = this.target.getPosition();
    this.target.takeDamage(this.attackPower);
    this.scene.events.emit('combat:damage', {
      target: this.target.getState().id,
      amount: this.attackPower,
      source: this.state.id,
    });

    // 광역 피해 + 슬로우 (1차 타깃 포함)
    for (const m of this.waves.getMonsters()) {
      if (!m.isAlive()) continue;
      const mp = m.getPosition();
      const dsq = (mp.pixelX - tp.pixelX) ** 2 + (mp.pixelY - tp.pixelY) ** 2;
      if (dsq > this.aoeRadiusSq) continue;
      if (m !== this.target) {
        m.takeDamage(this.attackPower);
      }
      m.applySlow({ factor: this.slowFactor, durationMs: this.slowDurationMs }, time);
    }

    this.flashShot(tp);
  }

  private distSqTo(m: Monster): number {
    const p = this.getPosition();
    const mp = m.getPosition();
    return (mp.pixelX - p.pixelX) ** 2 + (mp.pixelY - p.pixelY) ** 2;
  }

  private findNearest(): Monster | null {
    let best: Monster | null = null;
    let bestDsq = this.attackRangeSq + 1;
    for (const m of this.waves.getMonsters()) {
      if (!m.isAlive()) continue;
      const d = this.distSqTo(m);
      if (d <= this.attackRangeSq && d < bestDsq) {
        best = m;
        bestDsq = d;
      }
    }
    return best;
  }

  private flashShot(impact: { pixelX: number; pixelY: number }): void {
    const p = this.getPosition();
    this.fx.clear();
    this.fx.lineStyle(2, SHOT_LINE_COLOR, 1);
    this.fx.lineBetween(p.pixelX, p.pixelY, impact.pixelX, impact.pixelY);
    this.fx.lineStyle(2, AOE_FLASH_COLOR, 0.9);
    this.fx.strokeCircle(impact.pixelX, impact.pixelY, this.aoeRadius);
    this.scene.time.delayedCall(SHOT_LINE_MS, () => {
      // 라인은 지우되 원은 잠시 더 유지
      this.fx.clear();
      this.fx.lineStyle(2, AOE_FLASH_COLOR, 0.7);
      this.fx.strokeCircle(impact.pixelX, impact.pixelY, this.aoeRadius);
    });
    this.scene.time.delayedCall(AOE_FLASH_MS, () => this.fx.clear());
  }

  override destroy(): void {
    this.fx.destroy();
    super.destroy();
  }
}
