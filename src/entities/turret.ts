/**
 * Turret — 자동 사격 방어 터렛 (단일 타깃 hitScan)
 *
 * 관련 문서:
 * - GDD §6.7 (방어 시설), §10.4 (타깃팅: 방어 터렛 → 몬스터)
 * - IMPL_PLAN §7.3
 *
 * 동작:
 * - 사거리 내 가장 가까운 몬스터를 **고정 타깃**으로 잠금
 * - 타깃 사거리 이탈 or 사망 시 재탐색
 * - 쿨다운 충족 시 hitScan 공격 + 라인 플래시
 *
 * 사용 타입:
 * - `BuildingType.BASIC_TURRET` (기본)
 * - `BuildingType.MACHINE_GUN_TURRET` (Phase 2 step 3 — 동일 로직, 짧은 쿨다운 + 다른 색)
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG } from '../config';
import { BuildingType, type TurretState } from '../types';
import { Building } from './building';
import type { Monster } from './monster';
import type { WaveSpawner } from '../systems/wave-spawner';

const SHOT_LINE_MS = 80;

const SHOT_LINE_COLOR: Record<
  BuildingType.BASIC_TURRET | BuildingType.MACHINE_GUN_TURRET,
  number
> = {
  [BuildingType.BASIC_TURRET]: 0xffaa33,
  [BuildingType.MACHINE_GUN_TURRET]: 0x66ccff,
};

type TurretLike = BuildingType.BASIC_TURRET | BuildingType.MACHINE_GUN_TURRET;

export class Turret extends Building {
  private readonly waves: WaveSpawner;
  private readonly turretType: TurretLike;
  private readonly turretState: Omit<TurretState, keyof import('../types').BuildingState>;
  private target: Monster | null = null;
  private readonly shotLine: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    waves: WaveSpawner,
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number,
    turretType: TurretLike = BuildingType.BASIC_TURRET
  ) {
    super(scene, turretType, tileX, tileY, pixelX, pixelY);
    this.waves = waves;
    this.turretType = turretType;

    const spec = BUILDING_CONFIG[turretType];
    this.turretState = {
      currentTarget: null,
      attackRange: spec.attackRange,
      attackPower: spec.attackPower,
      attackCooldownMs: spec.attackCooldownMs,
      lastAttackTime: 0,
    };

    this.shotLine = scene.add.graphics();
    this.shotLine.setDepth(20);
  }

  update(time: number, _delta: number): void {
    if (!this.isAlive()) return;

    // 타깃 유효성 확인
    if (this.target) {
      if (!this.target.isAlive() || this.distSqTo(this.target) > this.rangeSq()) {
        this.target = null;
      }
    }
    if (!this.target) {
      this.target = this.findNearest();
    }
    if (!this.target) return;

    if (time - this.turretState.lastAttackTime < this.turretState.attackCooldownMs) {
      return;
    }
    this.turretState.lastAttackTime = time;

    this.target.takeDamage(this.turretState.attackPower);
    this.flashShot(this.target);

    this.scene.events.emit('combat:damage', {
      target: this.target.getState().id,
      amount: this.turretState.attackPower,
      source: this.state.id,
    });
  }

  private rangeSq(): number {
    return this.turretState.attackRange * this.turretState.attackRange;
  }

  private distSqTo(m: Monster): number {
    const p = this.getPosition();
    const mp = m.getPosition();
    return (mp.pixelX - p.pixelX) ** 2 + (mp.pixelY - p.pixelY) ** 2;
  }

  private findNearest(): Monster | null {
    const rsq = this.rangeSq();
    let best: Monster | null = null;
    let bestDsq = rsq + 1;
    for (const m of this.waves.getMonsters()) {
      if (!m.isAlive()) continue;
      const d = this.distSqTo(m);
      if (d <= rsq && d < bestDsq) {
        best = m;
        bestDsq = d;
      }
    }
    return best;
  }

  private flashShot(m: Monster): void {
    const p = this.getPosition();
    const mp = m.getPosition();
    this.shotLine.clear();
    this.shotLine.lineStyle(2, SHOT_LINE_COLOR[this.turretType], 1);
    this.shotLine.lineBetween(p.pixelX, p.pixelY, mp.pixelX, mp.pixelY);
    this.scene.time.delayedCall(SHOT_LINE_MS, () => this.shotLine.clear());
  }

  override destroy(): void {
    this.shotLine.destroy();
    super.destroy();
  }
}
