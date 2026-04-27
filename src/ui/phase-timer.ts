/**
 * PhaseTimer — 상단 중앙 페이즈·남은시간 HUD
 *
 * 관련 문서:
 * - IMPL_PLAN §4.3
 *
 * 성능 가이드: 남은 시간 1초 단위 갱신 (매 프레임 X)
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { PhaseType } from '../types';
import type { PhaseManager } from '../systems/phase-manager';

const PHASE_LABEL: Record<PhaseType, string> = {
  [PhaseType.DAY]: 'DAY',
  [PhaseType.NIGHT]: 'NIGHT',
  [PhaseType.BUILD]: 'BUILD',
};

const PHASE_COLOR: Record<PhaseType, string> = {
  [PhaseType.DAY]: '#ff9944',
  [PhaseType.NIGHT]: '#4477ff',
  [PhaseType.BUILD]: '#44cc88',
};

export class PhaseTimer {
  private readonly phaseManager: PhaseManager;
  private readonly text: Phaser.GameObjects.Text;
  private lastSecond: number = -1;
  private lastType: PhaseType | null = null;
  private lastCycle: number = -1;

  constructor(scene: Phaser.Scene, phaseManager: PhaseManager) {
    this.phaseManager = phaseManager;
    this.text = scene.add
      .text(GAME_CONFIG.canvas.width / 2, 12, '', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 6 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    this.refresh();
  }

  /** GameScene.update에서 호출 — 1초 단위로만 실제 텍스트 변경 */
  update(): void {
    const s = this.phaseManager.getState();
    const sec = s.timeLeftSeconds < 0 ? -1 : Math.ceil(s.timeLeftSeconds);
    if (
      sec === this.lastSecond &&
      s.type === this.lastType &&
      s.cycle === this.lastCycle
    ) {
      return;
    }
    this.lastSecond = sec;
    this.lastType = s.type;
    this.lastCycle = s.cycle;
    this.refresh();
  }

  private refresh(): void {
    const s = this.phaseManager.getState();
    const timeStr =
      s.timeLeftSeconds < 0 ? '∞' : formatSeconds(s.timeLeftSeconds);
    this.text.setText(`${PHASE_LABEL[s.type]} ${s.cycle}  —  ${timeStr}`);
    this.text.setColor(PHASE_COLOR[s.type]);
  }
}

function formatSeconds(totalSec: number): string {
  const t = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
