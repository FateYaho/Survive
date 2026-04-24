/**
 * ReadyButton — BUILD 페이즈 "준비 완료" 버튼
 *
 * 관련 문서:
 * - IMPL_PLAN §4.4
 *
 * 동작: BUILD 페이즈 진입 시 하단 중앙 표시.
 * 클릭 시 `phase:buildEnd` 발행 → PhaseManager가 다음 낮으로 전환.
 *
 * 구현 주의: `setInteractive + setScrollFactor(0)` 조합 hit-test 이슈로
 * 씬 레벨 pointerdown + 수동 스크린 좌표 판정 사용 (DevSkipButton과 동일 패턴).
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

const LABEL = '준비 완료 (다음 낮으로)';
const W = 260;
const H = 44;

export class ReadyButton {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private readonly rect: { left: number; right: number; top: number; bottom: number };
  private visible = false;

  constructor(scene: Phaser.Scene) {
    const cx = GAME_CONFIG.canvas.width / 2;
    const cy = GAME_CONFIG.canvas.height - 48;

    this.bg = scene.add
      .rectangle(cx, cy, W, H, 0x44cc88)
      .setStrokeStyle(2, 0x228855)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    this.text = scene.add
      .text(cx, cy, LABEL, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    this.rect = {
      left: cx - W / 2,
      right: cx + W / 2,
      top: cy - H / 2,
      bottom: cy + H / 2,
    };

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      this.bg.setFillStyle(this.contains(p) ? 0x55dd99 : 0x44cc88);
    });

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      if (this.contains(p)) scene.events.emit('phase:buildEnd');
    });

    scene.events.on('phase:buildStart', () => this.show());
    scene.events.on('phase:dayStart', () => this.hide());
    scene.events.on('phase:nightStart', () => this.hide());
  }

  private show(): void {
    this.visible = true;
    this.bg.setVisible(true);
    this.text.setVisible(true);
  }

  private hide(): void {
    this.visible = false;
    this.bg.setVisible(false);
    this.text.setVisible(false);
  }

  private contains(p: Phaser.Input.Pointer): boolean {
    return (
      p.x >= this.rect.left &&
      p.x <= this.rect.right &&
      p.y >= this.rect.top &&
      p.y <= this.rect.bottom
    );
  }
}
