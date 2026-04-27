/**
 * PhaseManager — 낮/빌드/밤 페이즈 루프
 *
 * 관련 문서:
 * - GDD §8 (페이즈 구조), §15.1 (시간 구조)
 * - IMPL_PLAN §2.4, 단계 4·8
 *
 * 전이:
 *   DAY(90s) → BUILD(무제한, 준비 버튼) → NIGHT(60s) → DAY(cycle+1) ...
 *   NIGHT 종료 시 cycle ≥ maxCycles면 game:won.
 *   core 파괴 시 어느 페이즈에서든 즉시 game:lost.
 *
 * 이벤트:
 * - `phase:dayStart   { cycle }`
 * - `phase:buildStart { cycle }`
 * - `phase:nightStart { cycle }`
 * - `phase:nightEnd   { cycle }` — 통계·승리 판정용
 * - 구독: `phase:buildEnd` (UI 버튼 → 밤 시작)
 * - 구독: `core:destroyed` → game:lost
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
      this.enterBuild(this.state.cycle);
    } else if (this.state.type === PhaseType.NIGHT) {
      this.handleNightEnd();
    }
  }

  getState(): Readonly<PhaseState> {
    return this.state;
  }

  /** 개발용: 현재 페이즈를 즉시 종료하고 다음 페이즈로 */
  skipToNext(): void {
    if (this.ended) return;
    if (this.state.type === PhaseType.DAY) {
      this.enterBuild(this.state.cycle);
    } else if (this.state.type === PhaseType.BUILD) {
      this.handleBuildEnd();
    } else {
      this.handleNightEnd();
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

  private enterBuild(cycle: number): void {
    this.state = {
      type: PhaseType.BUILD,
      timeLeftSeconds: -1,
      cycle,
    };
    this.scene.events.emit('phase:buildStart', { cycle });
  }

  private enterNight(cycle: number): void {
    this.state = {
      type: PhaseType.NIGHT,
      timeLeftSeconds: PHASE_CONFIG.nightDurationMs / 1000,
      cycle,
    };
    this.scene.events.emit('phase:nightStart', { cycle });
  }

  /** BUILD 종료(준비 버튼) → NIGHT 진입 */
  private handleBuildEnd(): void {
    if (this.ended) return;
    if (this.state.type !== PhaseType.BUILD) return;
    this.enterNight(this.state.cycle);
  }

  /** NIGHT 종료 → 다음 DAY. 마지막 사이클이었으면 승리 */
  private handleNightEnd(): void {
    if (this.ended) return;
    const cleared = this.state.cycle;
    this.scene.events.emit('phase:nightEnd', { cycle: cleared });

    if (cleared >= PHASE_CONFIG.maxCycles) {
      this.ended = true;
      this.scene.events.emit('game:won', { cyclesCleared: cleared });
      return;
    }
    this.enterDay(cleared + 1);
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
