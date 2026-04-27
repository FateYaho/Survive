/**
 * 게임 엔트리 포인트
 *
 * Phaser 게임 인스턴스 생성 + Scene 등록.
 * index.html의 #game-container div에 마운트됨.
 *
 * 관련 문서: IMPL_PLAN §1.6 Phaser 구체 설정
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import {
  BootScene,
  PreloadScene,
  TitleScene,
  GameScene,
  GameOverScene,
} from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL 우선, 실패 시 Canvas
  parent: 'game-container',
  width: GAME_CONFIG.canvas.width,
  height: GAME_CONFIG.canvas.height,
  backgroundColor: GAME_CONFIG.backgroundColor,

  scale: {
    // 창 크기 맞춰 비율 유지 (여백 허용)
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // 탑다운이라 중력 없음
      debug: GAME_CONFIG.debug.physics,
    },
  },

  scene: [BootScene, PreloadScene, TitleScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
