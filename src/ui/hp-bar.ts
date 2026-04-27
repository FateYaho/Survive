/**
 * HpBar — 플레이어·코어 공용 HP 표시
 *
 * 관련 문서:
 * - IMPL_PLAN 단계 6.6
 *
 * 단계 6 MVP: 상단 좌측 아래 쪽에 "PLAYER hp/max", "CORE hp/max" 두 줄 텍스트.
 * 정식 UI(그래픽 바)는 아트 도입 단계에서 교체.
 */

import Phaser from 'phaser';
import type { Player } from '../entities/player';
import type { Core } from '../entities/core';

const LABEL_NORMAL = '#ffffff';
const LABEL_LOW = '#ff8888';

export class HpBar {
  private readonly playerText: Phaser.GameObjects.Text;
  private readonly coreText: Phaser.GameObjects.Text;
  private readonly player: Player;
  private readonly core: Core;

  constructor(scene: Phaser.Scene, player: Player, core: Core) {
    this.player = player;
    this.core = core;

    this.playerText = scene.add
      .text(8, 70, '', {
        fontSize: '14px',
        color: LABEL_NORMAL,
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.coreText = scene.add
      .text(8, 98, '', {
        fontSize: '14px',
        color: LABEL_NORMAL,
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.refresh();

    // 이벤트 변화 시 즉시 갱신 (프레임마다 안 그려도 됨)
    scene.events.on('player:damaged', () => this.refresh());
    scene.events.on('player:downed', () => this.refresh());
    scene.events.on('player:revived', () => this.refresh());
    scene.events.on('core:damaged', () => this.refresh());
    scene.events.on('core:destroyed', () => this.refresh());
  }

  private refresh(): void {
    const p = this.player.getState();
    const c = this.core.getState();

    const pSuffix = p.isDown ? '  (DOWN)' : '';
    this.playerText.setText(`PLAYER  ${p.hp}/${p.maxHp}${pSuffix}`);
    this.playerText.setColor(
      p.hp < p.maxHp * 0.3 ? LABEL_LOW : LABEL_NORMAL
    );

    this.coreText.setText(`CORE    ${c.hp}/${c.maxHp}`);
    this.coreText.setColor(
      c.hp < c.maxHp * 0.3 ? LABEL_LOW : LABEL_NORMAL
    );
  }
}
