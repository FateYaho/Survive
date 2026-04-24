/**
 * PhaseManager — 낮/밤/빌드 페이즈 루프
 *
 * 관련 문서:
 * - GDD §8 (페이즈 구조), §15.1 (시간 구조)
 * - IMPL_PLAN §2.4, 단계 4 (티켓 4.2, 4.5)
 *
 * 전이:
 *   DAY(90s) → NIGHT(60s) → BUILD(무제한) → DAY(cycle+1) ...
 *
 * 이벤트:
 * - `phase:dayStart   { cycle }`
 * - `phase:nightStart { cycle }`
 * - `phase:buildStart { cycle }`
 * - 구독: `phase:buildEnd` (UI 버튼 → 다음 낮으로)
 *
 * Phase 1 MVP 범위: maxCycles(=5) 초과 시 승리 판정은 단계 8에서 추가.
 */

import Phaser from 'phaser';
import { PHASE_CONFIG, getDayDurationMs } from '../config';
import { PhaseType, type PhaseState } from '../types';

export class PhaseManager {
  private readonly scene: Phaser.Scene;
  private state: PhaseState;
  private ended: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = {
      type: PhaseType.DAY,
      timeLeftSeconds: 0,
      cycle: 1,
    };

    scene.events.on('phase:buildEnd', () => this.handleBuildEnd());
    scene.events.on('core:destroyed', () => this.handleCoreDestroyed());
  }

  /** Day 1 시작. GameScene.create()에서 1회 호출 */
  start(): void {
    this.enterDay(1);
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    if (this.state.type === PhaseType.BUILD) return; // 무제한

    this.state.timeLeftSeconds -= delta / 1000;
    if (this.state.timeLeftSeconds > 0) return;

    if (this.state.type === PhaseType.DAY) {
      this.enterNight(this.state.cycle);
    } else if (this.state.type === PhaseType.NIGHT) {
      this.enterBuild(this.state.cycle);
    }
  }

  getState(): Readonly<PhaseState> {
    return this.state;
  }

  /** 개발용: 현재 페이즈를 즉시 종료하고 다음 페이즈로 */
  skipToNext(): void {
    if (this.ended) return;
    if (this.state.type === PhaseType.DAY) {
      this.enterNight(this.state.cycle);
    } else if (this.state.type === PhaseType.NIGHT) {
      this.enterBuild(this.state.cycle);
    } else {
      this.handleBuildEnd();
    }
  }

  private enterDay(cycle: number): void {
    this.state = {
      type: PhaseType.DAY,
      timeLeftSeconds: getDayDurationMs(cycle) / 1000,
      cycle,
    };
    this.scene.events.emit('phase:dayStart', { cycle });
  }

  private enterNight(cycle: number): void {
    this.state = {
      type: PhaseType.NIGHT,
      timeLeftSeconds: PHASE_CONFIG.nightDurationMs / 1000,
      cycle,
    };
    this.scene.events.emit('phase:nightStart', { cycle });
  }

  private enterBuild(cycle: number): void {
    this.state = {
      type: PhaseType.BUILD,
      timeLeftSeconds: -1,
      cycle,
    };
    this.scene.events.emit('phase:buildStart', { cycle });
  }

  private handleBuildEnd(): void {
    if (this.ended) return;
    if (this.state.type !== PhaseType.BUILD) return;

    // 마지막 사이클의 BUILD를 끝냈다 → 승리
    if (this.state.cycle >= PHASE_CONFIG.maxCycles) {
      this.ended = true;
      this.scene.events.emit('game:won', {
        cyclesCleared: this.state.cycle,
      });
      return;
    }

    this.enterDay(this.state.cycle + 1);
  }

  private handleCoreDestroyed(): void {
    if (this.ended) return;
    this.ended = true;
    this.scene.events.emit('game:lost', {
      cycle: this.state.cycle,
      cause: 'core_destroyed',
    });
  }
}
