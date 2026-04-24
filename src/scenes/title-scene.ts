/**
 * TitleScene — 게임 시작 화면
 *
 * 관련 문서:
 * - IMPL_PLAN §8.4, 단계 8
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

const BTN_W = 220;
const BTN_H = 56;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const cx = GAME_CONFIG.canvas.width / 2;
    const cy = GAME_CONFIG.canvas.height / 2;

    this.add.rectangle(
      cx,
      cy,
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.canvas.height,
      0x111111
    );

    this.add
      .text(cx, cy - 160, '영토 개척 생존기', {
        fontSize: '44px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 105, '탑다운 서바이벌 + 타워디펜스', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 40, '이동 WASD / 채집 F / 확장 좌클릭\n5사이클을 버텨라', {
        fontSize: '16px',
        color: '#cccccc',
        align: 'center',
      })
      .setOrigin(0.5);

    const btnBg = this.add
      .rectangle(cx, cy + 90, BTN_W, BTN_H, 0x44cc88)
      .setStrokeStyle(2, 0xffffff, 0.7);
    this.add
      .text(cx, cy + 90, '시작', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const rect = {
      left: cx - BTN_W / 2,
      right: cx + BTN_W / 2,
      top: cy + 90 - BTN_H / 2,
      bottom: cy + 90 + BTN_H / 2,
    };
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const inside =
        p.x >= rect.left &&
        p.x <= rect.right &&
        p.y >= rect.top &&
        p.y <= rect.bottom;
      btnBg.setFillStyle(inside ? 0x55dd99 : 0x44cc88);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (
        p.x >= rect.left &&
        p.x <= rect.right &&
        p.y >= rect.top &&
        p.y <= rect.bottom
      ) {
        this.scene.start('GameScene');
      }
    });
  }
}
