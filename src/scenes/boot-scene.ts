/**
 * BootScene
 *
 * 가장 먼저 실행되는 Scene. 로딩 바용 최소 에셋만 로드.
 * PreloadScene으로 즉시 전환.
 *
 * 관련 문서: IMPL_PLAN §1.6 Scene 구성
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // TODO: 로딩 바용 최소 에셋 (로고·progress bar 배경 등) 로드
    // Phase 1 MVP는 로딩 화면 없어도 OK (즉시 전환)
  }

  create(): void {
    // PreloadScene으로 전환
    this.scene.start('PreloadScene');
  }
}
