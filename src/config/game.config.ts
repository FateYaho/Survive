/**
 * 게임 인스턴스 전역 설정
 *
 * 관련 문서:
 * - IMPL_PLAN §1.6 Phaser 구체 설정
 */

export const GAME_CONFIG = {
  /** 캔버스 크기 — 가로 16:9 (1280×720) */
  canvas: {
    width: 1280,
    height: 720,
  },

  /** 배경색 */
  backgroundColor: '#1a1a1a',

  /** 목표 FPS — 모바일은 Phase 4+에서 30 하한 */
  targetFps: 60,

  /** 디버그 모드 (개발 시 true, 배포 시 false) */
  debug: {
    /** Arcade Physics 충돌 박스 렌더 */
    physics: false,
    /** 타일 격자선 표시 */
    tileGrid: false,
    /** 콘솔 이벤트 로그 */
    eventLog: false,
  },
} as const;
