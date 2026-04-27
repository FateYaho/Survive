/**
 * RotatingSpikeTurret — 시계방향 회전 빔 터렛 (회전 가시 포탑)
 *
 * 관련 문서:
 * - GDD §6.7 (방어 시설), §6.3 돌·철 융합 — "회전 가시"
 * - docs/CHANGELOG.md 2026-04-27 [FEATURE] Phase 2 step 3
 *
 * 동작:
 * - 매 프레임 빔 각도를 `rotationSpeedRadPerSec * delta` 만큼 회전
 * - 빔에 닿는(line-segment 두께 thickness 내) 몬스터에:
 *   - `dps × delta/1000` 지속 피해
 *   - 매 프레임 슬로우 갱신 (만료시각 항상 새로 갱신)
 * - 빔 시각: 터렛 중심 → (cx + radius·cos θ, cy + radius·sin θ) 직선
 *
 * 적중 판정 (line-thickness):
 * - 빔 방향 단위벡터 = (cosθ, sinθ)
 * - 몬스터 좌표를 빔 방향에 사영 → projLength
 * - 0 < projLength ≤ radius 이고, 수직거리 ≤ thickness/2 이면 적중
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG } from '../config';
import { BuildingType } from '../types';
import { Building } from './building';
import type { WaveSpawner } from '../systems/wave-spawner';

const BEAM_COLOR = 0xff6644;
const BEAM_GLOW_COLOR = 0xffcc88;

export class RotatingSpikeTurret extends Building {
  private readonly waves: WaveSpawner;
  private readonly radius: number;
  private readonly radiusSq: number;
  private readonly thicknessHalf: number;
  private readonly rotationSpeedRadPerSec: number;
  private readonly dps: number;
  private readonly slowFactor: number;
  private readonly slowDurationMs: number;
  private beamAngle: number = 0;
  private readonly beamGfx: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    waves: WaveSpawner,
    tileX: number,
    tileY: number,
    pixelX: number,
    pixelY: number
  ) {
    super(scene, BuildingType.ROTATING_SPIKE_TURRET, tileX, tileY, pixelX, pixelY);
    this.waves = waves;

    const spec = BUILDING_CONFIG[BuildingType.ROTATING_SPIKE_TURRET];
    this.radius = spec.beam.radius;
    this.radiusSq = spec.beam.radius * spec.beam.radius;
    this.thicknessHalf = spec.beam.thickness / 2;
    this.rotationSpeedRadPerSec = spec.beam.rotationSpeedRadPerSec;
    this.dps = spec.beam.dps;
    this.slowFactor = spec.beam.slow.factor;
    this.slowDurationMs = spec.beam.slow.durationMs;

    this.beamGfx = scene.add.graphics();
    this.beamGfx.setDepth(20);
  }

  update(time: number, delta: number): void {
    if (!this.isAlive()) {
      this.beamGfx.clear();
      return;
    }

    const dt = delta / 1000;
    this.beamAngle += this.rotationSpeedRadPerSec * dt;
    if (this.beamAngle > Math.PI * 2) this.beamAngle -= Math.PI * 2;

    const cos = Math.cos(this.beamAngle);
    const sin = Math.sin(this.beamAngle);
    const center = this.getPosition();
    const tipX = center.pixelX + this.radius * cos;
    const tipY = center.pixelY + this.radius * sin;

    const damage = this.dps * dt;
    for (const m of this.waves.getMonsters()) {
      if (!m.isAlive()) continue;
      const mp = m.getPosition();
      const dx = mp.pixelX - center.pixelX;
      const dy = mp.pixelY - center.pixelY;
      const dsq = dx * dx + dy * dy;
      if (dsq > this.radiusSq) continue;

      const projLength = dx * cos + dy * sin;
      if (projLength <= 0 || projLength > this.radius) continue;

      // 수직거리 = |(-sin)·dx + cos·dy|
      const perp = Math.abs(-sin * dx + cos * dy);
      if (perp > this.thicknessHalf) continue;

      m.takeDamage(damage);
      m.applySlow({ factor: this.slowFactor, durationMs: this.slowDurationMs }, time);
    }

    this.drawBeam(center.pixelX, center.pixelY, tipX, tipY);
  }

  private drawBeam(cx: number, cy: number, tx: number, ty: number): void {
    this.beamGfx.clear();
    this.beamGfx.lineStyle(this.thicknessHalf * 2, BEAM_GLOW_COLOR, 0.35);
    this.beamGfx.lineBetween(cx, cy, tx, ty);
    this.beamGfx.lineStyle(2, BEAM_COLOR, 1);
    this.beamGfx.lineBetween(cx, cy, tx, ty);
  }

  override destroy(): void {
    this.beamGfx.destroy();
    super.destroy();
  }
}
