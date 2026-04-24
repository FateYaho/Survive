/**
 * GameOverScene — 승/패 결과 화면
 *
 * 관련 문서:
 * - IMPL_PLAN §8.3, 단계 8
 *
 * init(data):
 * - { won: boolean, cycle: number, stats? }
 * 버튼:
 * - 다시 하기 → GameScene 재시작
 * - 타이틀로  → TitleScene
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export interface GameOverData {
  won: boolean;
  cycle: number;
  stats?: {
    buildingsBuilt: number;
    monstersKilled: number;
    cyclesCleared: number;
  };
}

const BTN_W = 180;
const BTN_H = 44;

export class GameOverScene extends Phaser.Scene {
  private resultData!: GameOverData;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.resultData = data;
  }

  create(): void {
    const cx = GAME_CONFIG.canvas.width / 2;
    const cy = GAME_CONFIG.canvas.height / 2;

    // 반투명 오버레이
    this.add.rectangle(
      cx,
      cy,
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.canvas.height,
      0x000000,
      0.85
    );

    const { won, cycle, stats } = this.resultData;
    const title = won ? '수호자여, 어둠을 물리쳤다!' : '코어가 파괴되었습니다';
    const color = won ? '#44dd88' : '#ff5555';

    this.add
      .text(cx, cy - 120, title, {
        fontSize: '32px',
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const sub = won
      ? `${cycle}사이클 완주`
      : `사이클 ${cycle}에서 패배`;
    this.add
      .text(cx, cy - 72, sub, {
        fontSize: '18px',
        color: '#cccccc',
      })
      .setOrigin(0.5);

    if (stats) {
      const statsText = [
        `처치한 몬스터: ${stats.monstersKilled}`,
        `건설한 건물: ${stats.buildingsBuilt}`,
        `완료한 사이클: ${stats.cyclesCleared}`,
      ].join('\n');
      this.add
        .text(cx, cy - 10, statsText, {
          fontSize: '16px',
          color: '#dddddd',
          align: 'center',
        })
        .setOrigin(0.5);
    }

    this.makeButton(cx - 100, cy + 80, '다시 하기', 0x44cc88, () =>
      this.scene.start('GameScene')
    );
    this.makeButton(cx + 100, cy + 80, '타이틀로', 0x4488cc, () =>
      this.scene.start('TitleScene')
    );
  }

  /** 수동 hit-test 버튼 (setInteractive hit-test 이슈 회피) */
  private makeButton(
    cx: number,
    cy: number,
    label: string,
    color: number,
    onClick: () => void
  ): void {
    const bg = this.add
      .rectangle(cx, cy, BTN_W, BTN_H, color)
      .setStrokeStyle(2, 0xffffff, 0.7);
    this.add
      .text(cx, cy, label, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const rect = {
      left: cx - BTN_W / 2,
      right: cx + BTN_W / 2,
      top: cy - BTN_H / 2,
      bottom: cy + BTN_H / 2,
    };

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const inside =
        p.x >= rect.left &&
        p.x <= rect.right &&
        p.y >= rect.top &&
        p.y <= rect.bottom;
      bg.setAlpha(inside ? 0.85 : 1);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (
        p.x >= rect.left &&
        p.x <= rect.right &&
        p.y >= rect.top &&
        p.y <= rect.bottom
      ) {
        onClick();
      }
    });
  }
}
