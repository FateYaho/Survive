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

  /**
   * UI 영역 클릭 차단 zone — 월드 클릭(채집·확장·건물배치)이 HUD 위에서 발화 안 되게.
   * - topZoneHeight: 상단 PhaseTimer + DevSkipButton 영역 (y < N 무시)
   * - bottomZoneHeight: 하단 BuildMenu + ReadyButton 영역 (y > canvas.height - N 무시)
   * HUD 높이 변경 시 여기만 갱신하면 모든 시스템에서 동기화됨.
   */
  ui: {
    topZoneHeight: 48,
    bottomZoneHeight: 140,
  },
} as const;
