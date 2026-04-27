/**
 * CombatSystem — 플레이어 자동 공격 조율자
 *
 * 관련 문서:
 * - GDD §3.6 (플레이어 자동 조준), §10.4 (타깃팅)
 * - IMPL_PLAN §6.2·6.3
 *
 * 책임:
 * - 매 프레임: 플레이어 사거리 내 가장 가까운 몬스터에 hitScan 공격
 * - 쿨다운 관리 (attackSpeed 기반)
 * - 짧은 공격 라인 이펙트 (플레이어 → 몬스터)
 *
 * 몬스터의 공격은 Monster.update 내부에서 처리 (타깃 락킹 로직 몬스터 책임).
 * 터렛 자동 공격은 단계 7에서 추가.
 */

import Phaser from 'phaser';
import { COMBAT_CONFIG, PLAYER_CONFIG } from '../config';
import type { Player } from '../entities/player';
import type { Monster } from '../entities/monster';
import type { WaveSpawner } from './wave-spawner';

const ATTACK_LINE_COLOR = 0xffff88;
const ATTACK_LINE_MS = 80;

export class CombatSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly waves: WaveSpawner;
  private readonly attackLine: Phaser.GameObjects.Graphics;
  private lastAttackTime = 0;

  constructor(scene: Phaser.Scene, player: Player, waves: WaveSpawner) {
    this.scene = scene;
    this.player = player;
    this.waves = waves;
    this.attackLine = scene.add.graphics();
    this.attackLine.setDepth(20);
  }

  update(time: number, _delta: number): void {
    if (!this.player.isAlive()) return;

    const cooldownMs = 1000 / PLAYER_CONFIG.attackSpeed;
    if (time - this.lastAttackTime < cooldownMs) return;

    const target = this.findNearestMonster();
    if (!target) return;

    this.lastAttackTime = time;
    target.takeDamage(PLAYER_CONFIG.attackPower);

    this.flashAttackLine(target);

    this.scene.events.emit('combat:damage', {
      target: target.getState().id,
      amount: PLAYER_CONFIG.attackPower,
      source: 'player',
    });
  }

  private findNearestMonster(): Monster | null {
    const p = this.player.getPosition();
    const rangeSq =
      COMBAT_CONFIG.playerAutoAimRangePx * COMBAT_CONFIG.playerAutoAimRangePx;

    let nearest: Monster | null = null;
    let bestDistSq = rangeSq + 1;
    for (const m of this.waves.getMonsters()) {
      if (!m.isAlive()) continue;
      const mp = m.getPosition();
      const d = (mp.pixelX - p.pixelX) ** 2 + (mp.pixelY - p.pixelY) ** 2;
      if (d <= rangeSq && d < bestDistSq) {
        bestDistSq = d;
        nearest = m;
      }
    }
    return nearest;
  }

  private flashAttackLine(target: Monster): void {
    const p = this.player.getPosition();
    const t = target.getPosition();
    this.attackLine.clear();
    this.attackLine.lineStyle(2, ATTACK_LINE_COLOR, 1);
    this.attackLine.lineBetween(p.pixelX, p.pixelY, t.pixelX, t.pixelY);
    this.scene.time.delayedCall(ATTACK_LINE_MS, () => this.attackLine.clear());
  }
}
