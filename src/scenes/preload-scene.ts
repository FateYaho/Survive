/**
 * PreloadScene
 *
 * 모든 게임 에셋 로드. Phase 1 단계 0~3은 프리미티브만 사용해서 비어있음.
 * 단계 4 진입 시 Kenney 스프라이트시트 로드 추가 (IMPL_PLAN §1.8)
 *
 * 관련 문서: IMPL_PLAN §1.6 Scene 구성, §1.8 에셋 전략
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // 단계 4에서 추가 예정:
    // this.load.spritesheet('tiles', 'assets/kenney/tiles.png', {
    //   frameWidth: 16,
    //   frameHeight: 16,
    // });
    // this.load.spritesheet('characters', 'assets/kenney/characters.png', {
    //   frameWidth: 16,
    //   frameHeight: 16,
    // });
    // this.load.audio('hit', 'assets/sfx/hit.mp3');
    // this.load.audio('collect', 'assets/sfx/collect.mp3');
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
