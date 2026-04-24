/**
 * DevSkipButton — 개발용 "다음 페이즈로" 버튼
 *
 * 상단 우측 고정. 현재 페이즈를 즉시 종료하고 다음 페이즈로 전환.
 * Phase 1 MVP 튜닝·디버그용.
 *
 * 구현 주의:
 * - `setInteractive + setScrollFactor(0)` 조합이 일부 환경(카메라 bounds < 캔버스)에서
 *   hit-test가 동작하지 않음. → 씬 레벨 pointerdown에서 스크린 좌표 수동 체크.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import type { PhaseManager } from '../systems/phase-manager';

const LABEL = '⏭ 다음 페이즈';
const W = 140;
const H = 32;

export class DevSkipButton {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly rect: { left: number; right: number; top: number; bottom: number };

  constructor(scene: Phaser.Scene, phaseManager: PhaseManager) {
    const cx = GAME_CONFIG.canvas.width - W / 2 - 10;
    const cy = 24;

    this.bg = scene.add
      .rectangle(cx, cy, W, H, 0x333333)
      .setStrokeStyle(1, 0x888888)
      .setScrollFactor(0)
      .setDepth(1000);

    scene.add
      .text(cx, cy, LABEL, {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    this.rect = {
      left: cx - W / 2,
      right: cx + W / 2,
      top: cy - H / 2,
      bottom: cy + H / 2,
    };

    // 호버 피드백 (pointermove는 interactive 없어도 scene-level로 옴)
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.bg.setFillStyle(this.contains(p) ? 0x555555 : 0x333333);
    });

    // 씬 레벨 pointerdown에서 스크린 좌표 직접 판정
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.contains(p)) phaseManager.skipToNext();
    });
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
